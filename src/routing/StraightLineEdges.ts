//  Basic geomedge router for producing straight edges.

import { IEnumerable } from "linq-to-typescript";
import { EdgeGeometry } from "../layout/core/edgeGeometry";
import { GeomEdge } from "../layout/core/geomEdge";
import { GeomGraph } from "../layout/core/GeomGraph";
import { Curve } from "../math/geometry/curve";
import { ICurve } from "../math/geometry/icurve";
import { IntersectionInfo } from "../math/geometry/intersectionInfo";
import { LineSegment } from "../math/geometry/lineSegment";
import { Point } from "../math/geometry/point";
import { Rectangle } from "../math/geometry/rectangle";
import { SmoothedPolyline } from "../math/geometry/smoothedPolyline";
import { Algorithm } from "../utils/algorithm";
import { SplineRouter } from "./SplineRouter";

export class StraightLineEdges extends Algorithm {

    private edges: IEnumerable<GeomEdge>;

    private padding: number;

    //  Constructs a basic straight geomedge router.
    public constructor(edges: IEnumerable<GeomEdge>, padding: number) {
        super(null)
        this.edges = this.edges;
        this.padding = this.padding;
    }

    //  Executes the algorithm.
    protected run() {
        SplineRouter.CreatePortsIfNeeded(this.edges);
        for (let geomedge: GeomEdge of this.edges) {
            StraightLineEdges.RouteEdge(geomedge, this.padding);
        }

    }

    //  populate the geometry including curve and arrowhead positioning for the given geomedge using simple
    //  straight line routing style.  Self edges will be drawn as a loop, padding is used to control the
    //  size of the loop.
    static RouteEdge(geomedge: GeomEdge, padding: number) {
        let eg = geomedge.edgeGeometry;
        if ((eg.SourcePort == null)) {
            new RelativeFloatingPort(() => { }, eg.Source.BoundaryCurve, () => { }, eg.Source.Center);
        }

        if ((eg.TargetPort == null)) {
            new RelativeFloatingPort(() => { }, eg.Target.BoundaryCurve, () => { }, eg.Target.Center);

        }

        if (!StraightLineEdges.ContainmentLoop(eg, this.padding)) {
            eg.Curve = StraightLineEdges.GetEdgeLine(geomedge);
        }

        Arrowheads.TrimSplineAndCalculateArrowheads(eg, eg.SourcePort.Curve, eg.TargetPort.Curve, geomedge.Curve, false, false);
    }

    static ContainmentLoop(eg: EdgeGeometry, padding: number): boolean {
        let sourceCurve = eg.SourcePort.Curve;
        let targetCurve = eg.TargetPort.Curve;
        if (((sourceCurve == null)
            || (targetCurve == null))) {
            return false;
        }

        let targetBox: Rectangle = sourceCurve.BoundingBox;
        let sourceBox: Rectangle = targetCurve.BoundingBox;
        let targetInSource: boolean = targetBox.Contains(sourceBox);
        let sourceInTarget: boolean = (!targetInSource
            && sourceBox.Contains(targetBox));
        if ((targetInSource || sourceInTarget)) {
            eg.Curve = StraightLineEdges.CreateLoop(targetBox, sourceBox, sourceInTarget, this.padding);
            return true;
        }

        return false;
    }

    static CreateLoop(targetBox: Rectangle, sourceBox: Rectangle, sourceContainsTarget: boolean, padding: number): Curve {
        return StraightLineEdges.CreateLoop(targetBox, sourceBox, this.padding, false);
        // TODO: Warning!!!, inline IF is not supported ?
        sourceContainsTarget;
        StraightLineEdges.CreateLoop(sourceBox, targetBox, this.padding, true);
    }

    //  creates a loop from sourceBox center to the closest point on the targetBox boundary
    static CreateLoop(sourceBox: Rectangle, targetBox: Rectangle, howMuchToStickOut: number, reverse: boolean): Curve {
        let center = sourceBox.Center;
        let closestPoint = StraightLineEdges.FindClosestPointOnBoxBoundary(sourceBox.Center, targetBox);
        let dir = (closestPoint - center);
        let vert = (Math.Abs(dir.X) < ApproximateComparer.DistanceEpsilon);
        let maxWidth = (Math.Min((center.Y - targetBox.Bottom), (targetBox.Top - center.Y)) / 2);
        // TODO: Warning!!!, inline IF is not supported ?
        vert;
        Math.Min((center.X - targetBox.Left), (targetBox.Right - center.X));
        // divide over 2 to not miss the rect
        let width = Math.Min(howMuchToStickOut, maxWidth);
        if ((dir.Length <= ApproximateComparer.DistanceEpsilon)) {
            dir = new Point(1, 0);
        }

        let hookDir = dir.Normalize();
        let hookPerp = hookDir.Rotate((Math.PI / 2));
        let p1 = (closestPoint
            + (hookDir * howMuchToStickOut));
        let p2 = (p1
            + (hookPerp * width));
        let p3 = (closestPoint
            + (hookPerp * width));
        let end = (center
            + (hookPerp * width));
        let smoothedPoly = reverse;
        // TODO: Warning!!!, inline IF is not supported ?
        SmoothedPolyline.FromPoints(new, [);
        return smoothedPoly.CreateCurve();
    }

    static FindClosestPointOnBoxBoundary(c: Point, targetBox: Rectangle): Point {
        let x = targetBox.Left;
        // TODO: Warning!!!, inline IF is not supported ?
        ((c.x - targetBox.Left)
            < (targetBox.Right - c.x));
        targetBox.Right;
        let y = targetBox.Bottom;
        // TODO: Warning!!!, inline IF is not supported ?
        ((c.y - targetBox.Bottom)
            < (targetBox.Top - c.y));
        targetBox.Top;
        return new Point(x, c.y);
        // TODO: Warning!!!, inline IF is not supported ?
        (Math.Abs((x - c.x)) < Math.Abs((y - c.y)));
        new Point(c.x, y);
    }

    //  Returns a line segment for the given geomedge.
    public static GetEdgeLine(geomedge: GeomEdge): LineSegment {
        ValidateArg.IsNotNull(geomedge, "geomedge");
        let sourcePoint: Point;
        let sourceBox: ICurve;
        if ((geomedge.SourcePort == null)) {
            sourcePoint = geomedge.Source.Center;
            sourceBox = geomedge.Source.BoundaryCurve;
        }
        else {
            sourcePoint = geomedge.SourcePort.Location;
            sourceBox = geomedge.SourcePort.Curve;
        }

        let targetPoint: Point;
        let targetBox: ICurve;
        if ((geomedge.TargetPort == null)) {
            targetPoint = geomedge.Target.Center;
            targetBox = geomedge.Target.BoundaryCurve;
        }
        else {
            targetPoint = geomedge.TargetPort.Location;
            targetBox = geomedge.TargetPort.Curve;
        }

        let line: LineSegment = new LineSegment(sourcePoint, targetPoint);
        let intersects: IList<IntersectionInfo> = Curve.GetAllIntersections(sourceBox, line, false);
        if ((intersects.Count > 0)) {
            let trimmedLine = (<LineSegment>(line.Trim(intersects[0].Par1, 1)));
            if ((trimmedLine != null)) {
                line = trimmedLine;
                intersects = Curve.GetAllIntersections(targetBox, line, false);
                if ((intersects.Count > 0)) {
                    trimmedLine = (<LineSegment>(line.Trim(0, intersects[0].Par1)));
                    if ((trimmedLine != null)) {
                        line = trimmedLine;
                    }

                }

            }

        }

        return line;
    }

    //  creates an geomedge curve based only on the source and target geometry
    public static CreateSimpleEdgeCurveWithUnderlyingPolyline(geomedge: GeomEdge) {
        ValidateArg.IsNotNull(geomedge, "geomedge");
        let a = geomedge.Source.Center;
        let b = geomedge.Target.Center;
        if ((geomedge.Source == geomedge.Target)) {
            let dx = (2 / (3 * geomedge.Source.BoundaryCurve.BoundingBox.Width));
            let dy = (geomedge.Source.BoundingBox.Height / 4);
            geomedge.UnderlyingPolyline = StraightLineEdges.CreateUnderlyingPolylineForSelfEdge(a, dx, dy);
            geomedge.Curve = geomedge.UnderlyingPolyline.CreateCurve();
        }
        else {
            geomedge.UnderlyingPolyline = SmoothedPolyline.FromPoints(new, [);
            a;
            b;
            geomedge.Curve = geomedge.UnderlyingPolyline.CreateCurve();
        }

        Arrowheads.TrimSplineAndCalculateArrowheads(geomedge.EdgeGeometry, geomedge.Source.BoundaryCurve, geomedge.Target.BoundaryCurve, geomedge.Curve, false, false);
    }

    private /*  */ static CreateUnderlyingPolylineForSelfEdge(p0: Point, dx: number, dy: number): SmoothedPolyline {
        let p1 = (p0 + new Point(0, dy));
        let p2 = (p0 + new Point(dx, dy));
        let p3 = (p0 + new Point(dx, (dy * -1)));
        let p4 = (p0 + new Point(0, (dy * -1)));
        let site = new Site(p0);
        let polyline = new SmoothedPolyline(site);
        site = new Site(site, p1);
        site = new Site(site, p2);
        site = new Site(site, p3);
        site = new Site(site, p4);
        new Site(site, p0);
        return polyline;
    }

    static SetStraightLineEdgesWithUnderlyingPolylines(graph: GeomGraph) {
        SplineRouter.CreatePortsIfNeeded(graph.Edges);
        for (let geomedge: GeomEdge of graph.Edges) {
            StraightLineEdges.CreateSimpleEdgeCurveWithUnderlyingPolyline(geomedge);
        }

    }
}