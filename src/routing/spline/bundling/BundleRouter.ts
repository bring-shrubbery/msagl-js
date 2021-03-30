//  The class is responsible for general edge bundling with ordered bundles.

import { IEnumerable } from "linq-to-typescript";
import { Dictionary } from "lodash";
import { RectangleNode } from "../../../core/geometry/RTree/RectangleNode";
import { Port } from "../../../core/layout/Port";
import { BundlingSettings } from "../../../core/routing/BundlingSettings";
import { EdgeGeometry } from "../../../layout/core/edgeGeometry";
import { GeomEdge } from "../../../layout/core/geomEdge";
import { GeomGraph } from "../../../layout/core/GeomGraph";
import { Curve } from "../../../math/geometry/curve";
import { IntersectionInfo } from "../../../math/geometry/intersectionInfo";
import { LineSegment } from "../../../math/geometry/lineSegment";
import { Point } from "../../../math/geometry/point";
import { Polyline } from "../../../math/geometry/polyline";
import { Rectangle } from "../../../math/geometry/rectangle";
import { SmoothedPolyline } from "../../../math/geometry/smoothedPolyline";
import { Algorithm } from "../../../utils/algorithm";
import { ClusterBoundaryPort } from "../../ClusterBoundaryPort";
import { VisibilityGraph } from "../../visibility/VisibilityGraph";

//  Currently the router will fail if there are node overlaps.
export class BundleRouter extends Algorithm {

    bundlingSettings: BundlingSettings;

    geometryGraph: GeomGraph;

    regularEdges: GeomEdge[];

    LoosePadding: number

    // for the shortest path calculation we will use not loosePadding, but loosePadding*SuperLoosePaddingCoefficient
     /* const */ static SuperLoosePaddingCoefficient: number = 1.1;

    shortestPathRouter: SdShortestPath;

    TightHierarchy: RectangleNode<Polyline>

    LooseHierarchy: RectangleNode<Polyline>

    //  reports the status of the bundling
    Status: BundlingStatus

    get VisibilityGraph(): VisibilityGraph {
    }
    set VisibilityGraph(value: VisibilityGraph) {
    }

    loosePolylineOfPort: Func<Port, Polyline>;

    //  #if TEST_MSAGL && TEST_MSAGL
    //          void CheckGraph() {
    //              foreach (var e in geometryGraph.Edges) {
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
    constructor(geometryGraph: GeometryGraph, shortestPathRouter: SdShortestPath, visibilityGraph: VisibilityGraph, bundlingSettings: BundlingSettings, loosePadding: number, tightHierarchy: RectangleNode<Polyline>, looseHierarchy: RectangleNode<Polyline>, edgeLooseEnterable: Dictionary<EdgeGeometry, Set<Polyline>>, edgeTightEnterable: Dictionary<EdgeGeometry, Set<Polyline>>, loosePolylineOfPort: Func<Port, Polyline>) {
        ValidateArg.IsNotNull(this.geometryGraph, "geometryGraph");
        ValidateArg.IsNotNull(this.bundlingSettings, "bundlingSettings");
        this.geometryGraph = this.geometryGraph;
        this.bundlingSettings = this.bundlingSettings;
        this.regularEdges = this.geometryGraph.Edges.Where(() => { }, (e.Source != e.Target)).ToArray();
        this.VisibilityGraph = visibilityGraph;
        this.shortestPathRouter = this.shortestPathRouter;
        this.LoosePadding = loosePadding;
        this.LooseHierarchy = looseHierarchy;
        this.TightHierarchy = tightHierarchy;
        EdgeLooseEnterable = edgeLooseEnterable;
        EdgeTightEnterable = edgeTightEnterable;
        this.loosePolylineOfPort = this.loosePolylineOfPort;
    }

    ThereAreOverlaps(hierarchy: RectangleNode<Polyline>): boolean {
        return RectangleNodeUtils.FindIntersectionWithProperty(hierarchy, hierarchy, Curve.CurvesIntersect);
    }

    //  edge routing with Ordered Bundles:
    //  1. route edges with bundling
    //  2. nudge bundles and hubs
    //  3. order paths
    protected /* override */ RunInternal() {
        // TimeMeasurer.DebugOutput("edge bundling started");
        if (this.ThereAreOverlaps(this.TightHierarchy)) {
            this.Status = BundlingStatus.Overlaps;
            TimeMeasurer.DebugOutput("overlaps in edge bundling");
            return;
        }

        this.FixLocationsForHookAnywherePorts(this.geometryGraph.Edges);
        if (!this.RoutePathsWithSteinerDijkstra()) {
            this.Status = BundlingStatus.EdgeSeparationIsTooLarge;
            return;
        }

        this.FixChildParentEdges();
        if (!this.bundlingSettings.StopAfterShortestPaths) {
            let metroGraphData = new MetroGraphData(this.regularEdges.Select(() => { }, e.EdgeGeometry).ToArray(), this.LooseHierarchy, this.TightHierarchy, this.bundlingSettings, this.shortestPathRouter.Cdt, EdgeLooseEnterable, EdgeTightEnterable, this.loosePolylineOfPort);
            NodePositionsAdjuster.FixRouting(metroGraphData, this.bundlingSettings);
            (new EdgeNudger(metroGraphData, this.bundlingSettings) + Run());
            // TimeMeasurer.DebugOutput("edge bundling ended");
        }

        this.RouteSelfEdges();
        this.FixArrowheads();
    }

    //  <summary>
    //  set endpoint of the edge from child to parent (cluster) to the boundary of the parent
    //  TODO: is there a better solution?
    //  </summary>
    FixChildParentEdges() {
        for (let edge in this.regularEdges) {
            let sPort = edge.SourcePort;
            let ePort = edge.TargetPort;
            if (sPort.Curve.BoundingBox.Contains(ePort.Curve.BoundingBox)) {
                let ii: IntersectionInfo = Curve.CurveCurveIntersectionOne(sPort.Curve, new LineSegment(edge.Curve.Start, edge.Curve.End), true);
                (<Polyline>(edge.Curve)).StartPoint.Point = ii.IntersectionPoint;
            }

            if (ePort.Curve.BoundingBox.Contains(sPort.Curve.BoundingBox)) {
                let ii: IntersectionInfo = Curve.CurveCurveIntersectionOne(ePort.Curve, new LineSegment(edge.Curve.Start, edge.Curve.End), true);
                (<Polyline>(edge.Curve)).EndPoint.Point = ii.IntersectionPoint;
            }

        }

    }

    static CreateConstrainedDelaunayTriangulation(looseHierarchy: RectangleNode<Polyline>): Cdt {
        let obstacles: IEnumerable<Polyline> = looseHierarchy.GetAllLeaves();
        let rectangle: Rectangle = looseHierarchy.Rectangle;
        let d: number = (rectangle.Diagonal / 4);
        let lb: Point = (rectangle.LeftBottom + new Point((d * -1), (d * -1)));
        let lt: Point = (rectangle.LeftTop + new Point((d * -1), d));
        let rt: Point = (rectangle.RightTop + new Point(d, d));
        let rb: Point = (rectangle.RightBottom + new Point(d, (d * -1)));
        let additionalObstacles;
        new Polyline(lb, lt, rt, rb);

        return BundleRouter.GetConstrainedDelaunayTriangulation(obstacles.Concat(additionalObstacles));
    }

    static GetConstrainedDelaunayTriangulation(obstacles: IEnumerable<Polyline>): Cdt {
        let constrainedDelaunayTriangulation = new Cdt(null, obstacles, null);
        constrainedDelaunayTriangulation.Run();
        return constrainedDelaunayTriangulation;
    }

    //  #if TEST_MSAGL && TEST_MSAGL
    //          [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
    //          // ReSharper disable UnusedMember.Local
    //          void ShowGraphLocal() {
    //              // ReSharper restore UnusedMember.Local
    //              var l = new List<ICurve>();
    //              l.Clear();
    //              foreach (var e in geometryGraph.Edges) {
    //                  {
    //                      l.Add(new Ellipse(2, 2, e.Curve.Start));
    //                      l.Add(CurveFactory.CreateDiamond(5, 5, e.Curve.End));
    //                      l.Add(e.Curve);
    //                  }
    //              }
    //              SplineRouter.ShowVisGraph(VisibilityGraph, LooseHierarchy.GetAllLeaves(), null, l);
    //          }
    //  #endif
    FixLocationsForHookAnywherePorts(edges: IEnumerable<GeomEdge>) {
        for (let edge in edges) {
            let hookPort = (<HookUpAnywhereFromInsidePort>(edge.SourcePort));
            if ((hookPort != null)) {
                hookPort.SetLocation(this.FigureOutHookLocation(hookPort.LoosePolyline, edge.TargetPort, edge.EdgeGeometry));
            }
            else {
                hookPort = (<HookUpAnywhereFromInsidePort>(edge.TargetPort));
                if ((hookPort != null)) {
                    hookPort.SetLocation(this.FigureOutHookLocation(hookPort.LoosePolyline, edge.SourcePort, edge.EdgeGeometry));
                }

            }

        }

    }

    FigureOutHookLocation(poly: Polyline, otherEdgeEndPort: Port, edgeGeom: EdgeGeometry): Point {
        let clusterPort = (<ClusterBoundaryPort>(otherEdgeEndPort));
        if ((clusterPort == null)) {
            return this.FigureOutHookLocationForSimpleOtherPort(poly, otherEdgeEndPort, edgeGeom);
        }

        return this.FigureOutHookLocationForClusterOtherPort(poly, clusterPort, edgeGeom);
    }

    FigureOutHookLocationForClusterOtherPort(poly: Polyline, otherEdgeEndPort: ClusterBoundaryPort, edgeGeom: EdgeGeometry): Point {
        let shapes = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(edgeGeom);
        // SplineRouter.ShowVisGraph(this.VisibilityGraph, this.LooseHierarchy.GetAllLeaves(),
        //     shapes.Select(sh => sh.BoundaryCurve), new[] { new LineSegment(edgeGeom.SourcePort.Location, edgeGeom.TargetPort.Location) });
        let s = new MultipleSourceMultipleTargetsShortestPathOnVisibilityGraph(otherEdgeEndPort.LoosePolyline.Select(() => { }, this.VisibilityGraph.FindVertex(p)), poly.Select(() => { }, this.VisibilityGraph.FindVertex(p)), this.VisibilityGraph);
        let path = s.GetPath();
        for (let sh in shapes) {
            sh.IsTransparent = false;
        }

        return path.Last().Point;
    }

    private FigureOutHookLocationForSimpleOtherPort(poly: Polyline, otherEdgeEndPort: Port, edgeGeom: EdgeGeometry): Point {
        let otherEdgeEnd: Point = otherEdgeEndPort.Location;
        let shapes = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(edgeGeom);
        // SplineRouter.ShowVisGraph(this.VisibilityGraph, this.LooseHierarchy.GetAllLeaves(),
        //     shapes.Select(sh => sh.BoundaryCurve), new[] { new LineSegment(edgeGeom.SourcePort.Location, edgeGeom.TargetPort.Location) });
        let s = new SingleSourceMultipleTargetsShortestPathOnVisibilityGraph(this.VisibilityGraph.FindVertex(otherEdgeEnd), poly.PolylinePoints.Select(() => { }, this.VisibilityGraph.FindVertex(p.Point)), this.VisibilityGraph);
        let path = s.GetPath();
        for (let sh in shapes) {
            sh.IsTransparent = false;
        }

        return path.Last().Point;
    }

    get EdgeLooseEnterable(): Dictionary<EdgeGeometry, Set<Polyline>> {
    }
    set EdgeLooseEnterable(value: Dictionary<EdgeGeometry, Set<Polyline>>) {
    }

    get EdgeTightEnterable(): Dictionary<EdgeGeometry, Set<Polyline>> {
    }
    set EdgeTightEnterable(value: Dictionary<EdgeGeometry, Set<Polyline>>) {
    }

    RoutePathsWithSteinerDijkstra(): boolean {
        this.shortestPathRouter.VisibilityGraph = this.VisibilityGraph;
        this.shortestPathRouter.BundlingSettings = this.bundlingSettings;
        this.shortestPathRouter.EdgeGeometries = this.regularEdges.Select(() => { }, e.EdgeGeometry).ToArray();
        this.shortestPathRouter.ObstacleHierarchy = this.LooseHierarchy;
        this.shortestPathRouter.RouteEdges();
        // find appropriate edge separation
        if ((this.shortestPathRouter.Cdt != null)) {
            if (!this.AnalyzeEdgeSeparation()) {
                return false;
            }

        }

        return true;
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
        let crossedCdtEdges: Dictionary<EdgeGeometry, Set<CdtEdge>> = new Dictionary<EdgeGeometry, Set<CdtEdge>>();
        this.shortestPathRouter.FillCrossedCdtEdges(crossedCdtEdges);
        let pathsOnCdtEdge: Dictionary<CdtEdge, Set<EdgeGeometry>> = this.GetPathsOnCdtEdge(crossedCdtEdges);
        let es: number = this.CalculateMaxAllowedEdgeSeparation(pathsOnCdtEdge);
        //  TimeMeasurer.DebugOutput("opt es: " + es);
        if ((es >= this.bundlingSettings.EdgeSeparation)) {
            return true;
        }

        // we can even enlarge it here
        if ((es <= 0.02)) {
            TimeMeasurer.DebugOutput("edge bundling can't be executed: not enough free space around obstacles");
            for (let e in this.regularEdges) {
                e.Curve = null;
            }

            return false;
        }

        //  reducing edge separation
        //  TimeMeasurer.DebugOutput("reducing edge separation to " + es);
        this.bundlingSettings.EdgeSeparation = es;
        this.shortestPathRouter.RouteEdges();
        return true;
    }

    GetPathsOnCdtEdge(crossedEdges: Dictionary<EdgeGeometry, Set<CdtEdge>>): Dictionary<CdtEdge, Set<EdgeGeometry>> {
        let res: Dictionary<CdtEdge, Set<EdgeGeometry>> = new Dictionary<CdtEdge, Set<EdgeGeometry>>();
        for (let edge in crossedEdges.Keys) {
            for (let cdtEdge in crossedEdges[edge]) {
                CollectionUtilities.AddToMap(res, cdtEdge, edge);
            }

        }

        return res;
    }

    CalculateMaxAllowedEdgeSeparation(pathsOnCdtEdge: Dictionary<CdtEdge, Set<EdgeGeometry>>): number {
        let l: number = 0.01;
        let r: number = 10;
        //  ?TODO: change to bundlingSettings.EdgeSeparation;
        if (this.EdgeSeparationIsOk(pathsOnCdtEdge, r)) {
            return r;
        }

        while ((Math.Abs((r - l)) > 0.01)) {
            let cen: number = ((l + r)
                / 2);
            if (this.EdgeSeparationIsOk(pathsOnCdtEdge, cen)) {
                l = cen;
            }
            else {
                r = cen;
            }

        }

        return l;
    }

    EdgeSeparationIsOk(pathsOnCdtEdge: Dictionary<CdtEdge, Set<EdgeGeometry>>, separation: number): boolean {
        // total number of cdt edges
        let total: number = pathsOnCdtEdge.Count;
        if ((total == 0)) {
            return true;
        }

        // number of edges with requiredWidth <= availableWidth
        let ok: number = 0;
        for (let edge in pathsOnCdtEdge.Keys) {
            if (this.EdgeSeparationIsOk(edge, pathsOnCdtEdge[edge], separation)) {
                ok++;
            }

        }

        // at least 95% of edges should be okay
        return ((ok / total)
            > this.bundlingSettings.MinimalRatioOfGoodCdtEdges);
    }

    EdgeSeparationIsOk(edge: CdtEdge, paths: Set<EdgeGeometry>, separation: number): boolean {
        let requiredWidth: number = (paths.Select(() => { }, v.LineWidth).Sum()
            + ((paths.Count - 1)
                * separation));
        let availableWidth: number = edge.Capacity;
        return (requiredWidth <= availableWidth);
    }

    RouteSelfEdges() {
        for (let edge in this.geometryGraph.Edges.Where(() => { }, (e.Source == e.Target))) {
            let sp: SmoothedPolyline;
            edge.Curve = GeomEdge.RouteSelfEdge(edge.Source.BoundaryCurve, (this.LoosePadding * 2), /* out */sp);
        }

    }

    FixArrowheads() {
        for (let edge in this.geometryGraph.Edges) {
            Arrowheads.TrimSplineAndCalculateArrowheads(edge.EdgeGeometry, edge.Source.BoundaryCurve, edge.Target.BoundaryCurve, edge.Curve, false, this.bundlingSettings.KeepOriginalSpline);
        }

    }
}
