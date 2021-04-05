//  The class is responsible for general edge bundling with ordered bundles.

import { IEnumerable } from 'linq-to-typescript'
import { Dictionary } from 'lodash'
import { RectangleNode } from '../../../core/geometry/RTree/RectangleNode'
import { Port } from '../../../core/layout/Port'
import { BundlingSettings } from '../../../core/routing/BundlingSettings'
import { EdgeGeometry } from '../../../layout/core/edgeGeometry'
import { GeomEdge } from '../../../layout/core/geomEdge'
import { GeomGraph } from '../../../layout/core/GeomGraph'
import { Curve } from '../../../math/geometry/curve'
import { IntersectionInfo } from '../../../math/geometry/intersectionInfo'
import { LineSegment } from '../../../math/geometry/lineSegment'
import { Point } from '../../../math/geometry/point'
import { Polyline } from '../../../math/geometry/polyline'
import { Rectangle } from '../../../math/geometry/rectangle'
import { SmoothedPolyline } from '../../../math/geometry/smoothedPolyline'
import { Algorithm } from '../../../utils/algorithm'
import { ClusterBoundaryPort } from '../../ClusterBoundaryPort'
import { VisibilityGraph } from '../../visibility/VisibilityGraph'

//  Currently the router will fail if there are node overlaps.
export class BundleRouter extends Algorithm {
  bundlingSettings: BundlingSettings

  geometryGraph: GeomGraph

  regularEdges: GeomEdge[]

  LoosePadding: number

  // for the shortest path calculation we will use not loosePadding, but loosePadding*SuperLoosePaddingCoefficient
  static SuperLoosePaddingCoefficient = 1.1

  shortestPathRouter: SdShortestPath

  TightHierarchy: RectangleNode<Polyline, Point>

  LooseHierarchy: RectangleNode<Polyline, Point>

  //  reports the status of the bundling
  Status: BundlingStatus

  VisibilityGraph: VisibilityGraph
  loosePolylineOfPort: Func<Port, Polyline>

  //  #if TEST_MSAGL && TEST_MSAGL
  //          void CheckGraph() {
  //              foreach (var e of geometryGraph.Edges) {
  //                  if (e.Source == e.Target)
  //                      continue;
  //                  CheckPortOfNode(e.Source, e.SourcePort);
  //                  CheckPortOfNode(e.Target, e.TargetPort);
  //              }
  //          }
  //          static void CheckPortOfNode(Node node, Port nodePort) {
  //              if (node is Cluster)
  //                  Assert.assert(nodePort is ClusterBoundaryPort || nodePort is HookUpAnywhereFromInsidePort || nodePort is CurvePort);
  //          }
  //  #endif
  constructor(
    geometryGraph: GeometryGraph,
    shortestPathRouter: SdShortestPath,
    visibilityGraph: VisibilityGraph,
    bundlingSettings: BundlingSettings,
    loosePadding: number,
    tightHierarchy: RectangleNode<Polyline, Point>,
    looseHierarchy: RectangleNode<Polyline, Point>,
    edgeLooseEnterable: Dictionary<EdgeGeometry, Set<Polyline>>,
    edgeTightEnterable: Dictionary<EdgeGeometry, Set<Polyline>>,
    loosePolylineOfPort: Func<Port, Polyline>,
  ) {
    ValidateArg.IsNotNull(this.geometryGraph, 'geometryGraph')
    ValidateArg.IsNotNull(this.bundlingSettings, 'bundlingSettings')
    this.geometryGraph = this.geometryGraph
    this.bundlingSettings = this.bundlingSettings
    this.regularEdges = this.geometryGraph.Edges.Where(
      (e) => e.Source != e.Target,
    ).ToArray()
    this.VisibilityGraph = visibilityGraph
    this.shortestPathRouter = shortestPathRouter
    this.LoosePadding = loosePadding
    this.LooseHierarchy = looseHierarchy
    this.TightHierarchy = tightHierarchy
    EdgeLooseEnterable = edgeLooseEnterable
    EdgeTightEnterable = edgeTightEnterable
    this.loosePolylineOfPort = loosePolylineOfPort
  }

  ThereAreOverlaps(hierarchy: RectangleNode<Polyline, Point>): boolean {
    return RectangleNodeUtils.FindIntersectionWithProperty(
      hierarchy,
      hierarchy,
      Curve.CurvesIntersect,
    )
  }

  //  edge routing with Ordered Bundles:
  //  1. route edges with bundling
  //  2. nudge bundles and hubs
  //  3. order paths
  protected /* override */ RunInternal() {
    // TimeMeasurer.DebugOutput("edge bundling started");
    if (this.ThereAreOverlaps(this.TightHierarchy)) {
      this.Status = BundlingStatus.Overlaps
      TimeMeasurer.DebugOutput('overlaps in edge bundling')
      return
    }

    this.FixLocationsForHookAnywherePorts(this.geometryGraph.Edges)
    if (!this.RoutePathsWithSteinerDijkstra()) {
      this.Status = BundlingStatus.EdgeSeparationIsTooLarge
      return
    }

    this.FixChildParentEdges()
    if (!this.bundlingSettings.StopAfterShortestPaths) {
      const metroGraphData = new MetroGraphData(
        this.regularEdges.Select((e) => e.EdgeGeometry).ToArray(),
        this.LooseHierarchy,
        this.TightHierarchy,
        this.bundlingSettings,
        this.shortestPathRouter.Cdt,
        EdgeLooseEnterable,
        EdgeTightEnterable,
        this.loosePolylineOfPort,
      )
      NodePositionsAdjuster.FixRouting(metroGraphData, this.bundlingSettings)
      new EdgeNudger(metroGraphData, this.bundlingSettings) + Run()
      // TimeMeasurer.DebugOutput("edge bundling ended");
    }

    this.RouteSelfEdges()
    this.FixArrowheads()
  }

  //  <summary>
  //  set endpoint of the edge from child to parent (cluster) to the boundary of the parent
  //  TODO: is there a better solution?
  //  </summary>
  FixChildParentEdges() {
    for (const edge of this.regularEdges) {
      const sPort = edge.SourcePort
      const ePort = edge.TargetPort
      if (sPort.Curve.BoundingBox.Contains(ePort.Curve.BoundingBox)) {
        const ii: IntersectionInfo = Curve.CurveCurveIntersectionOne(
          sPort.Curve,
          new LineSegment(edge.Curve.start, edge.Curve.End),
          true,
        )
          ; (<Polyline>edge.Curve).startPoint.point = ii.IntersectionPoint
      }

      if (ePort.Curve.BoundingBox.Contains(sPort.Curve.BoundingBox)) {
        const ii: IntersectionInfo = Curve.CurveCurveIntersectionOne(
          ePort.Curve,
          new LineSegment(edge.Curve.start, edge.Curve.End),
          true,
        )
          ; (<Polyline>edge.Curve).endPoint.point = ii.IntersectionPoint
      }
    }
  }

  static CreateConstrainedDelaunayTriangulation(
    looseHierarchy: RectangleNode<Polyline, Point>,
  ): Cdt {
    const obstacles: IEnumerable<Polyline> = looseHierarchy.GetAllLeaves()
    const rectangle: Rectangle = looseHierarchy.irect
    const d: number = rectangle.Diagonal / 4
    const lb: Point = rectangle.leftBottom + new Point(d * -1, d * -1)
    const lt: Point = rectangle.leftTop + new Point(d * -1, d)
    const rt: Point = rectangle.rightTop + new Point(d, d)
    const rb: Point = rectangle.rightBottom + new Point(d, d * -1)
    const additionalObstacles
    new Polyline(lb, lt, rt, rb)

    return BundleRouter.GetConstrainedDelaunayTriangulation(
      obstacles.Concat(additionalObstacles),
    )
  }

  static GetConstrainedDelaunayTriangulation(
    obstacles: IEnumerable<Polyline>,
  ): Cdt {
    const constrainedDelaunayTriangulation = new Cdt(null, obstacles, null)
    constrainedDelaunayTriangulation.Run()
    return constrainedDelaunayTriangulation
  }

  //  #if TEST_MSAGL && TEST_MSAGL
  //          [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
  //          // ReSharper disable UnusedMember.Local
  //          void ShowGraphLocal() {
  //              // ReSharper restore UnusedMember.Local
  //              var l = new List<ICurve>();
  //              l.Clear();
  //              foreach (var e of geometryGraph.Edges) {
  //                  {
  //                      l.Add(new Ellipse(2, 2, e.Curve.start));
  //                      l.Add(CurveFactory.CreateDiamond(5, 5, e.Curve.End));
  //                      l.Add(e.Curve);
  //                  }
  //              }
  //              SplineRouter.ShowVisGraph(VisibilityGraph, LooseHierarchy.GetAllLeaves(), null, l);
  //          }
  //  #endif
  FixLocationsForHookAnywherePorts(edges: IEnumerable<GeomEdge>) {
    for (const edge of edges) {
      const hookPort = <HookUpAnywhereFromInsidePort>edge.SourcePort
      if (hookPort != null) {
        hookPort.SetLocation(
          this.FigureOutHookLocation(
            hookPort.LoosePolyline,
            edge.TargetPort,
            edge.EdgeGeometry,
          ),
        )
      } else {
        hookPort = <HookUpAnywhereFromInsidePort>edge.TargetPort
        if (hookPort != null) {
          hookPort.SetLocation(
            this.FigureOutHookLocation(
              hookPort.LoosePolyline,
              edge.SourcePort,
              edge.EdgeGeometry,
            ),
          )
        }
      }
    }
  }

  FigureOutHookLocation(
    poly: Polyline,
    otherEdgeEndPort: Port,
    edgeGeom: EdgeGeometry,
  ): Point {
    const clusterPort = <ClusterBoundaryPort>otherEdgeEndPort
    if (clusterPort == null) {
      return this.FigureOutHookLocationForSimpleOtherPort(
        poly,
        otherEdgeEndPort,
        edgeGeom,
      )
    }

    return this.FigureOutHookLocationForClusterOtherPort(
      poly,
      clusterPort,
      edgeGeom,
    )
  }

  FigureOutHookLocationForClusterOtherPort(
    poly: Polyline,
    otherEdgeEndPort: ClusterBoundaryPort,
    edgeGeom: EdgeGeometry,
  ): Point {
    const shapes = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(
      edgeGeom,
    )
    // SplineRouter.ShowVisGraph(this.VisibilityGraph, this.LooseHierarchy.GetAllLeaves(),
    //     shapes.Select(sh => sh.BoundaryCurve), new[] { new LineSegment(edgeGeom.SourcePort.Location, edgeGeom.TargetPort.Location) });
    const s = new MultipleSourceMultipleTargetsShortestPathOnVisibilityGraph(
      otherEdgeEndPort.LoosePolyline.Select((p) =>
        this.VisibilityGraph.FindVertex(p),
      ),
      poly.Select((p) => this.VisibilityGraph.FindVertex(p)),
      this.VisibilityGraph,
    )
    const path = s.GetPath()
    for (const sh of shapes) {
      sh.IsTransparent = false
    }

    return path.Last().point
  }

  private FigureOutHookLocationForSimpleOtherPort(
    poly: Polyline,
    otherEdgeEndPort: Port,
    edgeGeom: EdgeGeometry,
  ): Point {
    const otherEdgeEnd: Point = otherEdgeEndPort.Location
    const shapes = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(
      edgeGeom,
    )
    // SplineRouter.ShowVisGraph(this.VisibilityGraph, this.LooseHierarchy.GetAllLeaves(),
    //     shapes.Select(sh => sh.BoundaryCurve), new[] { new LineSegment(edgeGeom.SourcePort.Location, edgeGeom.TargetPort.Location) });
    const s = new SingleSourceMultipleTargetsShortestPathOnVisibilityGraph(
      this.VisibilityGraph.FindVertex(otherEdgeEnd),
      poly.PolylinePoints.Select((p) =>
        this.VisibilityGraph.FindVertex(p.point),
      ),
      this.VisibilityGraph,
    )
    const path = s.GetPath()
    for (const sh of shapes) {
      sh.IsTransparent = false
    }

    return path.Last().point
  }

  EdgeLooseEnterable: Dictionary<EdgeGeometry, Set<Polyline>>

  EdgeTightEnterable: Dictionary<EdgeGeometry, Set<Polyline>>
  RoutePathsWithSteinerDijkstra(): boolean {
    this.shortestPathRouter.VisibilityGraph = this.VisibilityGraph
    this.shortestPathRouter.BundlingSettings = this.bundlingSettings
    this.shortestPathRouter.EdgeGeometries = this.regularEdges
      .Select((e) => e.EdgeGeometry)
      .ToArray()
    this.shortestPathRouter.ObstacleHierarchy = this.LooseHierarchy
    this.shortestPathRouter.RouteEdges()
    // find appropriate edge separation
    if (this.shortestPathRouter.Cdt != null) {
      if (!this.AnalyzeEdgeSeparation()) {
        return false
      }
    }

    return true
  }

  //  <summary>
  //  calculates maximum possible edge separation for the computed routing
  //    if it is greater than bundlingSettings.EdgeSeparation, then proceed
  //    if it is smaller, then either
  //      stop edge bundling, or
  //      reduce edge separation, or
  //      move obstacles to get more free space
  //  </summary>
  AnalyzeEdgeSeparation(): boolean {
    const crossedCdtEdges: Dictionary<
      EdgeGeometry,
      Set<CdtEdge>
    > = new Dictionary<EdgeGeometry, Set<CdtEdge>>()
    this.shortestPathRouter.FillCrossedCdtEdges(crossedCdtEdges)
    const pathsOnCdtEdge: Dictionary<
      CdtEdge,
      Set<EdgeGeometry>
    > = this.GetPathsOnCdtEdge(crossedCdtEdges)
    const es: number = this.CalculateMaxAllowedEdgeSeparation(pathsOnCdtEdge)
    //  TimeMeasurer.DebugOutput("opt es: " + es);
    if (es >= this.bundlingSettings.EdgeSeparation) {
      return true
    }

    // we can even enlarge it here
    if (es <= 0.02) {
      TimeMeasurer.DebugOutput(
        "edge bundling can't be executed: not enough free space around obstacles",
      )
      for (const e of this.regularEdges) {
        e.Curve = null
      }

      return false
    }

    //  reducing edge separation
    //  TimeMeasurer.DebugOutput("reducing edge separation to " + es);
    this.bundlingSettings.EdgeSeparation = es
    this.shortestPathRouter.RouteEdges()
    return true
  }

  GetPathsOnCdtEdge(
    crossedEdges: Dictionary<EdgeGeometry, Set<CdtEdge>>,
  ): Dictionary<CdtEdge, Set<EdgeGeometry>> {
    const res: Dictionary<CdtEdge, Set<EdgeGeometry>> = new Dictionary<
      CdtEdge,
      Set<EdgeGeometry>
    >()
    for (const edge of crossedEdges.Keys) {
      for (const cdtEdge of crossedEdges[edge]) {
        CollectionUtilities.AddToMap(res, cdtEdge, edge)
      }
    }

    return res
  }

  CalculateMaxAllowedEdgeSeparation(
    pathsOnCdtEdge: Dictionary<CdtEdge, Set<EdgeGeometry>>,
  ): number {
    let l = 0.01
    let r = 10
    //  ?TODO: change to bundlingSettings.EdgeSeparation;
    if (this.EdgeSeparationIsOk(pathsOnCdtEdge, r)) {
      return r
    }

    while (Math.abs(r - l) > 0.01) {
      const cen: number = (l + r) / 2
      if (this.EdgeSeparationIsOk(pathsOnCdtEdge, cen)) {
        l = cen
      } else {
        r = cen
      }
    }

    return l
  }

  EdgeSeparationIsOk(
    pathsOnCdtEdge: Dictionary<CdtEdge, Set<EdgeGeometry>>,
    separation: number,
  ): boolean {
    // total number of cdt edges
    const total: number = pathsOnCdtEdge.Count
    if (total == 0) {
      return true
    }

    // number of edges with requiredWidth <= availableWidth
    let ok = 0
    for (const edge of pathsOnCdtEdge.Keys) {
      if (this.EdgeSeparationIsOk(edge, pathsOnCdtEdge[edge], separation)) {
        ok++
      }
    }

    // at least 95% of edges should be okay
    return ok / total > this.bundlingSettings.MinimalRatioOfGoodCdtEdges
  }

  EdgeSeparationIsOk(
    edge: CdtEdge,
    paths: Set<EdgeGeometry>,
    separation: number,
  ): boolean {
    const requiredWidth: number =
      paths.Select((v) => v.LineWidth).Sum() + (paths.Count - 1) * separation
    const availableWidth: number = edge.Capacity
    return requiredWidth <= availableWidth
  }

  RouteSelfEdges() {
    for (const edge of this.geometryGraph.Edges.Where(
      (e) => e.Source == e.Target,
    )) {
      const sp: SmoothedPolyline
      edge.Curve = GeomEdge.RouteSelfEdge(
        edge.Source.BoundaryCurve,
        this.LoosePadding * 2,
        /* out */ sp,
      )
    }
  }

  FixArrowheads() {
    for (const edge of this.geometryGraph.Edges) {
      Arrowheads.TrimSplineAndCalculateArrowheads(
        edge.EdgeGeometry,
        edge.Source.BoundaryCurve,
        edge.Target.BoundaryCurve,
        edge.Curve,
        false,
        this.bundlingSettings.KeepOriginalSpline,
      )
    }
  }
}
