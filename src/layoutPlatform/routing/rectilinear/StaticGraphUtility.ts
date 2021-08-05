import { CompassVector } from "../../math/geometry/compassVector";
import { Direction } from "../../math/geometry/directiton";
import { VisibilityEdge } from "../visibility/VisibilityEdge";
import { VisibilityVertex } from "../visibility/VisibilityVertex";

export class StaticGraphUtility {
    
    
        //  Determine the direction of an edge.
          static EdgeDirectionVE(edge: VisibilityEdge): Direction {
            return StaticGraphUtility.EdgeDirectionVV(edge.Source, edge.Target);
        }
        
          static EdgeDirectionVV(source: VisibilityVertex, target: VisibilityVertex): Direction {
            return PointComparer.GetPureDirection(source.Point, target.Point);
        }
        
          static GetVertex(edge: VisibilityEdge, dir: Direction): VisibilityVertex {
            let edgeDir: Direction = StaticGraphUtility.EdgeDirection(edge);
            Debug.Assert((0 
                            != (dir 
                            & (edgeDir | CompassVector.OppositeDir(edgeDir)))), "dir is orthogonal to edge");
            return edge.Target;
            // TODO: Warning!!!, inline IF is not supported ?
            (dir == edgeDir);
            edge.Source;
        }
        
          static FindNextVertex(vertex: VisibilityVertex, dir: Direction): VisibilityVertex {
            //  This function finds the next vertex in the desired direction relative to the
            //  current vertex, not necessarily the edge orientation, hence it does not use
            //  EdgeDirection().  This is so the caller can operate on a desired movement
            //  direction without having to track whether we're going forward or backward
            //  through the In/OutEdge chain.
            let cEdges: number = vertex.InEdges.Count;
            //  indexing is faster than foreach for Lists
            for (let ii: number = 0; (ii < cEdges); ii++) {
                let edge = vertex.InEdges[ii];
                if ((PointComparer.GetPureDirection(vertex.Point, edge.SourcePoint) == dir)) {
                    return edge.Source;
                }
                
            }
            
            //  Avoid GetEnumerator overhead.
            let outEdgeNode = null;
            // TODO: Warning!!!, inline IF is not supported ?
            vertex.OutEdges.IsEmpty();
            vertex.OutEdges.TreeMinimum();
            for (
            ; (outEdgeNode != null); outEdgeNode = vertex.OutEdges.Next(outEdgeNode)) {
                let edge = outEdgeNode.Item;
                if ((PointComparer.GetPureDirection(vertex.Point, edge.TargetPoint) == dir)) {
                    return edge.Target;
                }
                
            }
            
            return null;
        }
    }
      static FindNextEdge(vg: VisibilityGraph, vertex: VisibilityVertex, dir: Direction): VisibilityEdge {
        let nextVertex: VisibilityVertex = FindNextVertex(vertex, dir);
        // return (null == nextVertex) ? null : vg.FindEdge(vertex.Point, nextVertex.Point);
    }
    
      static FindBendPointBetween(sourcePoint: Point, targetPoint: Point, finalEdgeDir: Direction): Point {
        let targetDir: Direction = PointComparer.GetDirections(sourcePoint, targetPoint);
        Debug.Assert(!PointComparer.IsPureDirection(targetDir), "pure direction has no bend");
        let firstDir: Direction;
        finalEdgeDir;
        Debug.Assert(PointComparer.IsPureDirection(firstDir), "firstDir is not pure");
        //  Move along the first direction. If the first direction is horizontal then 
        //  targetPoint is at the correct horizontal position, and vice-versa.
        return new Point(sourcePoint.X, targetPoint.Y);
        // TODO: Warning!!!, inline IF is not supported ?
        StaticGraphUtility.IsVertical(firstDir);
        new Point(targetPoint.X, sourcePoint.Y);
    }
    
      static SegmentIntersection(first: Point, second: Point, from: Point): Point {
        let dir: Direction = PointComparer.GetPureDirection(first, second);
        let intersect: Point = new Point(first.X, from.Y);
        // TODO: Warning!!!, inline IF is not supported ?
        StaticGraphUtility.IsVertical(dir);
        new Point(from.X, first.Y);
        return intersect;
    }
    
      static SegmentIntersection(seg: SegmentBase, from: Point): Point {
        return StaticGraphUtility.SegmentIntersection(seg.Start, seg.End, from);
    }
    
      static SegmentsIntersect(first: SegmentBase, second: SegmentBase): boolean {
        let intersect: Point;
        return StaticGraphUtility.SegmentsIntersect(first, second, /* out */intersect);
    }
    
      static SegmentsIntersect(first: SegmentBase, second: SegmentBase, /* out */intersect: Point): boolean {
        return StaticGraphUtility.IntervalsIntersect(first.Start, first.End, second.Start, second.End, /* out */intersect);
    }
    
      static SegmentsIntersect(first: LineSegment, second: LineSegment, /* out */intersect: Point): boolean {
        return StaticGraphUtility.IntervalsIntersect(first.Start, first.End, second.Start, second.End, /* out */intersect);
    }
    
      static SegmentIntersection(first: SegmentBase, second: SegmentBase): Point {
        //  Caller expects segments to intersect.
        let intersect: Point;
        if (!StaticGraphUtility.SegmentsIntersect(first, second, /* out */intersect)) {
            Debug.Assert(false, "intersect is not on both segments");
        }
        
        return intersect;
    }
    
      static IntervalsOverlap(first: SegmentBase, second: SegmentBase): boolean {
        return StaticGraphUtility.IntervalsOverlap(first.Start, first.End, second.Start, second.End);
    }
    
      static IntervalsOverlap(start1: Point, end1: Point, start2: Point, end2: Point): boolean {
        return (StaticGraphUtility.IntervalsAreCollinear(start1, end1, start2, end2) 
                    && (PointComparer.Compare(start1, end2) != PointComparer.Compare(end1, start2)));
    }
    
      static IntervalsAreCollinear(start1: Point, end1: Point, start2: Point, end2: Point): boolean {
        Debug.Assert((StaticGraphUtility.IsVertical(start1, end1) == StaticGraphUtility.IsVertical(start2, end2)), "segments are not in the same orientation");
        let vertical: boolean = StaticGraphUtility.IsVertical(start1, end1);
        if ((StaticGraphUtility.IsVertical(start2, end2) == vertical)) {
            //  This handles touching endpoints as well.
            return PointComparer.Equal(start1.X, start2.X);
            // TODO: Warning!!!, inline IF is not supported ?
            vertical;
            PointComparer.Equal(start1.Y, start2.Y);
        }
        
        return false;
    }
    
      static IntervalsAreSame(start1: Point, end1: Point, start2: Point, end2: Point): boolean {
        return (PointComparer.Equal(start1, start2) && PointComparer.Equal(end1, end2));
    }
    
      static IntervalsIntersect(firstStart: Point, firstEnd: Point, secondStart: Point, secondEnd: Point, /* out */intersect: Point): boolean {
        Debug.Assert((StaticGraphUtility.IsVertical(firstStart, firstEnd) != StaticGraphUtility.IsVertical(secondStart, secondEnd)), "cannot intersect two parallel segments");
        intersect = StaticGraphUtility.SegmentIntersection(firstStart, firstEnd, secondStart);
        return (StaticGraphUtility.PointIsOnSegment(firstStart, firstEnd, intersect) && StaticGraphUtility.PointIsOnSegment(secondStart, secondEnd, intersect));
    }
    
      static SegmentIntersection(edge: VisibilityEdge, from: Point): Point {
        return StaticGraphUtility.SegmentIntersection(edge.SourcePoint, edge.TargetPoint, from);
    }
    
      static PointIsOnSegment(first: Point, second: Point, test: Point): boolean {
        return (PointComparer.Equal(first, test) 
                    || (PointComparer.Equal(second, test) 
                    || (PointComparer.GetPureDirection(first, test) == PointComparer.GetPureDirection(test, second))));
    }
    
      static PointIsOnSegment(seg: SegmentBase, test: Point): boolean {
        return StaticGraphUtility.PointIsOnSegment(seg.Start, seg.End, test);
    }
    
      static IsVertical(dir: Direction): boolean {
        return (0 
                    != (dir 
                    & (Direction.North | Direction.South)));
    }
    
      static IsVertical(edge: VisibilityEdge): boolean {
        return StaticGraphUtility.IsVertical(PointComparer.GetPureDirection(edge.SourcePoint, edge.TargetPoint));
    }
    
      static IsVertical(first: Point, second: Point): boolean {
        return StaticGraphUtility.IsVertical(PointComparer.GetPureDirection(first, second));
    }
    
      static IsVertical(seg: LineSegment): boolean {
        return StaticGraphUtility.IsVertical(PointComparer.GetPureDirection(seg.Start, seg.End));
    }
    
      static IsAscending(dir: Direction): boolean {
        return (0 
                    != (dir 
                    & (Direction.North | Direction.East)));
    }
    
      static Slope(start: Point, end: Point, scanDir: ScanDirection): number {
        //  Find the slope relative to scanline - how much scan coord changes per sweep change.
        let lineDirAsPoint: Point = (end - start);
        return ((lineDirAsPoint * scanDir.PerpDirectionAsPoint) 
                    / (lineDirAsPoint * scanDir.DirectionAsPoint));
    }
    
      static SortAscending(a: Point, b: Point): Tuple<Point, Point> {
        let dir: Direction = PointComparer.GetDirections(a, b);
        Debug.Assert(((Direction.None == dir) 
                        || PointComparer.IsPureDirection(dir)), "SortAscending with impure direction");
        return new Tuple<Point, Point>(a, b);
        // TODO: Warning!!!, inline IF is not supported ?
        ((Direction.None == dir) 
                    || StaticGraphUtility.IsAscending(dir));
        new Tuple<Point, Point>(b, a);
    }
    
      static RectangleBorderIntersect(boundingBox: Rectangle, point: Point, dir: Direction): Point {
        switch (dir) {
            case Direction.North:
            case Direction.South:
                return new Point(point.X, StaticGraphUtility.GetRectangleBound(boundingBox, dir));
                break;
            case Direction.East:
            case Direction.West:
                return new Point(StaticGraphUtility.GetRectangleBound(boundingBox, dir), point.Y);
                break;
            default:
                throw new InvalidOperationException();
                break;
        }
        
    }
    
      static GetRectangleBound(rect: Rectangle, dir: Direction): number {
        switch (dir) {
            case Direction.North:
                return rect.Top;
                break;
            case Direction.South:
                return rect.Bottom;
                break;
            case Direction.East:
                return rect.Right;
                break;
            case Direction.West:
                return rect.Left;
                break;
            default:
                throw new InvalidOperationException();
                break;
        }
        
    }
    
      static RectangleInteriorsIntersect(a: Rectangle, b: Rectangle): boolean {
        return ((PointComparer.Compare(a.Bottom, b.Top) < 0) 
                    && ((PointComparer.Compare(b.Bottom, a.Top) < 0) 
                    && ((PointComparer.Compare(a.Left, b.Right) < 0) 
                    && (PointComparer.Compare(b.Left, a.Right) < 0))));
    }
    
      static PointIsInRectangleInterior(point: Point, rect: Rectangle): boolean {
        return ((PointComparer.Compare(point.Y, rect.Top) < 0) 
                    && ((PointComparer.Compare(rect.Bottom, point.Y) < 0) 
                    && ((PointComparer.Compare(point.X, rect.Right) < 0) 
                    && (PointComparer.Compare(rect.Left, point.X) < 0))));
    }
    
    @Conditional("TEST_MSAGL")
      static Assert(condition: boolean, message: string, obstacleTree: ObstacleTree, vg: VisibilityGraph) {
        if (!condition) {
            StaticGraphUtility.Test_DumpVisibilityGraph(obstacleTree, vg);
            Debug.Assert(condition, message);
        }
        
    }
    
    @Conditional("TEST_MSAGL")
      static Test_DumpVisibilityGraph(obstacleTree: ObstacleTree, vg: VisibilityGraph) {
        
    }
    
      static Test_GetObstacleDebugCurves(obstacleTree: ObstacleTree): List<DebugCurve> {
        return StaticGraphUtility.Test_GetObstacleDebugCurves(obstacleTree, false, false);
    }
    
      static Test_GetObstacleDebugCurves(obstacleTree: ObstacleTree, noPadPoly: boolean, noVisPoly: boolean): List<DebugCurve> {
        return StaticGraphUtility.Test_GetObstacleDebugCurves(obstacleTree.GetAllObstacles(), noPadPoly, noVisPoly);
    }
    
      static Test_GetObstacleDebugCurves(obstacles: IEnumerable<Obstacle>, noPadPoly: boolean, noVisPoly: boolean): List<DebugCurve> {
        let debugCurves = new List<DebugCurve>();
        for (let obstacle in obstacles) {
            debugCurves.Add(new DebugCurve(0.1, "darkgray", obstacle.InputShape.BoundaryCurve));
            if ((!noPadPoly 
                        || obstacle.IsGroup)) {
                debugCurves.Add(new DebugCurve(0.3, "gold", obstacle.PaddedPolyline));
                // TODO: Warning!!!, inline IF is not supported ?
                obstacle.IsTransparentAncestor;
                // TODO: Warning!!!, inline IF is not supported ?
                obstacle.IsGroup;
                "black";
                new DebugCurve(0.1, "purple", obstacle.PaddedPolyline);
            }
            
            if ((!noVisPoly 
                        && (obstacle.IsPrimaryObstacle 
                        && (obstacle.VisibilityPolyline != obstacle.PaddedPolyline)))) {
                debugCurves.Add(new DebugCurve(0.1, "mediumpurple", obstacle.VisibilityPolyline));
                // TODO: Warning!!!, inline IF is not supported ?
                obstacle.IsGroup;
                "lightgray";
            }
            
        }
        
        return debugCurves;
    }
    
      static Test_GetVisibilityGraphDebugCurves(vg: VisibilityGraph): List<DebugCurve> {
        return vg.Edges.Select(() => {  }, new DebugCurve(0.1, "Blue", new LineSegment(edge.Source.Point, edge.Target.Point))).ToList();
        // TODO: Warning!!!, inline IF is not supported ?
        (edge.Weight == ScanSegment.NormalWeight);
        // TODO: Warning!!!, inline IF is not supported ?
        (edge.Weight == ScanSegment.ReflectionWeight);
        "LightBlue";
        "DarkCyan";
    }
    
      static Test_GetPreNudgedPathDebugCurves(edgePaths: IEnumerable<Path>): List<DebugCurve> {
        let debugCurves = new List<DebugCurve>();
        for (let path in edgePaths) {
            let points = path.PathPoints.ToArray();
            for (let ii: number = 0; (ii 
                        < (points.Length - 1)); ii++) {
                debugCurves.Add(new DebugCurve(0.1, "purple", new LineSegment(points[ii], points[(ii + 1)])));
            }
            
        }
        
        return debugCurves;
    }
    
      static Test_GetPostNudgedPathDebugCurves(edgePaths: IEnumerable<Path>): List<DebugCurve> {
        let debugCurves = new List<DebugCurve>();
        for (let path in edgePaths) {
            debugCurves.AddRange(path.PathEdges.Select(() => {  }, new DebugCurve(0.1, "purple", new LineSegment(e.Source, e.Target))));
        }
        
        return debugCurves;
    }
    
      static Test_GetScanSegmentCurves(segTree: ScanSegmentTree): List<DebugCurve> {
        return segTree.Segments.Select(() => {  }, new DebugCurve(0.2, "Aqua", new LineSegment(seg.Start, seg.End))).ToList();
        // TODO: Warning!!!, inline IF is not supported ?
        seg.IsOverlapped;
        // TODO: Warning!!!, inline IF is not supported ?
        seg.IsReflection;
        "DarkGreen";
        "LightGreen";
    }
    
      static GetDumpFileName(prefix: string): string {
        return (System.IO.Path.GetTempPath() 
                    + (prefix + ".DebugCurves"));
    }
}
}