import {
  from,
  IEnumerable,
  IGrouping,
  Error,
} from 'linq-to-typescript'
import { Queue } from 'queue-typescript'
import { Algorithm } from '../../src/utils/algorithm'
import { RectangleNode } from '../core/geometry/RTree/RectangleNode'
import { RTree } from '../core/geometry/RTree/RTree'
import { Port } from '../core/layout/Port'
import { BundlingSettings } from '../core/routing/BundlingSettings'
import { EdgeRoutingSettings } from '../core/routing/EdgeRoutingSettings'
import { GeomEdge } from '../layout/core/geomEdge'
import { GeomGraph } from '../layout/core/GeomGraph'
import { Curve } from '../math/geometry/curve'
import { CurveFactory } from '../math/geometry/curveFactory'
import { DebugCurve } from '../math/geometry/debugCurve'
import { ICurve } from '../math/geometry/icurve'
import { LineSegment } from '../math/geometry/lineSegment'
import { Point } from '../math/geometry/point'
import { Polyline } from '../math/geometry/polyline'
import { PolylinePoint } from '../math/geometry/polylinePoint'
import { Rectangle } from '../math/geometry/rectangle'
import { SmoothedPolyline } from '../math/geometry/smoothedPolyline'
import { Edge } from '../structs/edge'
import { PointMap } from '../utils/PointMap'
import { Shape } from './Shape'
import { TightLooseCouple } from './TightLooseCouple'
import { VisibilityEdge } from './visibility/VisibilityEdge'
import { VisibilityGraph } from './visibility/VisibilityGraph'
import { EdgeGeometry } from './../layout/core/edgeGeometry'
import { CancelToken } from '../utils/cancelToken'
import { Assert } from '../utils/assert'
import { List } from 'lodash'
import { ShapeCreator } from './ShapeCreator'
import { ShapeCreatorForRoutingToParents } from './ShapeCreatorForRoutingToParents'
import { RelativeFloatingPort } from '../core/layout/RelativeFloatingPort'
import { ClusterBoundaryPort } from './ClusterBoundaryPort'
import { ShapeObstacleCalculator } from './ShapeObstacleCalculator'

function insertRange<T>(collection: Set<T>, elems: IEnumerable<T>) {
  for (const e of elems) collection.add(e)
}

//  routing splines around shapes

export class SplineRouter extends Algorithm {
  OverlapsDetected: boolean

  //  setting this to true forces the calculation to go on even when node overlaps are present
  //
  continueOnOverlaps = true

  public get ContinueOnOverlaps(): boolean {
    return this.continueOnOverlaps
  }
  public set ContinueOnOverlaps(value: boolean) {
    this.continueOnOverlaps = value
  }

  rootShapes: Shape[]

  get edgeGeometriesEnumeration() {
    return this._edges.map((e) => e.edgeGeometry)
  }

  coneAngle: number

  tightPadding: number

  LoosePadding: number

  rootWasCreated: boolean

  root: Shape

  visGraph: VisibilityGraph

  ancestorSets: Map<Shape, Set<Shape>>

  shapesToTightLooseCouples: Map<Shape, TightLooseCouple> = new Map<
    Shape,
    TightLooseCouple
  >()

  portsToShapes: Map<Port, Shape>

  portsToEnterableShapes: Map<Port, Set<Shape>>

  portRTree: RTree<Point, P>

  portLocationsToLoosePolylines = new PointMap<Polyline>()

  looseRoot: Shape

  BundlingSettings: BundlingSettings

  enterableLoose: Map<EdgeGeometry, Set<Polyline>>

  enterableTight: Map<EdgeGeometry, Set<Polyline>>

  geometryGraph: GeomGraph

  multiEdgesSeparation = 5

  routeMultiEdgesAsBundles = true

  UseEdgeLengthMultiplier: boolean

  BundleRouter: BundleRouter

  //  if set to true the algorithm will try to shortcut a shortest polyline inner points
  public UsePolylineEndShortcutting = true

  //  if set to true the algorithm will try to shortcut a shortest polyline start and end
  public UseInnerPolylingShortcutting = true

  AllowedShootingStraightLines = true

  get MultiEdgesSeparation(): number {
    return this.multiEdgesSeparation
  }
  set MultiEdgesSeparation(value: number) {
    this.multiEdgesSeparation = value
  }
  get AdjustedLoosePadding() {
    return this.BundlingSettings == null
      ? this.LoosePadding
      : this.LoosePadding * this.BundleRouter.SuperLoosePaddingCoefficient
  }

  //  Creates a spline group router for the given graph.
  static constructor3_(
    graph: GeomGraph,
    edgeRoutingSettings: EdgeRoutingSettings,
  ) {
    return SplineRouter.constructor5(
      graph,
      edgeRoutingSettings.Padding,
      edgeRoutingSettings.PolylinePadding,
      edgeRoutingSettings.ConeAngle,
      edgeRoutingSettings.BundlingSettings,
    )
  }

  //  Creates a spline group router for the given graph.
  static constructor4(
    graph: GeomGraph,
    tightTightPadding: number,
    loosePadding: number,
    coneAngle: number,
  ) {
    return SplineRouter.constructor6(
      graph,
      graph.edges,
      tightTightPadding,
      loosePadding,
      coneAngle,
      null,
    )
  }

  //  Creates a spline group router for the given graph
  static constructor5(
    graph: GeomGraph,
    tightTightPadding: number,
    loosePadding: number,
    coneAngle: number,
    bundlingSettings: BundlingSettings,
  ) {
    return SplineRouter.constructor6(
      graph,
      graph.edges,
      tightTightPadding,
      loosePadding,
      coneAngle,
      bundlingSettings,
    )
  }

  //  Creates a spline group router for the given graph.
  static constructor6(
    graph: GeomGraph,
    edges: () => IterableIterator<GeomEdge>,
    tightPadding: number,
    loosePadding: number,
    coneAngle: number,
    bundlingSettings: BundlingSettings,
  ) {
    const sp = new SplineRouter(new CancelToken()) // todo : provide cancel token
    sp._edges = [...edges()]
    sp.BundlingSettings = bundlingSettings
    sp.geometryGraph = graph
    sp.LoosePadding = loosePadding
    sp.tightPadding = tightPadding
    const obstacles: IEnumerable<Shape> = ShapeCreator.GetShapes(
      sp.geometryGraph,
    )
    sp.Initialize(obstacles, coneAngle)
    return sp
  }

  _edges: GeomEdge[]

  //
  static constructor_(
    graph: GeomGraph,
    tightPadding: number,
    loosePadding: number,
    coneAngle: number,
    inParentEdges: List<Edge>,
    outParentEdges: List<Edge>,
  ) {
    Assert.assert(graph.CheckClusterConsistency())
    const sp = new SplineRouter(new CancelToken()) // todo provide cancel token
    sp.geometryGraph = graph
    sp.LoosePadding = loosePadding
    sp.tightPadding = tightPadding
    const obstacles: IEnumerable<Shape> = ShapeCreatorForRoutingToParents.GetShapes(
      inParentEdges,
      outParentEdges,
    )
    sp.Initialize(obstacles, coneAngle)
  }

  Initialize(obstacles: IEnumerable<Shape>, coneAngleValue: number) {
    this.rootShapes = obstacles
      .where((s) => s.Parents == null || !from(s.Parents()).any())
      .toArray()
    this.coneAngle = coneAngleValue
    if (this.coneAngle == 0) this.coneAngle = Math.PI / 6
  }

  obstacles: IEnumerable<Shape>

  number: IEnumerable<Shape>

  RouteOnRoot() {
    this.CalculatePortsToShapes()
    this.CalculatePortsToEnterableShapes()
    this.CalculateShapeToBoundaries(root)
    if (this.OverlapsDetected && !this.ContinueOnOverlaps) {
      return
    }

    this.BindLooseShapes()
    this.SetLoosePolylinesForAnywherePorts()
    this.CalculateVisibilityGraph()
    this.RouteOnVisGraph()
  }

  CalculatePortsToEnterableShapes() {
    this.portsToEnterableShapes = new Map<Port, Set<Shape>>()
    for (const [port, shape] of this.portsToShapes) {
      const setOfShapes = new Set<Shape>()
      if (!this.EdgesAttachedToPortAvoidTheNode(port)) {
        setOfShapes.add(shape)
      }

      this.portsToEnterableShapes.set(port, setOfShapes)
    }

    for (const rootShape of this.rootShapes) {
      for (const sh of rootShape.Descendants()) {
        for (const port of sh.Ports) {
          const enterableSet = this.portsToEnterableShapes.get(port)
          insertRange(
            enterableSet,
            from(sh.Ancestors()).where((s) => s.BoundaryCurve != null),
          )
        }
      }
    }
  }

  SetLoosePolylinesForAnywherePorts() {
    for (const [shape, val] of this.shapesToTightLooseCouples) {
      for (const port of shape.Ports) {
        if (port.hasOwnProperty('LoosePolyline')) {
          ; (port as ClusterBoundaryPort).LoosePolyline = <Polyline>(
            val.LooseShape.BoundaryCurve
          )
        }
      }
    }
  }

  BindLooseShapes() {
    this.looseRoot = new Shape()
    for (const shape of this.root.Children()) {
      const looseShape = this.shapesToTightLooseCouples.get(shape).LooseShape
      this.BindLooseShapesUnderShape(shape)
      this.looseRoot.AddChild(looseShape)
    }
  }

  BindLooseShapesUnderShape(shape: Shape) {
    const loose = this.shapesToTightLooseCouples.get(shape).LooseShape
    for (const child of shape.Children()) {
      const childLooseShape = this.shapesToTightLooseCouples.get(child)
        .LooseShape
      loose.AddChild(childLooseShape)
      this.BindLooseShapesUnderShape(child)
    }
  }
  CalculateShapeToBoundaries(shape: Shape) {
    if (!from(shape.Children()).any()) {
      return
    }

    for (const child of shape.Children()) {
      this.CalculateShapeToBoundaries(child)
    }

    const obstacleCalculator = new ShapeObstacleCalculator(
      shape,
      this.tightPadding,
      this.AdjustedLoosePadding,
      this.shapesToTightLooseCouples,
    )
    obstacleCalculator.Calculate()
    this.OverlapsDetected =
      this.OverlapsDetected || obstacleCalculator.OverlapsDetected
  }

  //                 UnknownRouteOnVisGraph();
  //                 {
  //                     ancestorSets = GetAncestorSetsMap(root.Descendants);
  //                     if ((BundlingSettings == null)) {
  //                         for (const edgeGroup; of; _edges.GroupBy(EdgePassport)) {
  //                             const passport = edgeGroup.Key;
  //                             const obstacleShapes: Set<Shape> = GetObstaclesFromPassport(passport);
  //                             const interactiveEdgeRouter = CreateInteractiveEdgeRouter(obstacleShapes);
  //                             RouteEdgesWithTheSamePassport(edgeGroup, interactiveEdgeRouter, obstacleShapes);
  //                         }

  //                     }
  //                     else {
  //                         RouteBundles();
  //                     }

  //                     UnknownRouteEdgesWithTheSamePassport((IGrouping < Set), (Edge > edgeGeometryGroup), InteractiveEdgeRouter, interactiveEdgeRouter, Set, obstacleShapes);
  //                     {
  //                         if (RouteMultiEdgesAsBundles) {
  //                             SplitOnRegularAndMultiedges(edgeGeometryGroup, /* out */regularEdges, /* out */multiEdges);
  //                             for (const edge; of; regularEdges) {
  //                                 RouteEdge(interactiveEdgeRouter, edge);
  //                             }

  //                             if ((multiEdges != null)) {
  //                                 ScaleDownLooseHierarchy(interactiveEdgeRouter, obstacleShapes);
  //                                 RouteMultiEdges(multiEdges, interactiveEdgeRouter, edgeGeometryGroup.Key);
  //                             }

  //                         }
  //                         else {
  //                             for (const eg; of; edgeGeometryGroup) {
  //                                 RouteEdge(interactiveEdgeRouter, eg);
  //                             }

  //                         }

  //                         UnknownRouteEdge(InteractiveEdgeRouter, interactiveEdgeRouter, Edge, edge);
  //                         {
  //                             ProgressStep();
  //                             RouteEdgeGeometry(edge, interactiveEdgeRouter);
  //                             SetTransparency(transparentShapes, false);
  //                             UnknownScaleDownLooseHierarchy(InteractiveEdgeRouter, interactiveEdgeRouter, Set, obstacleShapes);
  //                             {
  //                                 for (const obstacleShape; of; obstacleShapes) {
  //                                     const tl = shapesToTightLooseCouples[obstacleShape];
  //                                     loosePolys.Add(InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, (tl.Distance / BundleRouter.SuperLoosePaddingCoefficient)));
  //                                 }

  //                                 interactiveEdgeRouter.LooseHierarchy = CreateLooseObstacleHierarachy(loosePolys);
  //                                 interactiveEdgeRouter.ClearActivePolygons();
  //                                 interactiveEdgeRouter.AddActivePolygons(loosePolys.Select(() => { }, new Polygon(polyline)));
  //                                 UnknownRouteMultiEdges((List
  //                                     < (Edge[] > multiEdges)), InteractiveEdgeRouter, interactiveEdgeRouter, Set, parents);
  //                                 {// giving more importance to ink might produce weird routings with huge detours, maybe 0 is the best value here
  //                                     mer.Run();
  //                                     Unknown//          ScaleLoosePolylinesOfInvolvedShapesDown(Set<Shape> parents) {
  //                                     //             for (var parent of parents) {
  //                                     //                 for (var shape of parent.Descendands) {
  //                                     //                     TightLooseCouple tl = this.shapesToTightLooseCouples[shape];
  //                                     //                     tl.LooseShape.BoundaryCurveBackup = tl.LooseShape.BoundaryCurve;
  //                                     //                     tl.LooseShape.BoundaryCurve = InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, tl.Distance / BundleRouter.SuperLoosePaddingCoefficient);
  //                                     //                 }
  //                                     //             }
  //                                     //         }
  //                                     //
  //                                     //          RestoreLoosePolylinesOfInvolvedShapes(Set<Shape> parents) {
  //                                     //             for (var parent of parents) {
  //                                     //                 for (var shape of parent.Descendands) {
  //                                     //                     TightLooseCouple tl = shapesToTightLooseCouples[shape];
  //                                     //                     tl.LooseShape.BoundaryCurve = tl.LooseShape.BoundaryCurveBackup;
  //                                     //                 }
  //                                     //             }
  //                                     //         }
  //                                     SplitOnRegularAndMultiedges(IEnumerable, edges, /* out */List, regularEdges, /* out */(List
  //                                         < (Edge[] > multiEdges)));
  //                                     {
  //                                         regularEdges = new List<Edge>();
  //                                         for (const eg; of; edges) {
  //                                             if (IsEdgeToParent(eg.EdgeGeometry)) {
  //                                                 regularEdges.Add(eg);
  //                                             }
  //                                             else {
  //                                                 RegisterInPortLocationsToEdges(eg, portLocationPairsToEdges);
  //                                             }

  //                                         }

  //                                         multiEdges = null;
  //                                         for (const edgeGroup; of; portLocationPairsToEdges.Values) {
  //                                             if (((edgeGroup.Count == 1)
  //                                                 || OverlapsDetected)) {
  //                                                 regularEdges.AddRange(edgeGroup);
  //                                             }
  //                                             else {
  //                                                 if ((multiEdges == null)) {
  //                                                     multiEdges = new List<Edge[]>();
  //                                                 }

  //                                                 multiEdges.Add(edgeGroup.ToArray());
  //                                             }

  //                                         }

  //                                         UnknownstaticRegisterInPortLocationsToEdges(Edge, eg, (Dictionary < PointPair), ((List < Edge)
  //                                             + portLocationPairsToEdges));
  //                                         {
  //                                             if (!portLocationPairsToEdges.TryGetValue(pp, /* out */list)) {
  //                                                 list = new List<Edge>();
  //                                             }

  //                                             list.Add(eg);
  //                                             UnknownRouteBundles();
  //                                             {
  //                                                 ScaleLooseShapesDown();
  //                                                 CalculateEdgeEnterablePolylines();
  //                                                 bundleRouter.Run();
  //                                                 UnknownCreateTheMapToParentLooseShapes(Shape, shape, Dictionary, loosePolylinesToLooseParentShapeMap);
  //                                                 {
  //                                                     for (const childShape; of; shape.Children) {
  //                                                         const tightLooseCouple = shapesToTightLooseCouples[childShape];
  //                                                         const poly = tightLooseCouple.LooseShape.BoundaryCurve;
  //                                                         loosePolylinesToLooseParentShapeMap[poly] = shape;
  //                                                         CreateTheMapToParentLooseShapes(childShape, loosePolylinesToLooseParentShapeMap);
  //                                                     }

  //                                                     UnknownCalculateEdgeEnterablePolylines();
  //                                                     {
  //                                                         enterableLoose = new Dictionary<EdgeGeometry, Set<Polyline>>();
  //                                                         enterableTight = new Dictionary<EdgeGeometry, Set<Polyline>>();
  //                                                         for (const edgeGeometry; of; edgeGeometriesEnumeration) {
  //                                                             const looseSet: Set<Polyline>;
  //                                                             const tightSet: Set<Polyline>;
  //                                                             GetEdgeEnterablePolylines(edgeGeometry, /* out */looseSet, /* out */tightSet);
  //                                                             enterableLoose[edgeGeometry] = looseSet;
  //                                                             enterableTight[edgeGeometry] = tightSet;
  //                                                         }

  //                                                         UnknownGetEdgeEnterablePolylines(EdgeGeometry, edgeGeometry, /* out */Set, looseEnterable, /* out */Set, tightEnterable);
  //                                                         {
  //                                                             looseEnterable = new Set<Polyline>();
  //                                                             tightEnterable = new Set<Polyline>();
  //                                                             if ((sourceShape != root)) {
  //                                                                 looseEnterable.InsertRange(ancestorSets[sourceShape].Select(LoosePolyOfOriginalShape).Where(() => { }, (p != null)));
  //                                                                 tightEnterable.InsertRange(ancestorSets[sourceShape].Select(TightPolyOfOriginalShape).Where(() => { }, (p != null)));
  //                                                             }

  //                                                             if ((targetShape != root)) {
  //                                                                 looseEnterable.InsertRange(ancestorSets[targetShape].Select(LoosePolyOfOriginalShape).Where(() => { }, (p != null)));
  //                                                                 tightEnterable.InsertRange(ancestorSets[targetShape].Select(TightPolyOfOriginalShape).Where(() => { }, (p != null)));
  //                                                             }

  //                                                             UnknownScaleLooseShapesDown();
  //                                                             {
  //                                                                 for (const shapesToTightLooseCouple; of; shapesToTightLooseCouples) {
  //                                                                     const tl = shapesToTightLooseCouple.Value;
  //                                                                     tl.LooseShape.BoundaryCurve = InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, (tl.Distance / BundleRouter.SuperLoosePaddingCoefficient));
  //                                                                 }

  //                                                                 UnknownCalculatePortsToShapes();
  //                                                                 {
  //                                                                     portsToShapes = new Dictionary<Port, Shape>();
  //                                                                     for (const shape; of; root.Descendants) {
  //                                                                         for (const port; of; shape.Ports) {
  //                                                                             portsToShapes[port] = shape;
  //                                                                         }

  //                                                                     }

  //                                                                     // assign all orphan ports to the root
  //                                                                     for (const port; of; AllPorts().Where(() => { }, !portsToShapes.ContainsKey(p))) {
  //                                                                         root.Ports.Insert(port);
  //                                                                         portsToShapes[port] = root;
  //                                                                     }

  //                                                                     UnknownRouteEdgeGeometry(Edge, edge, InteractiveEdgeRouter, iRouter);
  //                                                                     {
  //                                                                         if (!(edgeGeometry.SourcePort instanceof HookUpAnywhereFromInsidePort)) {
  //                                                                             addedEdges.AddRange(AddVisibilityEdgesFromPort(edgeGeometry.SourcePort));
  //                                                                         }

  //                                                                         if (!(edgeGeometry.TargetPort instanceof HookUpAnywhereFromInsidePort)) {
  //                                                                             addedEdges.AddRange(AddVisibilityEdgesFromPort(edgeGeometry.TargetPort));
  //                                                                         }

  //                                                                         if (!Point.closeDistEps(edgeGeometry.SourcePort.Location, edgeGeometry.TargetPort.Location)) {
  //                                                                             edgeGeometry.Curve = iRouter.RouteSplineFromPortToPortWhenTheWholeGraphIsReady(edgeGeometry.SourcePort, edgeGeometry.TargetPort, true, /* out */smoothedPolyline);
  //                                                                         }
  //                                                                         else {
  //                                                                             edgeGeometry.Curve = Edge.RouteSelfEdge(edgeGeometry.SourcePort.Curve, Math.Max((LoosePadding * 2), edgeGeometry.GetMaxArrowheadLength()), /* out */smoothedPolyline);
  //                                                                         }

  //                                                                         edgeGeometry.SmoothedPolyline = smoothedPolyline;
  //                                                                         if ((edgeGeometry.Curve == null)) {
  //                                                                             throw new NotImplementedException();
  //                                                                         }

  //                                                                         for (const visibilityEdge; of; addedEdges) {
  //                                                                             VisibilityGraph.RemoveEdge(visibilityEdge);
  //                                                                         }

  //                                                                         Arrowheads.TrimSplineAndCalculateArrowheads(edgeGeometry, edgeGeometry.SourcePort.Curve, edgeGeometry.TargetPort.Curve, edgeGeometry.Curve, false, KeepOriginalSpline);
  //                                                                         if ((ReplaceEdgeByRails != null)) {
  //                                                                             ReplaceEdgeByRails(edge);
  //                                                                         }

  //                                                                         //   SetTransparency(transparentShapes, false);
  //                                                                         Unknown#
  //                                                                         const debugging: region;
  // #if((TEST_MSAGL && TEST_MSAGL))
  //                                                                         staticAnotherShowMethod(VisibilityGraph, visGraph, Port, sourcePort, Port, targetPort, IEnumerable, obstacleShapes, ICurve, curve);
  //                                                                         {
  //                                                                             if ((obstacleShapes != null)) {
  //                                                                                 dd.AddRange(obstacleShapes.Select(() => { }, new DebugCurve(1, s.BoundaryCurve)));
  //                                                                             }

  //                                                                             if (((sourcePort != null)
  //                                                                                 && (targetPort != null))) {
  //                                                                                 dd.AddRange(new, [);
  //                                                                             }

  //                                                                             Unknown{
  //                                                                                 new DebugCurve(CurveFactory.CreateDiamond(3, 3, sourcePort.Location));
  // , new DebugCurve(CurveFactory.CreateEllipse(3, 3, targetPort.Location));
  // , UnknownUnknownif((curve != null)) {
  //                                                                                     dd.Add(new DebugCurve(5, "purple", curve));
  //                                                                                 }

  //                                                                                 LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dd);
  //                                                                                 Unknown#endif
  // #
  //                                                                                 const IEnumerable: endregion;
  //                                                                                 <(Shape >GetTransparentShapes(Port, sourcePort, Port, targetPort, Shape, sourceShape, Shape, targetShape));
  //                                                                                 {
  //                                                                                     for (const s; of; ancestorSets[sourceShape]) {
  //                                                                                         const s: yield;
  //                                                                                     }

  //                                                                                     for (const s; of; ancestorSets[targetShape]) {
  //                                                                                         const s: yield;
  //                                                                                     }

  //                                                                                     if ((!routingOutsideOfSourceBoundary
  //                                                                                         && !routingOutsideOfTargetBoundary)) {
  //                                                                                         const sourceShape: yield;
  //                                                                                         const targetShape: yield;
  //                                                                                     }
  //                                                                                     else if (routingOutsideOfSourceBoundary) {
  //                                                                                         if (IsAncestor(sourceShape, targetShape)) {
  //                                                                                             const sourceShape: yield;
  //                                                                                         }

  //                                                                                     }
  //                                                                                     else if (IsAncestor(targetShape, sourceShape)) {
  //                                                                                         const targetShape: yield;
  //                                                                                     }

  //                                                                                     UnknownstaticSetTransparency(IEnumerable, shapes, bool, v);
  //                                                                                     {
  //                                                                                         for (const shape: Shape; of; shapes) {
  //                                                                                             shape.IsTransparent = v;
  //                                                                                         }

  //                                                                                         UnknownCalculateVisibilityGraph();
  //                                                                                         {
  //                                                                                             portRTree = new RTree<Point, P>(setOfPortLocations.Select(() => { }, new KeyValuePair<Rectangle, Point>(new Rectangle(p), p)));
  //                                                                                             visGraph = new VisibilityGraph();
  //                                                                                             FillVisibilityGraphUnderShape(root);
  //                                                                                             // ShowVisGraph(visGraph, new Set<Polyline>(shapesToTightLooseCouples.Values.Select(tl => (Polyline)(tl.LooseShape.BoundaryCurve))),
  //                                                                                             //   geometryGraph.Nodes.Select(n => n.BoundaryCurve).Concat(root.Descendants.Select(d => d.BoundaryCurve)), null);
  //                                                                                             UnknownprivateProcessHookAnyWherePorts(Set, setOfPortLocations);
  //                                                                                             {
  //                                                                                                 for (const edgeGeometry; of; edgeGeometriesEnumeration) {
  //                                                                                                     if (!(edgeGeometry.SourcePort instanceof ((HookUpAnywhereFromInsidePort || edgeGeometry.SourcePort) instanceof ClusterBoundaryPort))) {
  //                                                                                                         setOfPortLocations.Insert(edgeGeometry.SourcePort.Location);
  //                                                                                                     }

  //                                                                                                     // TODO: Warning!!!, inline IF is not supported ?
  //                                                                                                     (LineSweeperPorts != null);
  //                                                                                                     new Set<Point>();
  //                                                                                                     if (!(edgeGeometry.TargetPort instanceof ((HookUpAnywhereFromInsidePort || edgeGeometry.TargetPort) instanceof ClusterBoundaryPort))) {
  //                                                                                                         setOfPortLocations.Insert(edgeGeometry.TargetPort.Location);
  //                                                                                                     }

  //                                                                                                 }

  //                                                                                                 Unknown//  this function might change the shape's loose polylines by inserting new points
  //                                                                                                 FillVisibilityGraphUnderShape(Shape, shape);
  //                                                                                                 {
  //                                                                                                     for (const child: Shape; of; children) {
  //                                                                                                         FillVisibilityGraphUnderShape(child);
  //                                                                                                     }

  //                                                                                                     coneSpanner.Run();
  //                                                                                                     // now run the spanner again to create the correct visibility graph around the inner obstacles
  //                                                                                                     tmpVisGraph = new VisibilityGraph();
  //                                                                                                     coneSpanner = new ConeSpanner(obstacles, tmpVisGraph, coneAngle, portLocations, looseBoundary);
  //                                                                                                     coneSpanner.Run();
  //                                                                                                     ProgressStep();
  //                                                                                                     for (const edge: VisibilityEdge; of; tmpVisGraph.Edges) {
  //                                                                                                         TryToCreateNewEdgeAndSetIsPassable(edge, looseShape);
  //                                                                                                     }

  //                                                                                                     AddBoundaryEdgesToVisGraph(looseBoundary);
  //                                                                                                     //             if (obstacles.Count > 0)
  //                                                                                                     //                 SplineRouter.ShowVisGraph(tmpVisGraph, obstacles, null, null);
  //                                                                                                     Unknown#if(TEST_MSAGL)
  //                                                                                                     staticShowVisGraph(VisibilityGraph, tmpVisGraph, IEnumerable, obstacles, IEnumerable, greenCurves, IEnumerable, redCurves);
  //                                                                                                     {
  //                                                                                                         if ((obstacles != null)) {
  //                                                                                                             l.AddRange(obstacles.Select(() => { }, new DebugCurve(100, 1, "brown", p)));
  //                                                                                                         }

  //                                                                                                         if ((greenCurves != null)) {
  //                                                                                                             l.AddRange(greenCurves.Select(() => { }, new DebugCurve(100, 10, "navy", p)));
  //                                                                                                         }

  //                                                                                                         if ((redCurves != null)) {
  //                                                                                                             l.AddRange(redCurves.Select(() => { }, new DebugCurve(100, 10, "red", p)));
  //                                                                                                         }

  //                                                                                                         LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
  //                                                                                                         Unknown#endif
  //                                                                                                         TryToCreateNewEdgeAndSetIsPassable(VisibilityEdge, edge, Shape, looseShape);
  //                                                                                                         {
  //                                                                                                             if ((e != null)) {
  //                                                                                                                 return;
  //                                                                                                             }

  //                                                                                                             e = visGraph.addEdge(edge.SourcePoint, edge.TargetPoint);
  //                                                                                                             if ((looseShape != null)) {
  //                                                                                                             }

  // =(GreaterlooseShape.IsTransparent;
  //                                                                                                             UnknownAddBoundaryEdgesToVisGraph(Polyline, boundary);
  //                                                                                                             {
  //                                                                                                                 if ((boundary == null)) {
  //                                                                                                                     return;
  //                                                                                                                 }

  //                                                                                                                 for (
  //                                                                                                                     ; true;
  //                                                                                                                 ) {
  //                                                                                                                     const pn = p.NextOnPolyline;
  //                                                                                                                     // TODO: Warning!!!, inline IF is not supported ?
  //                                                                                                                     shapesToTightLooseCouples.TryGetValue(shape, /* out */tightLooseCouple);
  //                                                                                                                     null;
  //                                                                                                                     // TODO: Warning!!!, inline IF is not supported ?
  //                                                                                                                     ((e.IsPassable != null)
  //                                                                                                                         && e.IsPassable());
  //                                                                                                                     "black";
  //                                                                                                                     visGraph.addEdge(p.point, pn.point);
  //                                                                                                                     if ((pn == boundary.startPoint)) {
  //                                                                                                                         break;
  //                                                                                                                     }

  //                                                                                                                     p = pn;
  //                                                                                                                 }

  //                                                                                                                 Unknown//  creates a root; a shape with BoundaryCurve set to null
  //                                                                                                                 GetOrCreateRoot();
  //                                                                                                                 {
  //                                                                                                                     if ((rootShapes.Count() == 0)) {
  //                                                                                                                         return;
  //                                                                                                                     }

  //                                                                                                                     if ((rootShapes.Count() == 1)) {
  //                                                                                                                         const r: Shape = rootShapes.First();
  //                                                                                                                         if ((r.BoundaryCurve == null)) {
  //                                                                                                                             root = r;
  //                                                                                                                             return;
  //                                                                                                                         }

  //                                                                                                                     }

  //                                                                                                                     rootWasCreated = true;
  //                                                                                                                     root = new Shape();
  // #if(TEST_MSAGL)
  //                                                                                                                     root.UserData = "root";
  // #endif
  //                                                                                                                     for (const rootShape; of; rootShapes) {
  //                                                                                                                         root.AddChild(rootShape);
  //                                                                                                                     }

  //                                                                                                                     UnknownRemoveRoot();
  //                                                                                                                     {
  //                                                                                                                         if (rootWasCreated) {
  //                                                                                                                             for (const rootShape; of; rootShapes) {
  //                                                                                                                                 rootShape.RemoveParent(root);
  //                                                                                                                             }

  //                                                                                                                         }

  //                                                                                                                         Unknown#if(TEST_MSAGL)
  //                                                                                                                         staticShow(IEnumerable, edgeGeometries, IEnumerable, listOfShapes);
  //                                                                                                                         {
  //                                                                                                                             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(listOfShapes.Select(() => { }, s.BoundaryCurve).Select(() => { }, new DebugCurve(50, 1, DebugCurve.Colors[r.next((DebugCurve.Colors.length - 1))], c)).Concat(edgeGeometries.Select(() => { }, new DebugCurve(100, 1, "red", e.Curve))));
  //                                                                                                                             Unknown#endif
  //                                                                                                                             staticCreatePortsIfNeeded(IEnumerable, edges);
  //                                                                                                                             {
  //                                                                                                                                 for (const edge; of; edges) {
  //                                                                                                                                     if ((edge.SourcePort == null)) {
  //                                                                                                                                         const e = edge;
  //         #if(SHARPKIT)
  //                                                                                                                                         new RelativeFloatingPort(() => { }, ed.Source.BoundaryCurve, () => { }, ed.Source.Center);
  //         #else
  //                                                                                                                                         edge.SourcePort = new RelativeFloatingPort(() => { }, e.Source.BoundaryCurve, () => { }, e.Source.Center);
  //         #endif
  //                                                                                                                                     }

  //                                                                                                                                     if ((edge.TargetPort == null)) {
  //                                                                                                                                         const e = edge;
  //         #if(SHARPKIT)
  //                                                                                                                                         new RelativeFloatingPort(() => { }, ed.Target.BoundaryCurve, () => { }, ed.Target.Center);
  //         #else
  //                                                                                                                                         edge.TargetPort = new RelativeFloatingPort(() => { }, e.Target.BoundaryCurve, () => { }, e.Target.Center);
  //         #endif
  //                                                                                                                                     }

  //                                                                                                                                 }

  //                                                                                                                                 UnknownUnknownUnknown

  //     static EdgesAttachedToPortAvoidTheNode(port: Port): boolean {
  //         return (port instanceof ((CurvePort || port) instanceof ClusterBoundaryPort));
  //     }

  //     loose: var = shapesToTightLooseCouples[shape].LooseShape;

  //     obstacleCalculator: var = new ShapeObstacleCalculator(shape, tightPadding, AdjustedLoosePadding, shapesToTightLooseCouples);

  //     //  set to true if and only if there are overlaps of tight obstacles
  //     public get OverlapsDetected(): boolean {
  //     }
  //     public set OverlapsDetected(value: boolean) {
  //     }

  //     get AdjustedLoosePadding(): number {
  //         return (BundlingSettings == null);
  //         // TODO: Warning!!!, inline IF is not supported ?
  //         // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  //         ;
  //     }

  //     regularEdges: List<Edge>;

  //     multiEdges: List<Edge[]>;

  //     //  if set to true routes multi edges as ordered bundles
  //     public get RouteMultiEdgesAsBundles(): boolean {
  //         return routeMultiEdgesAsBundles;
  //     }
  //     public set RouteMultiEdgesAsBundles(value: boolean) {
  //         routeMultiEdgesAsBundles = value;
  //     }

  //     transparentShapes: var = MakeTransparentShapesOfEdgeGeometryAndGetTheShapes(edge.EdgeGeometry);

  //     loosePolys: var = new List<Polyline>();

  //     mer: var = new MultiEdgeRouter(multiEdges, interactiveEdgeRouter, parents.SelectMany(() => { }, p.Children).Select(() => { }, s.BoundaryCurve), [][
  //         InkImportance = 0.00001,
  //         EdgeSeparation = MultiEdgesSeparation], MakeTransparentShapesOfEdgeGeometryAndGetTheShapes);

  //     portLocationPairsToEdges: var = new Dictionary<PointPair, List<Edge>>();

  //     list: List<Edge>;

  //     pp: var = new PointPair(eg.SourcePort.Location, eg.TargetPort.Location);

  //     static IsEdgeToParent(e: EdgeGeometry): boolean {
  //         return (e.SourcePort instanceof ((HookUpAnywhereFromInsidePort || e.TargetPort) instanceof HookUpAnywhereFromInsidePort));
  //         portLocationPairsToEdges[pp] = new List<Edge>();
  //     }

  //     CreateInteractiveEdgeRouter(obstacleShapes: IEnumerable<Shape>): InteractiveEdgeRouter {
  //         // we need to create a set here because one loose polyline can hold several original shapes
  //         const loosePolys = new Set<Polyline>(obstacleShapes.Select(() => { }, (<Polyline>(shapesToTightLooseCouples[sh].LooseShape.BoundaryCurve))));
  //         const router = [][
  //             VisibilityGraph = visGraph,
  //             TightHierarchy = CreateTightObstacleHierarachy(obstacleShapesUnknown,
  //                 LooseHierarchy = CreateLooseObstacleHierarachy(loosePolysUnknown,
  //                     UseSpanner = true,
  //                     LookForRoundedVertices = true,
  //                     TightPadding = tightPadding,
  //                     LoosePadding = LoosePadding,
  //                     UseEdgeLengthMultiplier = UseEdgeLengthMultiplier,
  //                     UsePolylineEndShortcutting = UsePolylineEndShortcutting,
  //                     UseInnerPolylingShortcutting = UseInnerPolylingShortcutting,
  //                     AllowedShootingStraightLines = AllowedShootingStraightLines,
  //                     CacheCorners = CacheCornersForSmoothing];
  //         router.AddActivePolygons(loosePolys.Select(() => { }, new Polygon(polyline)));
  //         return router;
  //     }

  //     //
  //     public get CacheCornersForSmoothing(): boolean {
  //     }
  //     public set CacheCornersForSmoothing(value: boolean) {
  //     }

  //     GetObstaclesFromPassport(passport: Set<Shape>): Set<Shape> {
  //         if ((passport.Count == 0)) {
  //             return new Set<Shape>(root.Children);
  //         }

  //         const commonAncestors = GetCommonAncestorsAbovePassport(passport);
  //         const allAncestors = GetAllAncestors(passport);
  //         const ret = new Set<Shape>(passport.SelectMany(() => { }, p.Children.Where(() => { }, !allAncestors.Contains(child))));
  //         const enqueued = new Set<Shape>(passport.Concat(ret));
  //         const queue = new Queue<Shape>();
  //         for (const shape; of; passport.Where(() => { }, !commonAncestors.Contains(shape))) {
  //             queue.Enqueue(shape);
  //         }

  //         while ((queue.Count > 0)) {
  //             const a = queue.Dequeue();
  //             for (const parent; of; a.Parents) {
  //                 for (const sibling; of; parent.Children) {
  //                     if (!allAncestors.Contains(sibling)) {
  //                         ret.Insert(sibling);
  //                     }

  //                 }

  //                 if ((!commonAncestors.Contains(parent)
  //                     && !enqueued.Contains(parent))) {
  //                     queue.Enqueue(parent);
  //                     enqueued.Insert(parent);
  //                 }

  //             }

  //         }

  //         return ret;
  //     }

  //     GetAllAncestors(passport: Set<Shape>): Set<Shape> {
  //         if (!passport.Any()) {
  //             return new Set<Shape>();
  //         }

  //         const ret = new Set<Shape>(passport);
  //         for (const shape; of; passport) {
  //             ret = (ret + ancestorSets[shape]);
  //         }

  //         return ret;
  //     }

  //     GetCommonAncestorsAbovePassport(passport: Set<Shape>): Set<Shape> {
  //         if (!passport.Any()) {
  //             return new Set<Shape>();
  //         }

  //         const ret = ancestorSets[passport.First()];
  //         for (const shape; of; passport.Skip(1)) {
  //             ret = (ret * ancestorSets[shape]);
  //         }

  //         return ret;
  //     }

  //     looseHierarchy: var = GetLooseHierarchy();

  //     cdt: var = BundleRouter.CreateConstrainedDelaunayTriangulation(looseHierarchy);

  //     //  CdtSweeper.ShowFront(cdt.GetTriangles(), null, null,this.visGraph.Edges.Select(e=>new LineSegment(e.SourcePoint,e.TargetPoint)));
  //     shortestPath: var = new SdShortestPath(MakeTransparentShapesOfEdgeGeometryAndGetTheShapes, cdt, FindCdtGates(cdt));

  //     bundleRouter: var = new BundleRouter(geometryGraph, shortestPath, visGraph, BundlingSettings, LoosePadding, GetTightHierarchy(), looseHierarchy, enterableLoose, enterableTight, () => { }, LoosePolyOfOriginalShape(portsToShapes[port]));

  //     FindCdtGates(cdt: Cdt): Set<CdtEdge> {
  //         const loosePolylinesToLooseParentShapeMap: Dictionary<ICurve, Shape> = new Dictionary<ICurve, Shape>();
  //         CreateTheMapToParentLooseShapes(root, loosePolylinesToLooseParentShapeMap);
  //         // looking for Cdt edges connecting two siblings; only those we define as gates
  //         const gates = new Set<CdtEdge>();
  //         for (const cdtSite; of; cdt.PointsToSites.Values) {
  //             for (const cdtEdge; of; cdtSite.Edges) {
  //                 if (((cdtEdge.CwTriangle == null)
  //                     && (cdtEdge.CcwTriangle == null))) {
  //                     // TODO: Warning!!! continue If
  //                 }

  //                 const a = (<Polyline>(cdtSite.Owner));
  //                 const b = (<Polyline>(cdtEdge.lowerSite.Owner));
  //                 if ((a == b)) {
  //                     // TODO: Warning!!! continue If
  //                 }

  //                 const aParent: Shape;
  //                 const bParent: Shape;
  //                 if ((loosePolylinesToLooseParentShapeMap.TryGetValue(a, /* out */aParent)
  //                     && (loosePolylinesToLooseParentShapeMap.TryGetValue(b, /* out */bParent)
  //                         && (aParent == bParent)))) {
  //                     gates.Insert(cdtEdge);
  //                 }

  //             }

  //         }

  //         // CdtSweeper.ShowFront(cdt.GetTriangles(), null,
  //         //                     gates.Select(g => new LineSegment(g.upperSite.point, g.lowerSite.point)), null);
  //         return gates;
  //     }

  //     sourceShape: var = portsToShapes[edgeGeometry.SourcePort];

  //     targetShape: var = portsToShapes[edgeGeometry.TargetPort];

  //     GetTightHierarchy(): RectangleNode<Polyline, Point> {
  //         return RectangleNode.CreateRectangleNodeOnEnumeration(shapesToTightLooseCouples.Values.Select(() => { }, new RectangleNode<Polyline, Point>(tl.TightPolyline, tl.TightPolyline.BoundingBox)));
  //     }

  //     GetLooseHierarchy(): RectangleNode<Polyline, Point> {
  //         const loosePolylines = new Set<Polyline>(shapesToTightLooseCouples.Values.Select(() => { }, (<Polyline>(tl.LooseShape.BoundaryCurve))));
  //         return RectangleNode.CreateRectangleNodeOnEnumeration(loosePolylines.Select(() => { }, new RectangleNode<Polyline, Point>(p, p.BoundingBox)));
  //     }

  //     //   The set of shapes where the edgeGeometry source and target ports shapes are citizens.
  //     //   In the simple case it is the union of the target port shape parents and the sourceport shape parents.
  //     //   When one end shape contains another, the passport is the set consisting of the end shape and all other shape parents.
  //     EdgePassport(edge: Edge): Set<Shape> {
  //         const edgeGeometry: EdgeGeometry = edge.EdgeGeometry;
  //         const ret = new Set<Shape>();
  //         const sourceShape = portsToShapes[edgeGeometry.SourcePort];
  //         const targetShape = portsToShapes[edgeGeometry.TargetPort];
  //         if (IsAncestor(sourceShape, targetShape)) {
  //             ret.InsertRange(targetShape.Parents);
  //             ret.Insert(sourceShape);
  //             return ret;
  //         }

  //         if (IsAncestor(targetShape, sourceShape)) {
  //             ret.InsertRange(sourceShape.Parents);
  //             ret.Insert(targetShape);
  //             return ret;
  //         }

  //         if ((sourceShape != looseRoot)) {
  //             ret.InsertRange(sourceShape.Parents);
  //         }

  //         if ((targetShape != looseRoot)) {
  //             ret.InsertRange(targetShape.Parents);
  //         }

  //         return ret;
  //     }

  //     AllPorts(): IEnumerable<Port> {
  //         for (const edgeGeometry; of; edgeGeometriesEnumeration) {
  //             const edgeGeometry.SourcePort: yield;
  //             const edgeGeometry.TargetPort: yield;
  //         }

  //     }

  //     edgeGeometry: var = edge.EdgeGeometry;

  //     addedEdges: var = new List<VisibilityEdge>();

  //     smoothedPolyline: SmoothedPolyline;

  //     //  if set to true the original spline is kept under the corresponding EdgeGeometry
  //     public get KeepOriginalSpline(): boolean {
  //     }
  //     public set KeepOriginalSpline(value: boolean) {
  //     }

  //     //
  //     public get ArrowHeadRatio(): number {
  //     }
  //     public set ArrowHeadRatio(value: number) {
  //     }

  //     get LineSweeperPorts(): Point[] {
  //     }
  //     set LineSweeperPorts(value: Point[]) {
  //     }

  //     //
  //     AddVisibilityEdgesFromPort(port: Port): IEnumerable<VisibilityEdge> {
  //         const portShape: Shape;
  //         const boundaryCouple: TightLooseCouple;
  //         if ((port instanceof (CurvePort
  //             || (!portsToShapes.TryGetValue(port, /* out */portShape)
  //                 || !shapesToTightLooseCouples.TryGetValue(portShape, /* out */boundaryCouple))))) {
  //             return [];
  //         }

  //         const portLoosePoly = boundaryCouple.LooseShape;
  //         return from;
  //         const of: point;
  //         (<Polyline>(portLoosePoly.BoundaryCurve));
  //         const visGraph.FindEdge: where;
  //         port.Location;
  //         point;
  //         null;
  //         const visGraph.addEdge: select;
  //         port.Location;
  //         point;
  //     }

  //     MakeTransparentShapesOfEdgeGeometryAndGetTheShapes(edgeGeometry: EdgeGeometry): List<Shape> {
  //         // it is OK here to repeat a shape of the returned list
  //         const sourceShape: Shape = portsToShapes[edgeGeometry.SourcePort];
  //         const targetShape: Shape = portsToShapes[edgeGeometry.TargetPort];
  //         const transparentLooseShapes = new List<Shape>();
  //         for (const shape; of; GetTransparentShapes(edgeGeometry.SourcePort, edgeGeometry.TargetPort, sourceShape, targetShape).ToArray()) {
  //             if ((shape != null)) {
  //                 transparentLooseShapes.Add(LooseShapeOfOriginalShape(shape));
  //             }

  //         }

  //         for (const shape; of; portsToEnterableShapes[edgeGeometry.SourcePort]) {
  //             transparentLooseShapes.Add(LooseShapeOfOriginalShape(shape));
  //         }

  //         for (const shape; of; portsToEnterableShapes[edgeGeometry.TargetPort]) {
  //             transparentLooseShapes.Add(LooseShapeOfOriginalShape(shape));
  //         }

  //         SetTransparency(transparentLooseShapes, true);
  //         return transparentLooseShapes;
  //     }

  //     LooseShapeOfOriginalShape(s: Shape): Shape {
  //         if ((s == root)) {
  //             return looseRoot;
  //         }

  //         return shapesToTightLooseCouples[s].LooseShape;
  //     }

  //     LoosePolyOfOriginalShape(s: Shape): Polyline {
  //         return (<Polyline>(LooseShapeOfOriginalShape(s).BoundaryCurve));
  //     }

  //     TightPolyOfOriginalShape(s: Shape): Polyline {
  //         if ((s == root)) {
  //             return null;
  //         }

  //         return shapesToTightLooseCouples[s].TightPolyline;
  //     }

  //     dd: var = new List<DebugCurve>(visGraph.Edges.Select(() => { }, new DebugCurve(100, 0.1, GetEdgeColor(e, sourcePort, targetPort), new LineSegment(e.SourcePoint, e.TargetPoint))));

  //     static GetEdgeColor(e: VisibilityEdge, sourcePort: Port, targetPort: Port): string {
  //         if (((sourcePort == null)
  //             || (targetPort == null))) {
  //             return "green";
  //         }

  //         if ((Point.closeDistEps(e.SourcePoint, sourcePort.Location)
  //             || (Point.closeDistEps(e.SourcePoint, targetPort.Location)
  //                 || (Point.closeDistEps(e.TargetPoint, sourcePort.Location) || Point.closeDistEps(e.TargetPoint, targetPort.Location))))) {
  //             return "lightgreen";
  //         }

  //         return "green";
  //         // TODO: Warning!!!, inline IF is not supported ?
  //         ((e.IsPassable == null)
  //             || e.IsPassable());
  //         "red";
  //     }

  //     routingOutsideOfSourceBoundary: var = EdgesAttachedToPortAvoidTheNode(sourcePort);

  //     routingOutsideOfTargetBoundary: var = EdgesAttachedToPortAvoidTheNode(targetPort);

  //     IsAncestor(possibleAncestor: Shape, possiblePredecessor: Shape): boolean {
  //         const ancestors: Set<Shape>;
  //         return ((possiblePredecessor != null)
  //             && (ancestorSets.TryGetValue(possiblePredecessor, /* out */ancestors)
  //                 && ((ancestors != null)
  //                     && ancestors.Contains(possibleAncestor))));
  //     }

  //     static CreateLooseObstacleHierarachy(loosePolys: IEnumerable<Polyline>): RectangleNode<Polyline, Point> {
  //         return RectangleNode.CreateRectangleNodeOnEnumeration(loosePolys.Select(() => { }, new RectangleNode<Polyline, Point>(poly, poly.BoundingBox)));
  //     }

  //     CreateTightObstacleHierarachy(obstacles: IEnumerable<Shape>): RectangleNode<Polyline, Point> {
  //         const tightPolys = obstacles.Select(() => { }, shapesToTightLooseCouples[sh].TightPolyline);
  //         return RectangleNode.CreateRectangleNodeOnEnumeration(tightPolys.Select(() => { }, new RectangleNode<Polyline, Point>(tightPoly, tightPoly.BoundingBox)));
  //     }

  //     setOfPortLocations: var = new Set<Point>(LineSweeperPorts);

  //     // going depth first
  //     children: var = shape.Children;

  //     tightLooseCouple: TightLooseCouple;

  //     looseBoundary: Polyline = (<Polyline>(tightLooseCouple.LooseShape.BoundaryCurve));

  //     obstacles: var = new Set<Polyline>(looseShape.Children.Select(() => { }, (<Polyline>(c.BoundaryCurve))));

  //     portLocations: var = RemoveInsidePortsAndSplitBoundaryIfNeeded(looseBoundary);

  //     // this run will split the polyline enough to route later from the inner ports
  //     tmpVisGraph: var = new VisibilityGraph();

  //     coneSpanner: var = new ConeSpanner([], tmpVisGraph, coneAngle, portLocations, looseBoundary);

  //     //  If set to true then a smaller visibility graph is created.
  //     //  An edge is added to the visibility graph only if it is found at least twice:
  //     //  once sweeping with a direction d and the second time with -d
  //     get Bidirectional(): boolean {
  //     }
  //     set Bidirectional(value: boolean) {
  //     }

  //     l: var = new List<DebugCurve>(tmpVisGraph.Edges.Select(() => { }, new DebugCurve(100, 1, "green", new LineSegment(e.SourcePoint, e.TargetPoint))));

  //     e: var = visGraph.FindEdge(edge.SourcePoint, edge.TargetPoint);

  //     p: var = boundary.startPoint;

  //     RemoveInsidePortsAndSplitBoundaryIfNeeded(boundary: Polyline): Set<Point> {
  //         const ret = new Set<Point>();
  //         if ((boundary == null)) {
  //             for (const point; of; portRTree.GetAllLeaves()) {
  //                 ret.Insert(point);
  //             }

  //             portRTree.Clear();
  //             return ret;
  //         }

  //         const boundaryBox: Rectangle = boundary.BoundingBox;
  //         const portLocationsInQuestion = portRTree.GetAllIntersecting(boundaryBox).ToArray();
  //         for (const point; of; portLocationsInQuestion) {
  //             switch (Curve.PointRelativeToCurveLocation(point, boundary)) {
  //                 case PointLocation.Inside:
  //                     ret.Insert(point);
  //                     portLocationsToLoosePolylines[point] = boundary;
  //                     portRTree.Remove(new Rectangle(point), point);
  //                     break;
  //                 case PointLocation.Boundary:
  //                     portRTree.Remove(new Rectangle(point), point);
  //                     portLocationsToLoosePolylines[point] = boundary;
  //                     const polylinePoint: PolylinePoint = FindPointOnPolylineToInsertAfter(boundary, point);
  //                     if ((polylinePoint != null)) {
  //                         LineSweeper.InsertPointIntoPolylineAfter(boundary, polylinePoint, point);
  //                     }
  //                     else {
  //                         throw new Error();
  //                     }

  //                     break;
  //             }

  //         }

  //         return ret;
  //     }

  //     static FindPointOnPolylineToInsertAfter(boundary: Polyline, point: Point): PolylinePoint {
  //         for (const p: PolylinePoint = boundary.startPoint; ;
  //         ) {
  //             const pn: PolylinePoint = p.NextOnPolyline;
  //             if ((Point.closeDistEps(point, p.point) || Point.closeDistEps(point, pn.point))) {
  //                 return null;
  //             }

  //             // the point is already inside
  //             const par: number;
  //             if (Point.closeDistEps(Point.DistToLineSegment(point, p.point, pn.point, /* out */par), 0)) {
  //                 return p;
  //             }

  //             p = pn;
  //             if ((p == boundary.startPoint)) {
  //                 throw new Error();
  //             }

  //         }

  //     }

  //     //  ReSharper restore UnusedMember.Local
  //     r: var = new Random(1);

  //     static GetAncestorSetsMap(shapes: IEnumerable<Shape>): Dictionary<Shape, Set<Shape>> {
  //         const ancSets = new Dictionary<Shape, Set<Shape>>();
  //         for (const child; of; shapes.Where(() => { }, !ancSets.ContainsKey(child))) {
  //             ancSets[child] = GetAncestorSet(child, ancSets);
  //         }

  //         return ancSets;
  //     }

  //     static GetAncestorSet(child: Shape, ancSets: Dictionary<Shape, Set<Shape>>): Set<Shape> {
  //         const ret = new Set<Shape>(child.Parents);
  //         for (const parent; of; child.Parents) {
  //             const grandParents: Set<Shape>;
  //             ret = (ret + ancSets.TryGetValue(parent, /* out */grandParents));
  //             // TODO: Warning!!!, inline IF is not supported ?
  //             // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  //             ;
  //         }

  //         return ret;
  //     }

  //     //   computes loosePadding for spline routing obstacles from node separation and EdgePadding.
  //     static ComputeLooseSplinePadding(nodeSeparation: number, edgePadding: number): number {
  //         Assert.assert((edgePadding > 0), "require EdgePadding > 0");
  //         const twicePadding: number = (2 * edgePadding);
  //         Assert.assert((nodeSeparation > twicePadding), "require OverlapSeparation > 2*EdgePadding");
  //         //  the 8 divisor is just to guarantee the final postcondition
  //         const loosePadding: number = ((nodeSeparation - twicePadding)
  //             / 8);
  //         Assert.assert((loosePadding > 0), "require LoosePadding > 0");
  //         Assert.assert((twicePadding
  //             + ((2 * loosePadding)
  //                 < nodeSeparation)), "EdgePadding too big!");
  //         return loosePadding;
  //     }
}
