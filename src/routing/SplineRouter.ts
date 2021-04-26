import { from, IEnumerable, IGrouping } from 'linq-to-typescript'
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

  portRTree: RTree<Point, Point>

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
    this.looseRoot = new Shape(null)
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

  run(): void {
    if (this.edgeGeometriesEnumeration.length == 0) return
    this.GetOrCreateRoot()
    this.RouteOnRoot()
    this.RemoveRoot()
    /*     var ll = new List<DebugCurve>();
         ll.AddRange(rootShapes.Select(s=>shapesToTightLooseCouples[s].TightPolyline).Select(p=>new DebugCurve(100,0.05,"black", p)));
         ll.AddRange(geometryGraph.Edges.Select(s => new DebugCurve(100, 0.05, "black", s.Curve)));               
         LayoutAlgorithmSettings.ShowDebugCurvesEnumeration (ll);
         LayoutAlgorithmSettings.ShowGraph(geometryGraph);*/
  }
  GetOrCreateRoot(): void {
    if (this.rootShapes.length == 0) return

    if (this.rootShapes.length == 1) {
      const r = this.rootShapes[0]
      if (r.BoundaryCurve == null) {
        this.root = r
        return
      }
    }
    this.rootWasCreated = true
    this.root = new Shape()
    for (const rootShape of this.rootShapes) this.root.AddChild(rootShape)
  }
}
