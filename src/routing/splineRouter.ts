import {Shape} from './shape'
import {
  from,
  IEnumerable,
  // IGrouping,
  // from,
  // InvalidOperationException,
} from 'linq-to-typescript'
import {mkRTree} from '../math/geometry/RTree/RTree'
// import { Queue } from 'queue-typescript'
// import { GeomGraph } from '../layout/core/GeomGraph'
// import { IRectangle } from '../core/geometry/IRectangle'
// import { RectangleNode } from '../core/geometry/RTree/RectangleNode'
// import { RTree } from '../core/geometry/RTree/RTree'
// import { BundlingSettings } from '../core/routing/BundlingSettings'
// import { EdgeGeometry } from '../layout/core/edgeGeometry'
import {GeomEdge} from '../layout/core/geomEdge'
import {RelativeFloatingPort} from '../layout/core/relativeFloatingPort'
// import { Curve } from '../math/geometry/curve'
// import { ICurve } from '../math/geometry/icurve'
import {Point} from '../math/geometry/point'
// import { Polyline } from '../math/geometry/polyline'
// import { PolylinePoint } from '../math/geometry/polylinePoint'
// import { Rectangle } from '../math/geometry/rectangle'
// import { SmoothedPolyline } from '../math/geometry/smoothedPolyline'
import {Algorithm} from '../utils/algorithm'
import {Assert} from '../utils/assert'
import {Curve, PointLocation, Polyline, Rectangle} from '../math/geometry'
import {PolylinePoint} from '../math/geometry/polylinePoint'
import {closeDistEps} from '../utils/compare'
import {PointSet} from '../utils/PointSet'
import {RTree} from '../math/geometry/RTree/RTree'
import {LineSweeper} from './spline/coneSpanner/LineSweeper'
import {PointMap} from '../utils/PointMap'
import {VisibilityGraph} from './visibility/VisibilityGraph'
import {TightLooseCouple} from './TightLooseCouple'
import {VisibilityEdge} from './visibility/VisibilityEdge'
import {ConeSpanner} from './spline/coneSpanner/ConeSpanner'
import {EdgeGeometry} from '../layout/core/edgeGeometry'
import {HookUpAnywhereFromInsidePort} from '../layout/core/hookUpAnywhereFromInsidePort'
import {ClusterBoundaryPort} from './ClusterBoundaryPort'
import {
  CreateRectangleNodeOnEnumeration,
  mkRectangleNode,
  RectangleNode,
} from '../math/geometry/RTree/RectangleNode'
// import { CancelToken } from '../utils/cancelToken'
// import { Cdt } from './ConstrainedDelaunayTriangulation/Cdt'
// import { CdtEdge } from './ConstrainedDelaunayTriangulation/CdtEdge'
// import { Polygon } from './visibility/Polygon'
// import { VisibilityEdge } from './visibility/VisibilityEdge'

//  routing splines around shapes
export class SplineRouter extends Algorithm {
  //  setting this to true forces the calculation to go on even when node overlaps are present
  //
  continueOnOverlaps = true

  public get ContinueOnOverlaps(): boolean {
    return this.continueOnOverlaps
  }
  public set ContinueOnOverlaps(value: boolean) {
    this.continueOnOverlaps = value
  }

  rootShapes: Shape[];

  *edgeGeometriesEnumeration(): IterableIterator<EdgeGeometry> {
    if (this._edges != null) {
      for (const e of this._edges) {
        yield e.edgeGeometry
      }
    }
  }

  coneAngle: number

  tightPadding: number
  loosePadding: number
  get LoosePadding(): number {
    return this.loosePadding
  }
  set LoosePadding(value: number) {
    this.loosePadding = value
  }

  rootWasCreated: boolean

  root: Shape

  visGraph: VisibilityGraph

  ancestorSets: Map<Shape, Set<Shape>>

  shapesToTightLooseCouples: Map<Shape, TightLooseCouple> = new Map<
    Shape,
    TightLooseCouple
  >()

  //portsToShapes: Map<Port, Shape>;

  //portsToEnterableShapes: Map<Port, Set<Shape>>;

  portRTree: RTree<Point, Point>

  portLocationsToLoosePolylines: PointMap<Polyline> = new PointMap<Polyline>()

  looseRoot: Shape

  // get BundlingSettings(): BundlingSettings {
  // }
  // set BundlingSettings(value: BundlingSettings) {
  // }

  // enterableLoose: Map<EdgeGeometry, Set<Polyline>>;

  // enterableTight: Map<EdgeGeometry, Set<Polyline>>;

  // GeomGraph: GeomGraph;

  // multiEdgesSeparation: number = 5;

  // routeMultiEdgesAsBundles: boolean = true;

  // UseEdgeLengthMultiplier: boolean;

  //  if set to true the algorithm will try to shortcut a shortest polyline inner points
  // public UsePolylineEndShortcutting: boolean = true;

  //  if set to true the algorithm will try to shortcut a shortest polyline start and end
  // public UseInnerPolylingShortcutting: boolean = true;

  // AllowedShootingStraightLines: boolean = true;

  // get MultiEdgesSeparation(): number {
  //   return this.multiEdgesSeparation;
  // }
  // set MultiEdgesSeparation(value: number) {
  //   this.multiEdgesSeparation = value;
  // }

  // //  Creates a spline group router for the given graph.
  // public constructor(graph: GeomGraph, edgeRoutingSettings: EdgeRoutingSettings):
  //   this(graph, edgeRoutingSettings.Padding, edgeRoutingSettings.PolylinePadding, edgeRoutingSettings.ConeAngle, edgeRoutingSettings.BundlingSettings) {

  //   }

  //  Creates a spline group router for the given graph.
  //     public constructor(graph: GeomGraph, tightTightPadding: number, loosePadding: number, coneAngle: number) :
  // this(graph, graph.Edges, tightTightPadding, loosePadding, this.coneAngle, null) {

  // }

  //  Creates a spline group router for the given graph
  //     constructor(graph: GeomGraph, tightTightPadding: number, loosePadding: number, coneAngle: number, bundlingSettings: BundlingSettings) :
  // this(graph, graph.Edges, tightTightPadding, loosePadding, this.coneAngle, bundlingSettings) {

  // }

  //  Creates a spline group router for the given graph.
  //     constructor(graph: GeomGraph, edges: IEnumerable < GeomEdge >, tightPadding: number, loosePadding: number, coneAngle: number, bundlingSettings: BundlingSettings) {
  //     super(new CancelToken()) // todo: pass a cancel token
  //   this._edges = Array.from(edges)
  //   this.BundlingSettings = bundlingSettings;
  //   this.GeomGraph = graph;
  //   this.LoosePadding = loosePadding;
  //   this.tightPadding = this.tightPadding;
  //   // let obstacles: IEnumerable<Shape> = ShapeCreator.GetShapes(this.GeomGraph);
  //   // this.Initialize(obstacles, this.coneAngle);
  // }

  _edges: GeomEdge[]

  //
  //     public constructor(graph: GeomGraph, tightPadding: number, loosePadding: number, coneAngle: number, inParentEdges: Array < GeomEdge >, outParentEdges: Array<GeomEdge>) {
  //   this.GeomGraph = graph;
  //   this.LoosePadding = loosePadding;
  //   this.tightPadding = this.tightPadding;
  //   let obstacles: IEnumerable < Shape > = ShapeCreatorForRoutingToParents.GetShapes(inParentEdges, outParentEdges);
  //   this.Initialize(obstacles, this.coneAngle);
  // }

  //     Initialize(obstacles: IEnumerable < Shape >, coneAngleValue: number) {
  //   this.rootShapes = obstacles.Where(() => { }, ((s.Parents == null)
  //     || !s.Parents.Any())).ToArray();
  //   this.coneAngle = coneAngleValue;
  //   if((this.coneAngle == 0)) {
  //   this.coneAngle = (Math.PI / 6);
  // }

  //   }

  //  Executes the algorithm.
  run() {
    // if (!this.edgeGeometriesEnumeration.Any()) {
    //   return;
    // }
    // this.GetOrCreateRoot();
    // this.RouteOnRoot();
    // this.RemoveRoot();
  }

  RouteOnRoot() {
    // this.CalculatePortsToShapes();
    // this.CalculatePortsToEnterableShapes();
    // this.CalculateShapeToBoundaries(this.root);
    // if ((OverlapsDetected
    //   && !this.ContinueOnOverlaps)) {
    //   return;
    // }
    // this.BindLooseShapes();
    // this.SetLoosePolylinesForAnywherePorts();
    // this.CalculateVisibilityGraph();
    // this.RouteOnVisGraph();
  }

  // CalculatePortsToEnterableShapes() {
  //   this.portsToEnterableShapes = new Map<Port, Set<Shape>>();
  //   for (let portsToShape of this.portsToShapes) {
  //     let port = portsToShape.Key;
  //     let set = new Set<Shape>();
  //     if (!SplineRouter.EdgesAttachedToPortAvoidTheNode(port)) {
  //       set.Insert(portsToShape.Value);
  //     }

  //     this.portsToEnterableShapes[port] = set;
  //   }

  //   for (let rootShape of this.rootShapes) {
  //     for (let sh of rootShape.Descendants) {
  //       for (let port of sh.Ports) {
  //         let enterableSet = this.portsToEnterableShapes[port];
  //         enterableSet.InsertRange(sh.Ancestors.Where(() => { }, (s.BoundaryCurve != null)));
  //       }

  //     }

  //   }

  // }

  //     static EdgesAttachedToPortAvoidTheNode(port: Port): boolean {
  //   return (port instanceof ((CurvePort || port) instanceof ClusterBoundaryPort));
  // }

  // SetLoosePolylinesForAnywherePorts() {
  //   for (let shapesToTightLooseCouple of this.shapesToTightLooseCouples) {
  //     let shape = shapesToTightLooseCouple.Key;
  //     for (let port of shape.Ports) {
  //       let aport = (<HookUpAnywhereFromInsidePort>(port));
  //       if ((aport != null)) {
  //         aport.LoosePolyline = (<Polyline>(shapesToTightLooseCouple.Value.LooseShape.BoundaryCurve));
  //       }

  //       let clusterBoundaryPort = (<ClusterBoundaryPort>(port));
  //       if ((clusterBoundaryPort != null)) {
  //         clusterBoundaryPort.LoosePolyline = (<Polyline>(shapesToTightLooseCouple.Value.LooseShape.BoundaryCurve));
  //       }

  //     }

  //   }

  // }

  // BindLooseShapes() {
  //   this.looseRoot = new Shape();
  //   for (let shape of this.root.Children) {
  //     let looseShape = this.shapesToTightLooseCouples[shape].LooseShape;
  //     this.BindLooseShapesUnderShape(shape);
  //     this.looseRoot.AddChild(looseShape);
  //   }

  // }

  // BindLooseShapesUnderShape(shape: Shape) {
  //   let loose = this.shapesToTightLooseCouples[shape].LooseShape;
  //   for (let child of shape.Children) {
  //     let childLooseShape = this.shapesToTightLooseCouples[child].LooseShape;
  //     loose.AddChild(childLooseShape);
  //     this.BindLooseShapesUnderShape(child);
  //   }

  // }

  // CalculateShapeToBoundaries(shape: Shape) {
  //   ProgressStep();
  //   if (!shape.Children.Any()) {
  //     return;
  //   }

  //   for (let child: Shape of shape.Children) {
  //     this.CalculateShapeToBoundaries(child);
  //   }

  //   let obstacleCalculator = new ShapeObstacleCalculator(shape, this.tightPadding, AdjustedLoosePadding, this.shapesToTightLooseCouples);
  //   obstacleCalculator.Calculate();
  //         #if(SHARPKIT)
  //   OverlapsDetected = (OverlapsDetected | obstacleCalculator.OverlapsDetected);
  //         #else
  //   OverlapsDetected = (OverlapsDetected | obstacleCalculator.OverlapsDetected);
  //         #endif
  // }

  //  set to true if and only if there are overlaps in tight obstacles
  //     public get OverlapsDetected(): boolean {
  // }
  //     public set OverlapsDetected(value: boolean)  {
  // }

  //     get AdjustedLoosePadding(): number {
  //   return this.LoosePadding;
  //   // TODO: Warning!!!, inline IF is not supported ?
  //   (this.BundlingSettings == null);
  //   let BundleRouter.SuperLoosePaddingCoefficient: LoosePadding;
  // }

  // RouteOnVisGraph() {
  //   this.ancestorSets = SplineRouter.GetAncestorSetsMap(this.root.Descendants);
  //   if ((this.BundlingSettings == null)) {
  //     for (let edgeGroup of this._edges.GroupBy(EdgePassport)) {
  //       let passport = edgeGroup.Key;
  //       let obstacleShapes: Set<Shape> = this.GetObstaclesFromPassport(passport);
  //       let interactiveEdgeRouter = this.CreateInteractiveEdgeRouter(obstacleShapes);
  //       this.RouteEdgesWithTheSamePassport(edgeGroup, interactiveEdgeRouter, obstacleShapes);
  //     }

  //   }
  //   else {
  //     this.RouteBundles();
  //   }

  // }

  // RouteEdgesWithTheSamePassport(edgeGeometryGroup: IGrouping < Set < Shape >, GeomEdge >, interactiveEdgeRouter: InteractiveEdgeRouter, obstacleShapes: Set<Shape>) {
  //   let regularEdges: Array<GeomEdge>;
  //   let multiEdges: Array<GeomEdge[]>;
  //   if(RouteMultiEdgesAsBundles) {
  //     this.SplitOnRegularAndMultiedges(edgeGeometryGroup, /* out */regularEdges, /* out */multiEdges);
  //     for (let edge of regularEdges) {
  //       this.RouteEdge(interactiveEdgeRouter, edge);
  //     }

  //     if ((multiEdges != null)) {
  //       this.ScaleDownLooseHierarchy(interactiveEdgeRouter, obstacleShapes);
  //       this.RouteMultiEdges(multiEdges, interactiveEdgeRouter, edgeGeometryGroup.Key);
  //     }

  //   }
  //         else {
  //     for(let eg in edgeGeometryGroup) {
  //   this.RouteEdge(interactiveEdgeRouter, eg);
  // }

  //         }

  //     }

  //  if set to true routes multi edges as ordered bundles
  //     public get RouteMultiEdgesAsBundles(): boolean {
  //   return this.routeMultiEdgesAsBundles;
  // }
  //     public set RouteMultiEdgesAsBundles(value: boolean)  {
  //   this.routeMultiEdgesAsBundles = value;
  // }

  // RouteEdge(interactiveEdgeRouter: InteractiveEdgeRouter, edge: GeomEdge) {
  //   let transparentShapes = this.MakeTransparentShapesOfEdgeGeometryAndGetTheShapes(edge.EdgeGeometry);
  //   ProgressStep();
  //   this.RouteEdgeGeometry(edge, interactiveEdgeRouter);
  //   SplineRouter.SetTransparency(transparentShapes, false);
  // }

  // ScaleDownLooseHierarchy(interactiveEdgeRouter: InteractiveEdgeRouter, obstacleShapes: Set<Shape>) {
  //   let loosePolys = new Array<Polyline>();
  //   for(let obstacleShape in obstacleShapes) {
  //   let tl = this.shapesToTightLooseCouples[obstacleShape];
  //   loosePolys.Add(InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, (tl.Distance / BundleRouter.SuperLoosePaddingCoefficient)));
  // }

  // interactiveEdgeRouter.LooseHierarchy = SplineRouter.CreateLooseObstacleHierarachy(loosePolys);
  // interactiveEdgeRouter.ClearActivePolygons();
  // interactiveEdgeRouter.AddActivePolygons(loosePolys.Select(() => { }, new Polygon(polyline)));
  //     }

  // RouteMultiEdges(multiEdges: Array < GeomEdge[] >, interactiveEdgeRouter: InteractiveEdgeRouter, parents: Set<Shape>) {
  //   let mer = new MultiEdgeRouter(multiEdges, interactiveEdgeRouter, parents.SelectMany(() => { }, p.Children).Select(() => { }, s.BoundaryCurve), [][
  //     InkImportance = 0.00001,
  //     EdgeSeparation = MultiEdgesSeparation], MakeTransparentShapesOfEdgeGeometryAndGetTheShapes);
  //   // giving more importance to ink might produce weird routings with huge detours, maybe 0 is the best value here
  //   mer.Run();
  // }

  //         void ScaleLoosePolylinesOfInvolvedShapesDown(Set<Shape> parents) {
  //             foreach (var parent in parents) {
  //                 foreach (var shape in parent.Descendands) {
  //                     TightLooseCouple tl = this.shapesToTightLooseCouples[shape];
  //                     tl.LooseShape.BoundaryCurveBackup = tl.LooseShape.BoundaryCurve;
  //                     tl.LooseShape.BoundaryCurve = InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, tl.Distance / BundleRouter.SuperLoosePaddingCoefficient);
  //                 }
  //             }
  //         }
  //
  //         void RestoreLoosePolylinesOfInvolvedShapes(Set<Shape> parents) {
  //             foreach (var parent in parents) {
  //                 foreach (var shape in parent.Descendands) {
  //                     TightLooseCouple tl = shapesToTightLooseCouples[shape];
  //                     tl.LooseShape.BoundaryCurve = tl.LooseShape.BoundaryCurveBackup;
  //                 }
  //             }
  //         }
  //     SplitOnRegularAndMultiedges(edges: IEnumerable < GeomEdge >, /* out */regularEdges: Array < GeomEdge >, /* out */multiEdges: Array<GeomEdge[]>) {
  //   regularEdges = new Array<GeomEdge>();
  //   let portLocationPairsToEdges = new Map<PointPair, Array<GeomEdge>>();
  //   for(let eg in edges) {
  //   if(SplineRouter.IsEdgeToParent(eg.EdgeGeometry)) {
  //   regularEdges.Add(eg);
  // }
  //             else {
  //   SplineRouter.RegisterInPortLocationsToEdges(eg, portLocationPairsToEdges);
  // }

  //         }

  // multiEdges = null;
  // for (let edgeGroup of portLocationPairsToEdges.Values) {
  //   if (((edgeGroup.Count == 1)
  //     || this.OverlapsDetected)) {
  //     regularEdges.AddRange(edgeGroup);
  //   }
  //   else {
  //     if ((multiEdges == null)) {
  //       multiEdges = new Array<GeomEdge[]>();
  //     }

  //     multiEdges.Add(edgeGroup.ToArray());
  //   }

  // }

  //     }

  //     static RegisterInPortLocationsToEdges(eg: GeomEdge, portLocationPairsToEdges: Map<PointPair, Array<GeomEdge>>) {
  //   let list: Array<GeomEdge>;
  //   let pp = new PointPair(eg.SourcePort.Location, eg.TargetPort.Location);
  //   if(!portLocationPairsToEdges.TryGetValue(pp, /* out */list)) {
  //   list = new Array<GeomEdge>();
  // }

  // portLocationPairsToEdges[pp] = new Array<GeomEdge>();
  // list.Add(eg);
  //     }

  //     static IsEdgeToParent(e: EdgeGeometry): boolean {
  //   return (e.SourcePort instanceof ((HookUpAnywhereFromInsidePort || e.TargetPort) instanceof HookUpAnywhereFromInsidePort));
  // }

  // CreateInteractiveEdgeRouter(obstacleShapes: IEnumerable<Shape>): InteractiveEdgeRouter {
  //   // we need to create a set here because one loose polyline can hold several original shapes
  //   let loosePolys = new Set<Polyline>(obstacleShapes.Select(() => { }, (<Polyline>(this.shapesToTightLooseCouples[sh].LooseShape.BoundaryCurve))));
  //   let router =[][
  //   VisibilityGraph = visGraph,
  //   TightHierarchy = CreateTightObstacleHierarachy(obstacleShapesUnknown,
  //     LooseHierarchy = CreateLooseObstacleHierarachy(loosePolysUnknown,
  //       UseSpanner = true,
  //       LookForRoundedVertices = true,
  //       TightPadding = tightPadding,
  //       LoosePadding = LoosePadding,
  //       UseEdgeLengthMultiplier = UseEdgeLengthMultiplier,
  //       UsePolylineEndShortcutting = UsePolylineEndShortcutting,
  //       UseInnerPolylingShortcutting = UseInnerPolylingShortcutting,
  //       AllowedShootingStraightLines = AllowedShootingStraightLines,
  //       CacheCorners = CacheCornersForSmoothing];
  //   router.AddActivePolygons(loosePolys.Select(() => { }, new Polygon(polyline)));
  //   return router;
  // }

  //
  //     public get CacheCornersForSmoothing(): boolean {
  // }
  //     public set CacheCornersForSmoothing(value: boolean)  {
  // }

  //     GetObstaclesFromPassport(passport: Set<Shape>): Set < Shape > {
  //   if((passport.Count == 0)) {
  //   return new Set<Shape>(this.root.Children);
  // }

  //         let commonAncestors = this.GetCommonAncestorsAbovePassport(passport);
  // let allAncestors = this.GetAllAncestors(passport);
  // let ret = new Set<Shape>(passport.SelectMany(() => { }, p.Children.Where(() => { }, !allAncestors.Contains(child))));
  // let enqueued = new Set<Shape>(passport.Concat(ret));
  // let queue = new Queue<Shape>();
  // for (let shape of passport.Where(() => { }, !commonAncestors.Contains(shape))) {
  //   queue.Enqueue(shape);
  // }

  // while ((queue.Count > 0)) {
  //   let a = queue.Dequeue();
  //   for (let parent of a.Parents) {
  //     for (let sibling of parent.Children) {
  //       if (!allAncestors.Contains(sibling)) {
  //         ret.Insert(sibling);
  //       }

  //     }

  //     if ((!commonAncestors.Contains(parent)
  //       && !enqueued.Contains(parent))) {
  //       queue.Enqueue(parent);
  //       enqueued.Insert(parent);
  //     }

  //   }

  // }

  // return ret;
  //     }

  // GetAllAncestors(passport: Set<Shape>): Set < Shape > {
  //   if(!passport.Any()) {
  //   return new Set<Shape>();
  // }

  // let ret = new Set<Shape>(passport);
  // for (let shape of passport) {
  //   ret = (ret + this.ancestorSets[shape]);
  // }

  // return ret;
  //     }

  // GetCommonAncestorsAbovePassport(passport: Set<Shape>): Set < Shape > {
  //   if(!passport.Any()) {
  //   return new Set<Shape>();
  // }

  // let ret = this.ancestorSets[passport.First()];
  // for (let shape of passport.Skip(1)) {
  //   ret = (ret * this.ancestorSets[shape]);
  // }

  // return ret;
  //     }

  // RouteBundles() {
  //   this.ScaleLooseShapesDown();
  //   this.CalculateEdgeEnterablePolylines();
  //   let looseHierarchy = this.GetLooseHierarchy();
  //   let cdt = BundleRouter.CreateConstrainedDelaunayTriangulation(looseHierarchy);
  //   //  CdtSweeper.ShowFront(cdt.GetTriangles(), null, null,this.visGraph.Edges.Select(e=>new LineSegment(e.SourcePoint,e.TargetPoint)));
  //   let shortestPath = new SdShortestPath(MakeTransparentShapesOfEdgeGeometryAndGetTheShapes, cdt, this.FindCdtGates(cdt));
  //   let bundleRouter = new BundleRouter(this.GeomGraph, shortestPath, this.visGraph, this.BundlingSettings, this.LoosePadding, this.GetTightHierarchy(), looseHierarchy, this.enterableLoose, this.enterableTight, () => { }, this.LoosePolyOfOriginalShape(this.portsToShapes[port]));
  //   bundleRouter.Run();
  // }

  // CreateTheMapToParentLooseShapes(shape: Shape, loosePolylinesToLooseParentShapeMap: Map<ICurve, Shape>) {
  //   for(let childShape in shape.Children) {
  //   let tightLooseCouple = this.shapesToTightLooseCouples[childShape];
  //   let poly = tightLooseCouple.LooseShape.BoundaryCurve;
  //   loosePolylinesToLooseParentShapeMap[poly] = shape;
  //   this.CreateTheMapToParentLooseShapes(childShape, loosePolylinesToLooseParentShapeMap);
  // }

  //     }

  // FindCdtGates(cdt: Cdt): Set < CdtEdge > {
  //   let loosePolylinesToLooseParentShapeMap: Map < ICurve, Shape> = new Map<ICurve, Shape>();
  // this.CreateTheMapToParentLooseShapes(this.root, loosePolylinesToLooseParentShapeMap);
  // looking for Cdt edges connecting two siblings; only those we define as gates
  // let gates = new Set<CdtEdge>();
  // for (let cdtSite of cdt.PointsToSites.Values) {
  //   for (let cdtEdge of cdtSite.Edges) {
  //     if (((cdtEdge.CwTriangle == null)
  //       && (cdtEdge.CcwTriangle == null))) {
  //       continue
  //     }

  //     let a = (<Polyline>(cdtSite.Owner));
  //     let b = (<Polyline>(cdtEdge.lowerSite.Owner));
  //     if ((a == b)) {
  //       continue
  //     }

  //     let aParent: Shape;
  //     let bParent: Shape;
  //     if ((loosePolylinesToLooseParentShapeMap.TryGetValue(a, /* out */aParent)
  //       && (loosePolylinesToLooseParentShapeMap.TryGetValue(b, /* out */bParent)
  //         && (aParent == bParent)))) {
  //       gates.Insert(cdtEdge);
  //     }

  //   }

  // }

  // CdtSweeper.ShowFront(cdt.GetTriangles(), null,
  //                     gates.Select(g => new LineSegment(g.upperSite.Point, g.lowerSite.Point)), null);
  // return gates;
  //     }

  // CalculateEdgeEnterablePolylines() {
  //   this.enterableLoose = new Map<EdgeGeometry, Set<Polyline>>();
  //   this.enterableTight = new Map<EdgeGeometry, Set<Polyline>>();
  //   for (let edgeGeometry of this.edgeGeometriesEnumeration) {
  //     let looseSet: Set<Polyline>;
  //     let tightSet: Set<Polyline>;
  //     this.GetEdgeEnterablePolylines(edgeGeometry, /* out */looseSet, /* out */tightSet);
  //     this.enterableLoose[edgeGeometry] = looseSet;
  //     this.enterableTight[edgeGeometry] = tightSet;
  //   }

  // }

  // GetEdgeEnterablePolylines(edgeGeometry: EdgeGeometry, /* out */looseEnterable: Set < Polyline >, /* out */tightEnterable: Set<Polyline>) {
  //   looseEnterable = new Set<Polyline>();
  //   tightEnterable = new Set<Polyline>();
  //   let sourceShape = this.portsToShapes[edgeGeometry.SourcePort];
  //   let targetShape = this.portsToShapes[edgeGeometry.TargetPort];
  //   if((sourceShape != this.root)) {
  //   looseEnterable.InsertRange(this.ancestorSets[sourceShape].Select(LoosePolyOfOriginalShape).Where(() => { }, (p != null)));
  //   tightEnterable.InsertRange(this.ancestorSets[sourceShape].Select(TightPolyOfOriginalShape).Where(() => { }, (p != null)));
  // }

  // if ((targetShape != this.root)) {
  //   looseEnterable.InsertRange(this.ancestorSets[targetShape].Select(LoosePolyOfOriginalShape).Where(() => { }, (p != null)));
  //   tightEnterable.InsertRange(this.ancestorSets[targetShape].Select(TightPolyOfOriginalShape).Where(() => { }, (p != null)));
  // }

  //     }

  // GetTightHierarchy(): RectangleNode < Polyline, Point > {
  //   return RectangleNode.CreateRectangleNodeOnEnumeration(this.shapesToTightLooseCouples.Values.Select(() => { }, new RectangleNode<Polyline, Point>(tl.TightPolyline, tl.TightPolyline.BoundingBox)));
  // }

  // GetLooseHierarchy(): RectangleNode < Polyline, Point > {
  //   let loosePolylines = new Set<Polyline>(this.shapesToTightLooseCouples.Values.Select(() => { }, (<Polyline>(tl.LooseShape.BoundaryCurve))));
  //   return RectangleNode.CreateRectangleNodeOnEnumeration(loosePolylines.Select(() => { }, new RectangleNode<Polyline, Point>(p, p.BoundingBox)));
  // }

  // ScaleLooseShapesDown() {
  //   for (let shapesToTightLooseCouple of this.shapesToTightLooseCouples) {
  //     let tl = shapesToTightLooseCouple.Value;
  //     tl.LooseShape.BoundaryCurve = InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tl.TightPolyline, (tl.Distance / BundleRouter.SuperLoosePaddingCoefficient));
  //   }

  // }

  //   The set of shapes where the edgeGeometry source and target ports shapes are citizens.
  //   In the simple case it is the union of the target port shape parents and the sourceport shape parents.
  //   When one end shape contains another, the passport is the set consisting of the end shape and all other shape parents.
  // EdgePassport(edge: GeomEdge): Set < Shape > {
  //   let edgeGeometry: EdgeGeometry = edge.EdgeGeometry;
  //   let ret = new Set<Shape>();
  //   let sourceShape = this.portsToShapes[edgeGeometry.SourcePort];
  //   let targetShape = this.portsToShapes[edgeGeometry.TargetPort];
  //   if(this.IsAncestor(sourceShape, targetShape)) {
  //   ret.InsertRange(targetShape.Parents);
  //   ret.Insert(sourceShape);
  //   return ret;
  // }

  // if (this.IsAncestor(targetShape, sourceShape)) {
  //   ret.InsertRange(sourceShape.Parents);
  //   ret.Insert(targetShape);
  //   return ret;
  // }

  // if ((sourceShape != this.looseRoot)) {
  //   ret.InsertRange(sourceShape.Parents);
  // }

  // if ((targetShape != this.looseRoot)) {
  //   ret.InsertRange(targetShape.Parents);
  // }

  // return ret;
  //     }

  // AllPorts(): IEnumerable < Port > {
  //   for(let edgeGeometry in this.edgeGeometriesEnumeration) {
  //   yield;
  //   return edgeGeometry.SourcePort;
  //   yield;
  //   return edgeGeometry.TargetPort;
  // }

  //     }

  // CalculatePortsToShapes() {
  //   this.portsToShapes = new Map<Port, Shape>();
  //   for (let shape of this.root.Descendants) {
  //     for (let port of shape.Ports) {
  //       this.portsToShapes[port] = shape;
  //     }

  //   }

  //   // assign all orphan ports to the root
  //   for (let port of this.AllPorts().Where(() => { }, !this.portsToShapes.ContainsKey(p))) {
  //     this.root.Ports.Insert(port);
  //     this.portsToShapes[port] = this.root;
  //   }

  // }

  // RouteEdgeGeometry(edge: GeomEdge, iRouter: InteractiveEdgeRouter) {
  //   let edgeGeometry = edge.EdgeGeometry;
  //   let addedEdges = new Array<VisibilityEdge>();
  //   if (!(edgeGeometry.SourcePort instanceof HookUpAnywhereFromInsidePort)) {
  //     addedEdges.AddRange(this.AddVisibilityEdgesFromPort(edgeGeometry.SourcePort));
  //   }

  //   if (!(edgeGeometry.TargetPort instanceof HookUpAnywhereFromInsidePort)) {
  //     addedEdges.AddRange(this.AddVisibilityEdgesFromPort(edgeGeometry.TargetPort));
  //   }

  //   let smoothedPolyline: SmoothedPolyline;
  //   if (!GeomConstants.Close(edgeGeometry.SourcePort.Location, edgeGeometry.TargetPort.Location)) {
  //     edgeGeometry.Curve = iRouter.RouteSplineFromPortToPortWhenTheWholeGraphIsReady(edgeGeometry.SourcePort, edgeGeometry.TargetPort, true, /* out */smoothedPolyline);
  //   }
  //   else {
  //     edgeGeometry.Curve = GeomEdge.RouteSelfEdge(edgeGeometry.SourcePort.Curve, Math.Max((this.LoosePadding * 2), edgeGeometry.GetMaxArrowheadLength()), /* out */smoothedPolyline);
  //   }

  //   edgeGeometry.SmoothedPolyline = smoothedPolyline;
  //   if ((edgeGeometry.Curve == null)) {
  //     throw new NotImplementedException();
  //   }

  //   for (let visibilityEdge of addedEdges) {
  //     VisibilityGraph.RemoveEdge(visibilityEdge);
  //   }

  //   Arrowheads.TrimSplineAndCalculateArrowheads(edgeGeometry, edgeGeometry.SourcePort.Curve, edgeGeometry.TargetPort.Curve, edgeGeometry.Curve, false, KeepOriginalSpline);
  //   if ((this.ReplaceEdgeByRails != null)) {
  //     ReplaceEdgeByRails(edge);
  //   }

  //   //   SetTransparency(transparentShapes, false);
  // }

  //  if set to true the original spline is kept under the corresponding EdgeGeometry
  //     public get KeepOriginalSpline(): boolean {
  // }
  //     public set KeepOriginalSpline(value: boolean)  {
  // }

  //
  //     public get ArrowHeadRatio(): number {
  // }
  //     public set ArrowHeadRatio(value: number)  {
  // }

  LineSweeperPorts: Point[]

  //
  // AddVisibilityEdgesFromPort(port: Port): IEnumerable < VisibilityEdge > {
  //   let portShape: Shape;
  //   let boundaryCouple: TightLooseCouple;
  //   if((port instanceof (CurvePort
  //     || (!this.portsToShapes.TryGetValue(port, /* out */portShape)
  //       || !this.shapesToTightLooseCouples.TryGetValue(portShape, /* out */boundaryCouple))))) {
  //   return [];
  // }

  // let portLoosePoly = boundaryCouple.LooseShape;
  // return from;
  // point;
  // (<Polyline>(portLoosePoly.BoundaryCurve));
  // let visGraph.FindEdge: where;
  // port.Location;
  // point;
  // null;
  // let visGraph.AddEdge: select;
  // port.Location;
  // point;
  //     }

  // MakeTransparentShapesOfEdgeGeometryAndGetTheShapes(edgeGeometry: EdgeGeometry): Array < Shape > {
  //   // it is OK here to repeat a shape in the returned list
  //   let sourceShape: Shape = this.portsToShapes[edgeGeometry.SourcePort];
  //   let targetShape: Shape = this.portsToShapes[edgeGeometry.TargetPort];
  //   let transparentLooseShapes = new Array<Shape>();
  //   for(let shape in this.GetTransparentShapes(edgeGeometry.SourcePort, edgeGeometry.TargetPort, sourceShape, targetShape).ToArray()) {
  //   if ((shape != null)) {
  //     transparentLooseShapes.Add(this.LooseShapeOfOriginalShape(shape));
  //   }

  // }

  // for (let shape of this.portsToEnterableShapes[edgeGeometry.SourcePort]) {
  //   transparentLooseShapes.Add(this.LooseShapeOfOriginalShape(shape));
  // }

  // for (let shape of this.portsToEnterableShapes[edgeGeometry.TargetPort]) {
  //   transparentLooseShapes.Add(this.LooseShapeOfOriginalShape(shape));
  // }

  // SplineRouter.SetTransparency(transparentLooseShapes, true);
  // return transparentLooseShapes;
  //     }

  // LooseShapeOfOriginalShape(s: Shape): Shape {
  //   if ((s == this.root)) {
  //     return this.looseRoot;
  //   }

  //   return this.shapesToTightLooseCouples[s].LooseShape;
  // }

  // LoosePolyOfOriginalShape(s: Shape): Polyline {
  //   return (<Polyline>(this.LooseShapeOfOriginalShape(s).BoundaryCurve));
  // }

  // TightPolyOfOriginalShape(s: Shape): Polyline {
  //   if ((s == this.root)) {
  //     return null;
  //   }

  //   return this.shapesToTightLooseCouples[s].TightPolyline;
  // }

  //     static GetEdgeColor(e: VisibilityEdge, sourcePort: Port, targetPort: Port): string {
  //   if (((sourcePort == null)
  //     || (targetPort == null))) {
  //     return "green";
  //   }

  //   if ((GeomConstants.Close(e.SourcePoint, sourcePort.Location)
  //     || (GeomConstants.Close(e.SourcePoint, targetPort.Location)
  //       || (GeomConstants.Close(e.TargetPoint, sourcePort.Location) || GeomConstants.Close(e.TargetPoint, targetPort.Location))))) {
  //     return "lightgreen";
  //   }

  //   return "green";
  //   // TODO: Warning!!!, inline IF is not supported ?
  //   ((e.IsPassable == null)
  //     || e.IsPassable());
  //   "red";
  // }

  // GetTransparentShapes(sourcePort: Port, targetPort: Port, sourceShape: Shape, targetShape: Shape): IEnumerable < Shape > {
  //   for(let s in this.ancestorSets[sourceShape]) {
  //   yield;
  // }

  // return s;
  // for (let s of this.ancestorSets[targetShape]) {
  //   yield;
  // }

  // return s;
  // let routingOutsideOfSourceBoundary = SplineRouter.EdgesAttachedToPortAvoidTheNode(sourcePort);
  // let routingOutsideOfTargetBoundary = SplineRouter.EdgesAttachedToPortAvoidTheNode(targetPort);
  // if ((!routingOutsideOfSourceBoundary
  //   && !routingOutsideOfTargetBoundary)) {
  //   yield;
  //   return sourceShape;
  //   yield;
  //   return targetShape;
  // }
  // else if (routingOutsideOfSourceBoundary) {
  //   if (this.IsAncestor(sourceShape, targetShape)) {
  //     yield;
  //   }

  //   return sourceShape;
  // }
  // else {
  //   if (this.IsAncestor(targetShape, sourceShape)) {
  //     yield;
  //   }

  //   return targetShape;
  // }

  //     }

  static SetTransparency(shapes: IEnumerable<Shape>, v: boolean) {
    for (const shape of shapes) {
      shape.IsTransparent = v
    }
  }

  IsAncestor(possibleAncestor: Shape, possiblePredecessor: Shape): boolean {
    let ancestors: Set<Shape>

    return (
      possiblePredecessor != null &&
      (ancestors = this.ancestorSets.get(possiblePredecessor)) != null &&
      ancestors.has(possibleAncestor)
    )
  }

  static CreateLooseObstacleHierarachy(
    loosePolys: IEnumerable<Polyline>,
  ): RectangleNode<Polyline, Point> {
    return CreateRectangleNodeOnEnumeration(
      loosePolys
        .select((poly) => mkRectangleNode(poly, poly.boundingBox))
        .toArray(),
    )
  }

  CreateTightObstacleHierarachy(
    obstacles: IEnumerable<Shape>,
  ): RectangleNode<Polyline, Point> {
    const tightPolys = obstacles.select(
      (sh) => this.shapesToTightLooseCouples.get(sh).TightPolyline,
    )
    return CreateRectangleNodeOnEnumeration(
      tightPolys
        .select((tightPoly) =>
          mkRectangleNode<Polyline, Point>(tightPoly, tightPoly.boundingBox),
        )
        .toArray(),
    )
  }

  CalculateVisibilityGraph() {
    const setOfPortLocations =
      this.LineSweeperPorts != null
        ? PointSet.mk(this.LineSweeperPorts)
        : new PointSet()
    this.ProcessHookAnyWherePorts(setOfPortLocations)
    this.portRTree = mkRTree(
      from(setOfPortLocations.values()).select((p) => [
        Rectangle.rectangleOnPoint(p),
        p,
      ]),
    )
    this.visGraph = new VisibilityGraph()
    this.FillVisibilityGraphUnderShape(this.root)
    // ShowVisGraph(visGraph, new Set<Polyline>(shapesToTightLooseCouples.Values.Select(tl => (Polyline)(tl.LooseShape.BoundaryCurve))),
    //   GeomGraph.Nodes.Select(n => n.BoundaryCurve).Concat(root.Descendants.Select(d => d.BoundaryCurve)), null);
  }

  private ProcessHookAnyWherePorts(setOfPortLocations: PointSet) {
    for (const edgeGeometry of this.edgeGeometriesEnumeration()) {
      if (
        !(
          edgeGeometry.sourcePort instanceof HookUpAnywhereFromInsidePort ||
          edgeGeometry.sourcePort instanceof ClusterBoundaryPort
        )
      ) {
        setOfPortLocations.add(edgeGeometry.sourcePort.Location)
      }

      if (
        !(
          edgeGeometry.targetPort instanceof HookUpAnywhereFromInsidePort ||
          edgeGeometry.targetPort instanceof ClusterBoundaryPort
        )
      ) {
        setOfPortLocations.add(edgeGeometry.targetPort.Location)
      }
    }
  }

  //  this function might change the shape's loose polylines by inserting new points
  FillVisibilityGraphUnderShape(shape: Shape) {
    // going depth first
    const children = shape.Children
    for (const child of children) {
      this.FillVisibilityGraphUnderShape(child)
    }

    const tightLooseCouple: TightLooseCouple =
      this.shapesToTightLooseCouples.get(shape)
    const looseBoundary: Polyline = tightLooseCouple
      ? <Polyline>tightLooseCouple.LooseShape.BoundaryCurve
      : null
    const looseShape: Shape = tightLooseCouple
      ? tightLooseCouple.LooseShape
      : this.looseRoot
    const obstacles = new Set<Polyline>(
      looseShape.Children.map((c) => <Polyline>c.BoundaryCurve),
    )
    const portLocations =
      this.RemoveInsidePortsAndSplitBoundaryIfNeeded(looseBoundary)
    // this run will split the polyline enough to route later from the inner ports
    let tmpVisGraph = new VisibilityGraph()
    let coneSpanner = ConeSpanner.mk(
      [],
      tmpVisGraph,
      this.coneAngle,
      portLocations,
      looseBoundary,
    )
    coneSpanner.run()
    // now run the spanner again to create the correct visibility graph around the inner obstacles
    tmpVisGraph = new VisibilityGraph()
    coneSpanner = ConeSpanner.mk(
      Array.from(obstacles),
      tmpVisGraph,
      this.coneAngle,
      portLocations,
      looseBoundary,
    )
    coneSpanner.run()
    this.ProgressStep()
    for (const edge of tmpVisGraph.Edges) {
      this.TryToCreateNewEdgeAndSetIsPassable(edge, looseShape)
    }

    this.AddBoundaryEdgesToVisGraph(looseBoundary)
    //             if (obstacles.Count > 0)
    //                 SplineRouter.ShowVisGraph(tmpVisGraph, obstacles, null, null);
  }

  bidirectional = false
  //  If set to true then a smaller visibility graph is created.
  //  An edge is added to the visibility graph only if it is found at least twice:
  //  once sweeping with a direction d and the second time with -d
  get Bidirectional(): boolean {
    return this.bidirectional
  }
  set Bidirectional(value: boolean) {
    this.bidirectional = value
  }

  //  #if TEST_MSAGL
  //      [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
  //      static internal void ShowVisGraph(VisibilityGraph tmpVisGraph, IEnumerable<Polyline> obstacles, IEnumerable<ICurve> greenCurves, IEnumerable<ICurve> redCurves) {
  //        var l = new Array<DebugCurve>(tmpVisGraph.Edges.Select(e => new DebugCurve(100, 1,
  //            e.IsPassable != null && e.IsPassable() ? "green" : "black"
  //            , new LineSegment(e.SourcePoint, e.TargetPoint))));
  //        if (obstacles != null)
  //          l.AddRange(obstacles.Select(p => new DebugCurve(100, 1, "brown", p)));
  //        if (greenCurves != null)
  //          l.AddRange(greenCurves.Select(p => new DebugCurve(100, 10, "navy", p)));
  //        if (redCurves != null)
  //          l.AddRange(redCurves.Select(p => new DebugCurve(100, 10, "red", p)));
  //        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
  //      }
  //  #endif
  TryToCreateNewEdgeAndSetIsPassable(edge: VisibilityEdge, looseShape: Shape) {
    let e = this.visGraph.FindEdgePP(edge.SourcePoint, edge.TargetPoint)
    if (e != null) {
      return
    }

    e = this.visGraph.AddEdge(edge.SourcePoint, edge.TargetPoint)
    if (looseShape != null) {
    }

    looseShape.IsTransparent
  }

  AddBoundaryEdgesToVisGraph(boundary: Polyline) {
    if (boundary == null) {
      return
    }
    let pn: PolylinePoint
    for (let p = boundary.startPoint; true; p = pn) {
      pn = p.nextOnPolyline
      this.visGraph.AddEdge(p.point, pn.point)
      if (pn == boundary.startPoint) {
        break
      }
    }
  }

  RemoveInsidePortsAndSplitBoundaryIfNeeded(boundary: Polyline): PointSet {
    const ret = new PointSet()
    if (boundary == null) {
      for (const point of this.portRTree.GetAllLeaves()) {
        ret.add(point)
      }

      this.portRTree.Clear()
      return ret
    }

    const boundaryBox: Rectangle = boundary.boundingBox
    const portLocationsInQuestion =
      this.portRTree.GetAllIntersecting(boundaryBox)

    for (const point of portLocationsInQuestion) {
      switch (Curve.PointRelativeToCurveLocation(point, boundary)) {
        case PointLocation.Inside:
          ret.add(point)
          this.portLocationsToLoosePolylines.set(point, boundary)
          this.portRTree.Remove(Rectangle.rectangleOnPoint(point), point)
          break
        case PointLocation.Boundary:
          this.portRTree.Remove(Rectangle.rectangleOnPoint(point), point)
          this.portLocationsToLoosePolylines.set(point, boundary)
          const polylinePoint: PolylinePoint =
            SplineRouter.FindPointOnPolylineToInsertAfter(boundary, point)
          if (polylinePoint != null) {
            LineSweeper.InsertPointIntoPolylineAfter(
              boundary,
              polylinePoint,
              point,
            )
          } else {
            throw new Error()
          }

          break
      }
    }

    return ret
  }

  static FindPointOnPolylineToInsertAfter(
    boundary: Polyline,
    point: Point,
  ): PolylinePoint {
    for (let p: PolylinePoint = boundary.startPoint; ; ) {
      const pn: PolylinePoint = p.nextOnPolyline
      if (
        Point.closeDistEps(point, p.point) ||
        Point.closeDistEps(point, pn.point)
      ) {
        return null
      }

      // the point is already inside
      const dist = Point.distToLineSegment(point, p.point, pn.point).dist
      if (closeDistEps(dist, 0)) {
        return p
      }

      p = pn
      if (p == boundary.startPoint) {
        throw new Error()
      }
    }
  }

  //  creates a root; a shape with BoundaryCurve set to null
  GetOrCreateRoot() {
    if (this.rootShapes.length == 0) {
      return
    }

    if (this.rootShapes.length == 1) {
      const r: Shape = this.rootShapes[0]
      if (r.BoundaryCurve == null) {
        this.root = r
        return
      }
    }

    this.rootWasCreated = true
    this.root = new Shape(null)
    for (const rootShape of this.rootShapes) {
      this.root.AddChild(rootShape)
    }
  }

  RemoveRoot() {
    if (this.rootWasCreated) {
      for (const rootShape of this.rootShapes) {
        rootShape.RemoveParent(this.root)
      }
    }
  }

  //  #if TEST_MSAGL
  //      // ReSharper disable UnusedMember.Local
  //      [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
  //      static void Show(
  //          IEnumerable<EdgeGeometry> edgeGeometries, IEnumerable<Shape> listOfShapes) {
  //        // ReSharper restore UnusedMember.Local
  //        var r = new Random(1);
  //        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(
  //            listOfShapes.Select(s => s.BoundaryCurve).Select(
  //                c => new DebugCurve(50, 1, DebugCurve.Colors[r.Next(DebugCurve.Colors.Length - 1)], c)).Concat(
  //                    edgeGeometries.Select(e => new DebugCurve(100, 1, "red", e.Curve))));
  //      }
  //  #endif
  static GetAncestorSetsMap(
    shapes: IEnumerable<Shape>,
  ): Map<Shape, Set<Shape>> {
    const ancSets = new Map<Shape, Set<Shape>>()
    for (const child of shapes.where((child) => !ancSets.has(child))) {
      ancSets.set(child, SplineRouter.GetAncestorSet(child, ancSets))
    }
    return ancSets
  }

  static GetAncestorSet(
    child: Shape,
    ancSets: Map<Shape, Set<Shape>>,
  ): Set<Shape> {
    const ret = new Set<Shape>(child.Parents)
    for (const parent of child.Parents) {
      let addition = ancSets.get(parent)
      if (!addition) {
        ancSets.set(
          parent,
          (addition = SplineRouter.GetAncestorSet(parent, ancSets)),
        )
      }
      for (const t of addition) ret.add(t)
    }
    return ret
  }

  static CreatePortsIfNeeded(edges: GeomEdge[]) {
    for (const edge of edges) {
      if (edge.sourcePort == null) {
        const ed = edge
        new RelativeFloatingPort(
          () => ed.source.boundaryCurve,
          () => ed.source.center,
          new Point(0, 0),
        )
      }

      if (edge.targetPort == null) {
        const ed = edge
        new RelativeFloatingPort(
          () => ed.target.boundaryCurve,
          () => ed.target.center,
          new Point(0, 0),
        )
      }
    }
  }

  //   computes loosePadding for spline routing obstacles from node separation and EdgePadding.
  static ComputeLooseSplinePadding(
    nodeSeparation: number,
    edgePadding: number,
  ): number {
    Assert.assert(edgePadding > 0, 'require EdgePadding > 0')
    const twicePadding: number = 2 * edgePadding
    Assert.assert(
      nodeSeparation > twicePadding,
      'require OverlapSeparation > 2*EdgePadding',
    )
    //  the 8 divisor is just to guarantee the final postcondition
    const loosePadding: number = (nodeSeparation - twicePadding) / 8
    Assert.assert(loosePadding > 0, 'require LoosePadding > 0')
    Assert.assert(
      twicePadding + 2 * loosePadding < nodeSeparation,
      'EdgePadding too big!',
    )
    return loosePadding
  }
}
