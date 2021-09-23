//
//  RectilinearEdgeRouter.cs
//  MSAGL main class for Rectilinear Edge Routing.Routing.
//
//  Copyright Microsoft Corporation.

import {Nudger} from './nudging/Nudger'
import {from, IEnumerable, InvalidOperationException} from 'linq-to-typescript'
import {CancelToken, GeomEdge, GeomGraph, ICurve, Point} from '../../..'
import {EdgeGeometry} from '../../layout/core/edgeGeometry'
import {Curve} from '../../math/geometry/curve'
import {DebugCurve} from '../../math/geometry/debugCurve'
import {Ellipse} from '../../math/geometry/ellipse'
import {GeomConstants} from '../../math/geometry/geomConstants'
import {LineSegment} from '../../math/geometry/lineSegment'
import {Polyline} from '../../math/geometry/polyline'
import {Algorithm} from '../../utils/algorithm'
import {Shape} from '../shape'
import {ShapeCreator} from '../ShapeCreator'
import {SplineRouter} from '../splineRouter'
import {VisibilityEdge} from '../visibility/VisibilityEdge'
import {VisibilityGraph} from '../visibility/VisibilityGraph'
import {VisibilityVertex} from '../visibility/VisibilityVertex'
import {MsmtRectilinearPath} from './MsmtRectilinearPath'
import {Path} from './nudging/Path'
import {Obstacle} from './obstacle'
import {ObstacleTree} from './ObstacleTree'
import {PointComparer} from './PointComparer'
import {PortManager} from './PortManager'
import {SparseVisibilityGraphGenerator} from './SparseVisibiltyGraphGenerator'
import {SsstRectilinearPath} from './SsstRectilinearPath'
import {VisibilityGraphGenerator} from './VisibilityGraphGenerator'
import {Arrowhead} from '../../layout/core/arrowhead'
import {SmoothedPolyline} from '../../math/geometry/smoothedPolyline'

//  Provides rectilinear edge routing functionality

export class RectilinearEdgeRouter extends Algorithm {
  //  If an edge does not connect to an obstacle it should stay away from it at least at the padding distance

  Padding = 0

  //  The radius of the arc inscribed into the path corners.

  CornerFitRadius = 0

  //  The relative penalty of a bend, representated as a percentage of the Manhattan distance between
  //  two ports being connected.

  BendPenaltyAsAPercentageOfDistance = 0

  //  If true, route to obstacle centers.  Initially false for greater accuracy with the current
  //  MultiSourceMultiTarget approach.

  public get RouteToCenterOfObstacles(): boolean {
    return this.PortManager.RouteToCenterOfObstacles
  }
  public set RouteToCenterOfObstacles(value: boolean) {
    this.PortManager.RouteToCenterOfObstacles = value
  }

  //  If true, limits the extension of port visibility splices into the visibility graph to the rectangle defined by
  //  the path endpoints.

  public get LimitPortVisibilitySpliceToEndpointBoundingBox(): boolean {
    return this.PortManager.LimitPortVisibilitySpliceToEndpointBoundingBox
  }
  public set LimitPortVisibilitySpliceToEndpointBoundingBox(value: boolean) {
    this.PortManager.LimitPortVisibilitySpliceToEndpointBoundingBox = value
  }

  //  Add an EdgeGeometry to route

  public AddEdgeGeometryToRoute(edgeGeometry: EdgeGeometry) {
    //  The Port.Location values are not necessarily rounded by the caller.  The values
    //  will be rounded upon acquisition in PortManager.cs.  PointComparer.Equal expects
    //  all values to be rounded.
    if (
      !Point.closeDistEps(
        GeomConstants.RoundPoint(edgeGeometry.sourcePort.Location),
        GeomConstants.RoundPoint(edgeGeometry.targetPort.Location),
      )
    ) {
      this.EdgeGeometries.push(edgeGeometry)
    } else {
      this.selfEdges.push(edgeGeometry)
    }
  }

  //  Array all edge routing specifications that are currently active.  We want to hide access to the
  //  Array itself so people don't add or remove items directly.

  public get EdgeGeometriesToRoute(): IEnumerable<EdgeGeometry> {
    return from(this.EdgeGeometries)
  }

  //  Remove all EdgeGeometries to route

  public RemoveAllEdgeGeometriesToRoute() {
    //  Don't call RemoveEdgeGeometryToRoute as it will interrupt the EdgeGeometries enumerator.
    this.EdgeGeometries = []
  }

  //  If true, this router uses a sparse visibility graph, which saves memory for large graphs but
  //  may choose suboptimal paths.  Set on constructor.

  public get UseSparseVisibilityGraph(): boolean {
    return this.GraphGenerator instanceof SparseVisibilityGraphGenerator
  }

  //  If true, this router uses obstacle bounding box rectangles in the visibility graph.
  //  Set on constructor.

  UseObstacleRectangles = false

  public get Obstacles(): IEnumerable<Shape> {
    return from(this.ShapeToObstacleMap.values()).select(
      (obs) => obs.InputShape,
    )
  }

  //  The collection of padded obstacle boundary polylines around the input shapes to route around.

  get PaddedObstacles(): IEnumerable<Polyline> {
    return from(this.ShapeToObstacleMap.values()).select(
      (obs) => obs.PaddedPolyline,
    )
  }

  //  Add obstacles to the router.

  public AddObstacles(obstacles: IEnumerable<Shape>) {
    this.AddShapes(obstacles)
    this.RebuildTreeAndGraph()
  }

  private AddShapes(obstacles: IEnumerable<Shape>) {
    for (const shape of obstacles) {
      this.AddObstacleWithoutRebuild(shape)
    }
  }

  //  Add a single obstacle to the router.

  public AddObstacle(shape: Shape) {
    this.AddObstacleWithoutRebuild(shape)
    this.RebuildTreeAndGraph()
  }

  //  For each Shapes, update its position and reroute as necessary.

  public UpdateObstacles(obstacles: IEnumerable<Shape>) {
    for (const shape of obstacles) {
      this.UpdateObstacleWithoutRebuild(shape)
    }

    this.RebuildTreeAndGraph()
  }

  //  For each Shapes, update its position and reroute as necessary.

  public UpdateObstacle(obstacle: Shape) {
    this.UpdateObstacleWithoutRebuild(obstacle)
    this.RebuildTreeAndGraph()
  }

  //  Remove obstacles from the router.

  public RemoveObstacles(obstacles: IEnumerable<Shape>) {
    for (const shape of obstacles) {
      this.RemoveObstacleWithoutRebuild(shape)
    }

    this.RebuildTreeAndGraph()
  }

  //  Removes an obstacle from the router.

  //  <returns>All EdgeGeometries affected by the re-routing and re-nudging in order to avoid the new obstacle.</returns>
  public RemoveObstacle(obstacle: Shape) {
    this.RemoveObstacleWithoutRebuild(obstacle)
    this.RebuildTreeAndGraph()
  }

  //  utilities

  AddObstacleWithoutRebuild(shape: Shape) {
    if (shape.BoundaryCurve == null) {
      throw new InvalidOperationException('Shape must have a BoundaryCurve')
    }

    this.CreatePaddedObstacle(shape)
  }

  UpdateObstacleWithoutRebuild(shape: Shape) {
    if (shape.BoundaryCurve == null) {
      throw new InvalidOperationException('Shape must have a BoundaryCurve')
    }

    //  Always do all of this even if the Shape objects are the same, because the BoundaryCurve probably changed.
    this.PortManager.RemoveObstaclePorts(this.ShapeToObstacleMap.get(shape))
    this.CreatePaddedObstacle(shape)
  }

  private CreatePaddedObstacle(shape: Shape) {
    const obstacle = new Obstacle(
      shape,
      this.UseObstacleRectangles,
      this.Padding,
    )
    this.ShapeToObstacleMap.set(shape, obstacle)
    this.PortManager.CreateObstaclePorts(obstacle)
  }

  RemoveObstacleWithoutRebuild(shape: Shape) {
    const obstacle: Obstacle = this.ShapeToObstacleMap.get(shape)
    this.ShapeToObstacleMap.delete(shape)
    this.PortManager.RemoveObstaclePorts(obstacle)
  }

  //  Remove all obstacles from the graph.

  public RemoveAllObstacles() {
    this.InternalClear(/* retainObstacles:*/ false)
  }

  RebuildTreeAndGraph() {
    const hadTree: boolean = this.ObsTree.Root != null
    const hadVg: boolean = this.GraphGenerator.VisibilityGraph != null
    this.InternalClear(/* retainObstacles:*/ true)
    if (hadTree) {
      this.GenerateObstacleTree()
    }

    if (hadVg) {
      this.GenerateVisibilityGraph()
    }
  }

  //  The visibility graph generated by GenerateVisibilityGraph.

  get VisibilityGraph(): VisibilityGraph {
    this.GenerateVisibilityGraph()
    return this.GraphGenerator.VisibilityGraph
  }

  //  Clears all data set into the router.

  public Clear() {
    this.InternalClear(/* retainObstacles:*/ false)
  }

  GraphGenerator: VisibilityGraphGenerator

  //  To support dynamic obstacles, we index obstacles by their Shape, which is
  //  the unpadded inner obstacle boundary and contains a unique ID so we can
  //  handle overlap due to dragging.

  ShapeToObstacleMap: Map<Shape, Obstacle> = new Map<Shape, Obstacle>()

  // <summary>
  //  The list of EdgeGeometries to route
  // </summary>
  EdgeGeometries: Array<EdgeGeometry> = new Array<EdgeGeometry>()

  // <summary>
  //  Manages the mapping between App-level Ports, their locations, and their containing EdgeGeometries.
  // </summary>
  PortManager: PortManager

  AncestorsSets: Map<Shape, Set<Shape>>

  static constructorEmpty(): RectilinearEdgeRouter {
    return RectilinearEdgeRouter.constructorC(null)
    //  pass-through default arguments to parameterized ctor
  }
  static constructorC(cancelToket: CancelToken): RectilinearEdgeRouter {
    return new RectilinearEdgeRouter(
      from([]),
      RectilinearEdgeRouter.DefaultPadding,
      RectilinearEdgeRouter.DefaultCornerFitRadius,
      /* useSparseVisibilityGraph:*/ false,
      /* useObstacleRectangles:*/ false,
    )
  }

  //  The padding from an obstacle's curve to its enclosing polyline.

  static DefaultPadding = 1

  //  The default radius of the arc inscribed into path corners.

  static DefaultCornerFitRadius = 3

  //  Constructor that takes the obstacles but uses defaults for other arguments.

  //  <param name="obstacles">The collection of shapes to route around. Contains all source and target shapes
  //  as well as any intervening obstacles.</param>
  static constructorI(Obstacle: IEnumerable<Shape>): RectilinearEdgeRouter {
    return new RectilinearEdgeRouter(
      Obstacle,
      RectilinearEdgeRouter.DefaultPadding,
      RectilinearEdgeRouter.DefaultCornerFitRadius,
      /* useSparseVisibilityGraph:*/ false,
      /* useObstacleRectangles:*/ false,
    )
  }

  //  Constructor for a router that does not use obstacle rectangles in the visibility graph.

  //  <param name="obstacles">The collection of shapes to route around. Contains all source and target shapes
  //  as well as any intervening obstacles.</param>
  //  <param name="padding">The minimum padding from an obstacle's curve to its enclosing polyline.</param>
  //  <param name="cornerFitRadius">The radius of the arc inscribed into path corners</param>
  //  <param name="useSparseVisibilityGraph">If true, use a sparse visibility graph, which saves memory for large graphs
  //  but may select suboptimal paths</param>
  static constructorINNB(
    obstacles: IEnumerable<Shape>,
    padding: number,
    cornerFitRadius: number,
    useSparseVisibilityGraph: boolean,
  ): RectilinearEdgeRouter {
    return new RectilinearEdgeRouter(
      obstacles,
      padding,
      cornerFitRadius,
      useSparseVisibilityGraph,
      /* useObstacleRectangles:*/ false,
    )
  }

  //  Constructor specifying graph and shape information.

  //  <param name="obstacles">The collection of shapes to route around. Contains all source and target shapes
  //  as well as any intervening obstacles.</param>
  //  <param name="padding">The minimum padding from an obstacle's curve to its enclosing polyline.</param>
  //  <param name="cornerFitRadius">The radius of the arc inscribed into path corners</param>
  //  <param name="useSparseVisibilityGraph">If true, use a sparse visibility graph, which saves memory for large graphs
  //  but may select suboptimal paths</param>
  //  <param name="useObstacleRectangles">Use obstacle bounding boxes in visibility graph</param>
  public constructor(
    obstacles: IEnumerable<Shape>,
    padding: number,
    cornerFitRadius: number,
    useSparseVisibilityGraph: boolean,
    useObstacleRectangles: boolean,
  ) {
    super(null)
    this.Padding = padding
    this.CornerFitRadius = cornerFitRadius
    this.BendPenaltyAsAPercentageOfDistance =
      SsstRectilinearPath.DefaultBendPenaltyAsAPercentageOfDistance
    this.GraphGenerator = new SparseVisibilityGraphGenerator()

    this.UseObstacleRectangles = useObstacleRectangles
    this.PortManager = new PortManager(this.GraphGenerator)
    this.AddShapes(obstacles)
  }

  //  Constructor specifying graph information.

  //  <param name="graph">The graph whose edges are being routed.</param>
  //  <param name="padding">The minimum padding from an obstacle's curve to its enclosing polyline.</param>
  //  <param name="cornerFitRadius">The radius of the arc inscribed into path corners</param>
  //  <param name="useSparseVisibilityGraph">If true, use a sparse visibility graph, which saves memory for large graphs
  //  but may select suboptimal paths</param>
  static constructorGNNB(
    graph: GeomGraph,
    padding: number,
    cornerFitRadius: number,
    useSparseVisibilityGraph: boolean,
  ): RectilinearEdgeRouter {
    return this.constructorGNNBB(
      graph,
      padding,
      cornerFitRadius,
      useSparseVisibilityGraph,
      /* useObstacleRectangles:*/ false,
    )
  }

  //  Constructor specifying graph information.

  //  <param name="graph">The graph whose edges are being routed.</param>
  //  <param name="padding">The minimum padding from an obstacle's curve to its enclosing polyline.</param>
  //  <param name="cornerFitRadius">The radius of the arc inscribed into path corners</param>
  //  <param name="useSparseVisibilityGraph">If true, use a sparse visibility graph, which saves memory for large graphs
  //  but may select suboptimal paths</param>
  //  <param name="useObstacleRectangles">If true, use obstacle bounding boxes in visibility graph</param>
  static constructorGNNBB(
    graph: GeomGraph,
    padding: number,
    cornerFitRadius: number,
    useSparseVisibilityGraph: boolean,
    useObstacleRectangles: boolean,
  ): RectilinearEdgeRouter {
    const ret = new RectilinearEdgeRouter(
      ShapeCreator.GetShapes(graph),
      padding,
      cornerFitRadius,
      useSparseVisibilityGraph,
      useObstacleRectangles,
    )
    for (const edge of graph.edges()) {
      ret.AddEdgeGeometryToRoute(edge.edgeGeometry)
    }
    return ret
  }

  //  Executes the algorithm.

  run() {
    this.RouteEdges()
  }

  //  Calculates the routed edges geometry, optionally forcing re-routing for existing paths.

  //  <returns></returns>
  private RouteEdges() {
    //  Create visibility graph if not already done.
    this.GenerateVisibilityGraph()
    this.GeneratePaths()
  }

  GeneratePaths() {
    const edgePaths = this.EdgeGeometries.map((eg) => new Path(eg))
    this.FillEdgePathsWithShortestPaths(from(edgePaths))
    this.NudgePaths(from(edgePaths))
    this.RouteSelfEdges()
    this.FinaliseEdgeGeometries()
  }

  RouteSelfEdges() {
    for (const edge of this.selfEdges) {
      const t: {smoothedPolyline: SmoothedPolyline} = {smoothedPolyline: null}
      edge.curve = GeomEdge.RouteSelfEdge(
        edge.sourcePort.Curve,
        Math.max(this.Padding, 2 * edge.GetMaxArrowheadLength()),
        t,
      )
    }
  }

  private FillEdgePathsWithShortestPaths(edgePaths: IEnumerable<Path>) {
    this.PortManager.BeginRouteEdges()
    const shortestPathRouter = new MsmtRectilinearPath(
      this.BendPenaltyAsAPercentageOfDistance,
    )
    for (const edgePath of edgePaths) {
      this.AddControlPointsAndGeneratePath(shortestPathRouter, edgePath)
    }

    this.PortManager.EndRouteEdges()
  }

  private AddControlPointsAndGeneratePath(
    shortestPathRouter: MsmtRectilinearPath,
    edgePath: Path,
  ) {
    const intersectPoints: Point[] = this.PortManager.GetPortVisibilityIntersection(
      edgePath.EdgeGeometry,
    )
    if (intersectPoints != null) {
      this.GeneratePathThroughVisibilityIntersection(edgePath, intersectPoints)
      return
    }

    this.SpliceVisibilityAndGeneratePath(shortestPathRouter, edgePath)
  }

  GeneratePathThroughVisibilityIntersection(
    edgePath: Path,
    intersectPoints: Point[],
  ) {
    edgePath.PathPoints = intersectPoints
  }

  SpliceVisibilityAndGeneratePath(
    shortestPathRouter: MsmtRectilinearPath,
    edgePath: Path,
  ) {
    this.PortManager.AddControlPointsToGraph(
      edgePath.EdgeGeometry,
      this.ShapeToObstacleMap,
    )
    // this.PortManager.TransUtil.DevTrace_VerifyAllVertices(this.VisibilityGraph)
    // this.PortManager.TransUtil.DevTrace_VerifyAllEdgeIntersections(
    //   this.VisibilityGraph,
    // )
    if (!this.GeneratePath(shortestPathRouter, edgePath)) {
      this.RetryPathsWithAdditionalGroupsEnabled(shortestPathRouter, edgePath)
    }

    this.PortManager.RemoveControlPointsFromGraph()
  }

  //  ReSharper disable UnusedMember.Local

  GeneratePath(
    shortestPathRouter: MsmtRectilinearPath,
    edgePath: Path,
    lastChance = false,
  ): boolean {
    const sourceVertices = this.PortManager.FindVertices(
      edgePath.EdgeGeometry.sourcePort,
    )
    const targetVertices = this.PortManager.FindVertices(
      edgePath.EdgeGeometry.targetPort,
    )
    return RectilinearEdgeRouter.GetSingleStagePath(
      edgePath,
      shortestPathRouter,
      sourceVertices,
      targetVertices,
      lastChance,
    )
  }

  private static GetSingleStagePath(
    edgePath: Path,
    shortestPathRouter: MsmtRectilinearPath,
    sourceVertices: Array<VisibilityVertex>,
    targetVertices: Array<VisibilityVertex>,
    lastChance: boolean,
  ): boolean {
    edgePath.PathPoints = shortestPathRouter.GetPath(
      from(sourceVertices),
      from(targetVertices),
    )
    if (lastChance) {
      RectilinearEdgeRouter.EnsureNonNullPath(edgePath)
    }

    return edgePath.PathPoints != null
  }

  private static EnsureNonNullPath(edgePath: Path) {
    if (edgePath.PathPoints == null) {
      //  Probably a fully-landlocked obstacle such as RectilinearTests.Route_Between_Two_Separately_Landlocked_Obstacles
      //  or disconnected subcomponents due to excessive overlaps, such as Rectilinear(File)Tests.*Disconnected*.  In this
      //  case, just put the single-bend path in there, even though it most likely cuts across unrelated obstacles.
      if (
        PointComparer.IsPureDirection(
          edgePath.EdgeGeometry.sourcePort.Location,
          edgePath.EdgeGeometry.targetPort.Location,
        )
      ) {
        edgePath.EdgeGeometry.sourcePort.Location
        edgePath.EdgeGeometry.targetPort.Location

        return
      }

      edgePath.EdgeGeometry.sourcePort.Location
      new Point(
        edgePath.EdgeGeometry.sourcePort.Location.x,
        edgePath.EdgeGeometry.targetPort.Location.y,
      )
      edgePath.EdgeGeometry.targetPort.Location
    }
  }

  RetryPathsWithAdditionalGroupsEnabled(
    shortestPathRouter: MsmtRectilinearPath,
    edgePath: Path,
  ) {
    //  Insert any spatial parent groups that are not in our hierarchical parent tree and retry,
    //  if we haven't already done this.
    if (
      !this.PortManager.SetAllAncestorsActive(
        edgePath.EdgeGeometry,
        this.ShapeToObstacleMap,
      ) ||
      !this.GeneratePath(shortestPathRouter, edgePath)
    ) {
      //  Last chance: enable all groups (if we have any).  Only do this on a per-path basis so a single degenerate
      //  path won't make the entire graph look bad.
      this.PortManager.SetAllGroupsActive()
      this.GeneratePath(shortestPathRouter, edgePath, /* lastChance:*/ true)
    }
  }

  //  static ShowPointEnum(p: IEnumerable<Point>) {
  //     //  ReSharper disable InconsistentNaming
  //     const w0: number = 0.1;
  //     const w1: number = 3;
  //     let arr: Point[] = p.toArray();
  //     let d: number = ((w1 - w0)
  //                 / (arr.length - 1));
  //     let l = new Array<DebugCurve>();
  //     for (let i: number = 0; (i
  //                 < (arr.length - 1)); i++) {
  //         l.Add(new DebugCurve(100, (w0
  //                             + (i * d)), "blue", new LineSegment(arr[i], arr[(i + 1)])));
  //     }

  //     LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
  //     //  ReSharper restore InconsistentNaming
  // }

  NudgePaths(edgePaths: IEnumerable<Path>) {
    //  If we adjusted for spatial ancestors, this nudging can get very weird, so refetch in that case.
    const ancestorSets = this.ObsTree.SpatialAncestorsAdjusted
      ? SplineRouter.GetAncestorSetsMap(this.Obstacles)
      : this.AncestorsSets
    //  Using VisibilityPolyline retains any reflection/staircases on the convex hull borders; using
    //  PaddedPolyline removes them.
    Nudger.NudgePaths(
      edgePaths,
      this.CornerFitRadius,
      this.PaddedObstacles,
      ancestorSets,
      this.RemoveStaircases,
    )
    // Nudger.NudgePaths(edgePaths, CornerFitRadius, this.ObstacleTree.GetAllPrimaryObstacles().Select(obs => obs.VisibilityPolyline), ancestorSets, RemoveStaircases);
  }

  private removeStaircases = true

  selfEdges: Array<EdgeGeometry> = new Array<EdgeGeometry>()

  // <summary>
  // </summary>
  public get RemoveStaircases(): boolean {
    return this.removeStaircases
  }
  public set RemoveStaircases(value: boolean) {
    this.removeStaircases = value
  }

  FinaliseEdgeGeometries() {
    for (const edgeGeom of this.EdgeGeometries.concat(this.selfEdges)) {
      if (edgeGeom.curve == null) {
        continue
      }

      const poly = edgeGeom.curve instanceof Polyline
      if (poly) {
        edgeGeom.curve = RectilinearEdgeRouter.FitArcsIntoCorners(
          this.CornerFitRadius,
          Array.from((<Polyline>edgeGeom.curve).points()),
        )
      }

      RectilinearEdgeRouter.CalculateArrowheads(edgeGeom)
    }
  }

  CreateVisibilityGraph() {
    this.GraphGenerator.Clear()
    this.InitObstacleTree()
    this.GraphGenerator.GenerateVisibilityGraph()
  }

  private static CalculateArrowheads(edgeGeom: EdgeGeometry) {
    Arrowhead.trimSplineAndCalculateArrowheadsII(
      edgeGeom,
      edgeGeom.sourcePort.Curve,
      edgeGeom.targetPort.Curve,
      edgeGeom.curve,
      true,
    )
  }

  private get ObsTree(): ObstacleTree {
    return this.GraphGenerator.ObstacleTree
  }

  private GenerateObstacleTree() {
    if (this.Obstacles == null || !this.Obstacles.any()) {
      throw new Error('No obstacles have been added')
    }

    if (this.ObsTree.Root == null) {
      this.InitObstacleTree()
    }
  }

  InitObstacleTree() {
    this.AncestorsSets = SplineRouter.GetAncestorSetsMap(this.Obstacles)
    this.ObsTree.Init(
      this.ShapeToObstacleMap.values(),
      this.AncestorsSets,
      this.ShapeToObstacleMap,
    )
  }

  private InternalClear(retainObstacles: boolean) {
    this.GraphGenerator.Clear()
    this.ClearShortestPaths()
    if (retainObstacles) {
      //  Remove precalculated visibility, since we're likely revising obstacle positions.
      this.PortManager.ClearVisibility()
    } else {
      this.PortManager.Clear()
      this.ShapeToObstacleMap.clear()
      this.EdgeGeometries = []
    }
  }

  private ClearShortestPaths() {
    for (const edgeGeom of this.EdgeGeometries) {
      edgeGeom.curve = null
    }
  }

  GenerateVisibilityGraph() {
    if (this.Obstacles == null || !this.Obstacles.any()) {
      throw new Error('No obstacles have been set')
    }

    //  Must test GraphGenerator.VisibilityGraph because this.VisibilityGraph calls back to
    //  this function to ensure the graph is present.
    if (this.GraphGenerator.VisibilityGraph == null) {
      this.CreateVisibilityGraph()
    }
  }

  //  ShowPathWithTakenEdgesAndGraph(path: IEnumerable<VisibilityVertex>, takenEdges: Set<VisibilityEdge>) {
  //     let list = new Array<VisibilityVertex>(path);
  //     let lines = new Array<LineSegment>();
  //     for (let i: number = 0; (i
  //                 < (list.Count - 1)); i++) {
  //         lines.Add(new LineSegment(list[i].Point, list[(i + 1)].Point));
  //     }

  //     //  ReSharper disable InconsistentNaming
  //     let w0: number = 4;
  //     const let w1: number = 8;
  //     let delta: number = ((w1 - w0)
  //                 / (list.Count - 1));
  //     let dc = new Array<DebugCurve>();
  //     for (let line: LineSegment of lines) {
  //         dc.Add(new DebugCurve(50, w0, "red", line));
  //         w0 = (w0 + delta);
  //     }

  //     dc.AddRange(takenEdges.Select(() => {  }, new DebugCurve(50, 2, "black", new LineSegment(edge.SourcePoint, edge.TargetPoint))));
  //     let k: IEnumerable<DebugCurve> = this.GetGraphDebugCurves();
  //     dc.AddRange(k);
  //     LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dc);
  //     //  ReSharper restore InconsistentNaming
  // }

  static FitArcsIntoCorners(radius: number, polyline: Point[]): ICurve {
    const ellipses = RectilinearEdgeRouter.GetFittedArcSegs(radius, polyline)
    const curve = new Curve()
    let prevEllipse: Ellipse = null
    for (const ellipse of ellipses) {
      const ellipseIsAlmostCurve: boolean = RectilinearEdgeRouter.EllipseIsAlmostLineSegment(
        ellipse,
      )
      if (prevEllipse != null) {
        if (ellipseIsAlmostCurve) {
          Curve.continueWithLineSegmentP(
            curve,
            RectilinearEdgeRouter.CornerPoint(ellipse),
          )
        } else {
          Curve.continueWithLineSegmentP(curve, ellipse.start)
          curve.addSegment(ellipse)
        }
      } else if (ellipseIsAlmostCurve) {
        Curve.addLineSegment(
          curve,
          polyline[0],
          RectilinearEdgeRouter.CornerPoint(ellipse),
        )
      } else {
        Curve.addLineSegment(curve, polyline[0], ellipse.start)
        curve.addSegment(ellipse)
      }

      prevEllipse = ellipse
    }

    if (curve.segs.length > 0) {
      Curve.continueWithLineSegmentP(curve, polyline[polyline.length - 1])
    } else {
      Curve.addLineSegment(curve, polyline[0], polyline[polyline.length - 1])
    }

    return curve
  }

  static CornerPoint(ellipse: Ellipse): Point {
    return ellipse.center.add(ellipse.aAxis.add(ellipse.bAxis))
  }

  private static EllipseIsAlmostLineSegment(ellipse: Ellipse): boolean {
    return (
      ellipse.aAxis.lengthSquared < 0.0001 ||
      ellipse.aAxis.lengthSquared < 0.0001
    )
  }

  private static *GetFittedArcSegs(
    radius: number,
    polyline: Point[],
  ): IterableIterator<Ellipse> {
    let leg: Point = polyline[1].sub(polyline[0])
    let dir: Point = leg.normalize()
    let rad0: number = Math.min(radius, leg.length / 2)
    for (let i = 1; i < polyline.length - 1; i++) {
      let ret: Ellipse = null
      leg = polyline[i + 1].sub(polyline[i])
      const legLength: number = leg.length
      if (legLength < GeomConstants.intersectionEpsilon) {
        ret = new Ellipse(0, 0, new Point(0, 0), new Point(0, 0), polyline[i])
      }

      const ndir: Point = leg.div(legLength)
      if (Math.abs(ndir.dot(dir)) > 0.9) {
        yield new Ellipse(0, 0, new Point(0, 0), new Point(0, 0), polyline[i])
      }

      const nrad0: number = Math.min(radius, leg.length / 2)
      const axis0: Point = ndir.mul(-nrad0)
      const axis1: Point = dir.mul(rad0)
      yield new Ellipse(
        0,
        Math.PI / 2,
        axis0,
        axis1,
        polyline[i].sub(axis1.add(axis0)),
      )
      dir = ndir
      rad0 = nrad0
    }
  }
}