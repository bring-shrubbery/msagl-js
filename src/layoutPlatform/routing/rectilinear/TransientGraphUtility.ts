import { Point, Rectangle } from "../../..";
import { CompassVector } from "../../math/geometry/compassVector";
import { Direction } from "../../math/geometry/direction";
import { GeomConstants } from "../../math/geometry/geomConstants";
import { LineSegment } from "../../math/geometry/lineSegment";
import { Assert } from "../../utils/assert";
import { TollFreeVisibilityEdge } from "../visibility/TollFreeVisibilityEdge";
import { VisibilityEdge } from "../visibility/VisibilityEdge";
import { VisibilityGraph } from "../visibility/VisibilityGraph";
import { VisibilityVertex } from "../visibility/VisibilityVertex";
import { GroupBoundaryCrossing } from "./GroupBoundaryCrossing";
import { ObstacleTree } from "./ObstacleTree";
import { PointAndCrossings } from "./PointAndCrossings";
import { PointAndCrossingsList } from "./PointAndCrossingsList";
import { PointComparer } from "./PointComparer";
import { ScanSegment } from "./ScanSegment";
import { SparseVisibilityGraphGenerator } from "./SparseVisibiltyGraphGenerator";
import { StaticGraphUtility } from "./StaticGraphUtility";
import { VisibilityGraphGenerator } from "./VisibilityGraphGenerator";
import { VisibilityVertexRectilinear } from "./VisibilityVertexRectiline";

    
export    class TransientGraphUtility {
        
        //  Vertices added to the graph for routing.
        AddedVertices: Array<VisibilityVertexRectilinear> = new Array<VisibilityVertexRectilinear>();
        
        //  Edges added to the graph for routing.
        AddedEdges: Array<TollFreeVisibilityEdge> = new Array<TollFreeVisibilityEdge>();
        
        //  Edges joining two non-transient vertices; these must be replaced.
        edgesToRestore: Array<VisibilityEdge> = new Array<VisibilityEdge>();
        
         LimitPortVisibilitySpliceToEndpointBoundingBox: boolean 
        
        //  Owned by creator of this class.
        GraphGenerator: VisibilityGraphGenerator
        
        get ObstacleTree(): ObstacleTree {
            return this.GraphGenerator.ObstacleTree;
        }
        
        get VisGraph(): VisibilityGraph {
            return this.GraphGenerator.VisibilityGraph;
        }
        
        private get IsSparseVg(): boolean {
            return (this.GraphGenerator instanceof  SparseVisibilityGraphGenerator);
        }
        
        constructor (graphGen: VisibilityGraphGenerator) {
            this.GraphGenerator = graphGen;
        }
        
        AddVertex(location: Point): VisibilityVertex {
            let vertex = this.VisGraph.AddVertexP(location);
            this.AddedVertices.push((<VisibilityVertexRectilinear>(vertex)));
            return vertex;
        }
        
        FindOrAddVertex(location: Point): VisibilityVertex {
            let vertex = this.VisGraph.FindVertex(location);
            return;
            this.AddVertex(location);
        }
        
        FindOrAddEdgeVV(sourceVertex: VisibilityVertex, targetVertex: VisibilityVertex): VisibilityEdge {
            return this.FindOrAddEdge(sourceVertex, targetVertex, ScanSegment.NormalWeight);
        }
        
        FindOrAddEdge(sourceVertex: VisibilityVertex, targetVertex: VisibilityVertex, weight: number): VisibilityEdge {
            //  Since we're adding transient edges into the graph, we're not doing full intersection
            //  evaluation; thus there may already be an edge from the source vertex in the direction
            //  of the target vertex, but ending before or after the target vertex.
            let dirToTarget: Direction = PointComparer.GetPureDirectionVV(sourceVertex, targetVertex);
            let bracketTarget: VisibilityVertex;
            let bracketSource: VisibilityVertex;
            //  Is there an edge in the chain from sourceVertex in the direction of targetVertex
            //  that brackets targetvertex?
            //       <sourceVertex> -> ..1.. -> ..2.. <end>   3
            //  Yes if targetVertex is at the x above 1 or 2, No if it is at 3.  If false, bracketSource
            //  will be set to the vertex at <end> (if there are any edges in that direction at all).
            let splitVertex: VisibilityVertex = targetVertex;
            const t={bracketSource:bracketSource, bracketTarget:bracketTarget}
            if (!TransientGraphUtility.FindBracketingVertices(sourceVertex, targetVertex.point, dirToTarget, t)) {
                //  No bracketing of targetVertex from sourceVertex but bracketSource has been updated.
                //  Is there a bracket of bracketSource from the targetVertex direction?
                //                       3   <end> ..2.. <- ..1..   <targetVertex>
                //  Yes if bracketSource is at the x above 1 or 2, No if it is at 3.  If false, bracketTarget
                //  will be set to the vertex at <end> (if there are any edges in that direction at all).
                //  If true, then bracketSource and splitVertex must be updated.
                let tempSource: VisibilityVertex;
                const t={bracketSource:bracketTarget, bracketTarget:tempSource}
                if (TransientGraphUtility.FindBracketingVertices(targetVertex, sourceVertex.point, CompassVector.OppositeDir(dirToTarget), t)) {
                    Assert.assert((bracketSource == sourceVertex), "Mismatched bracketing detection");
                    bracketSource = tempSource;
                    splitVertex = sourceVertex;
                }
                
            }
            
            //  If null != edge then targetVertex is between bracketSource and bracketTarget and SplitEdge returns the 
            //  first half-edge (and weight is ignored as the split uses the edge weight).
            let edge = this.VisGraph.FindEdgePP(bracketSource.point, bracketTarget.point);
            edge = this.SplitEdge(edge, splitVertex);
            // TODO: Warning!!!, inline IF is not supported ?
            (edge != null);
            this.CreateEdge(bracketSource, bracketTarget, weight);
            
            return edge;
        }
        
        static FindBracketingVertices(sourceVertex: VisibilityVertex, targetPoint: Point, dirToTarget: Direction, t:{bracketSource: VisibilityVertex, bracketTarget: VisibilityVertex}): boolean {
            //  Walk from the source to target until we bracket target or there is no nextVertex
            //  in the desired direction.
            t.bracketSource = sourceVertex;
            for (
            ; ; 
            ) {
                t.bracketTarget = StaticGraphUtility.FindAdjacentVertex(t.bracketSource, dirToTarget);
                if ((t.bracketTarget == null)) {
                    break;
                }
                
                if (Point.closeDistEps(t.bracketTarget.point, targetPoint)) {
                    //  Desired edge already exists.
                    return true;
                }
                
                if ((dirToTarget != PointComparer.GetDirections(t.bracketTarget.point, targetPoint))) {
                    //  bracketTarget is past vertex in the traversal direction.
                    break;
                }
                
               t. bracketSource = t.bracketTarget;
            }
            
            return t.bracketTarget != null
        }
        
        
        
        
        
        
        //  DEVTRACE
        //  ReSharper restore InconsistentNaming
        private CreateEdge(first: VisibilityVertex, second: VisibilityVertex, weight: number): VisibilityEdge {
            //  All edges in the graph are ascending.
            let source: VisibilityVertex = first;
            let target: VisibilityVertex = second;
            if (!PointComparer.IsPureLower(source.point, target.point)) {
                source = second;
                target = first;
            }
            
            let edge = new TollFreeVisibilityEdge(source, target, weight);
            VisibilityGraph.AddEdge(edge);
            this.AddedEdges.push(edge);
            return edge;
        }
        
        RemoveFromGraph() {
            this.RemoveAddedVertices();
            this.RemoveAddedEdges();
            this.RestoreRemovedEdges();
        }
        
        private RemoveAddedVertices() {
            for (let vertex of this.AddedVertices) {
                //  Removing all transient vertices will remove all associated transient edges as well.
                if ((this.VisGraph.FindVertex(vertex.point) != null)) {
                    this.VisGraph.RemoveVertex(vertex);
                }
                
            }
            
            this.AddedVertices = []
        }
        
        private RemoveAddedEdges() {
            for (let edge of this.AddedEdges) {
                //  If either vertex was removed, so was the edge, so just check source.
                if ((this.VisGraph.FindVertex(edge.SourcePoint) != null)) {
                    VisibilityGraph.RemoveEdge(edge);
                }
                
            }
            
            this.AddedEdges=[];
        }
        
        private RestoreRemovedEdges() {
            for (let edge of this.edgesToRestore) {
                //  We should only put TransientVisibilityEdges in this list, and should never encounter
                //  a non-transient edge in the graph after we've replaced it with a transient one, so 
                //  the edge should not be in the graph until we re-insert it.
                Assert.assert(!(edge instanceof  TollFreeVisibilityEdge), "Unexpected Transient edge");
                VisibilityGraph.AddEdge(edge);
                
            }
            
            this.edgesToRestore= []
        }
        
        FindNextEdge(vertex: VisibilityVertex, dir: Direction): VisibilityEdge {
            return StaticGraphUtility.FindAdjacentEdge(vertex, dir);
        }
        
        FindPerpendicularOrContainingEdge(startVertex: VisibilityVertex, dir: Direction, pointLocation: Point): VisibilityEdge {
            //  Return the edge in 'dir' from startVertex that is perpendicular to pointLocation.
            //  startVertex must therefore be located such that pointLocation is in 'dir' direction from it,
            //  or is on the same line.
            // StaticGraphUtility.Assert((0 
            //                 == (CompassVector.OppositeDir(dir) & PointComparer.GetDirections(startVertex.point, pointLocation))), "the ray from 'dir' is away from pointLocation", this.ObstacleTree, this.VisGraph);
            while (true) {
                let nextVertex: VisibilityVertex = StaticGraphUtility.FindAdjacentVertex(startVertex, dir);
                if ((nextVertex == null)) {
                    break;
                }
                
                let dirCheck: Direction = PointComparer.GetDirections(nextVertex.point, pointLocation);
                //  If the next vertex is past the intersection with pointLocation, this edge brackets it.
                if ((0 
                            != (CompassVector.OppositeDir(dir) & dirCheck))) {
                    return this.VisGraph.FindEdgePP(startVertex.point, nextVertex.point);
                }
                
                startVertex = nextVertex;
            }
            
            return null;
        }
        
        FindNearestPerpendicularOrContainingEdge(startVertex: VisibilityVertex, dir: Direction, pointLocation: Point): VisibilityEdge {
            //  Similar to FindPerpendicularEdge, but first try to move closer to pointLocation,
            //  as long as there are edges going in 'dir' that extend to pointLocation.
            let dirTowardLocation: Direction;
            (dir & PointComparer.GetDirections(startVertex.point, pointLocation));
            //  If Directions. None then pointLocation is collinear.
            let currentVertex: VisibilityVertex = startVertex;
            let currentDirTowardLocation: Direction = dirTowardLocation;
            //  First move toward pointLocation far as we can.
            while ((Direction.None != currentDirTowardLocation)) {
                let nextVertex: VisibilityVertex = StaticGraphUtility.FindAdjacentVertex(currentVertex, dirTowardLocation);
                if ((nextVertex == null)) {
                    break;
                }
                
                if ((0 
                            != (CompassVector.OppositeDir(dirTowardLocation) & PointComparer.GetDirections(nextVertex.point, pointLocation)))) {
                    break;
                }
                
                currentVertex = nextVertex;
                (dir & PointComparer.GetDirections(currentVertex.point, pointLocation));
            }
            
            //  Now find the first vertex that has a chain that intersects pointLocation, if any, moving away
            //  from pointLocation until we find it or arrive back at startVertex.
            let perpEdge: VisibilityEdge;
            while (true) {
                perpEdge = this.FindPerpendicularOrContainingEdge(currentVertex, dir, pointLocation);
                if (((perpEdge != null) 
                            || (currentVertex == startVertex))) {
                    break;
                }
                
                currentVertex = StaticGraphUtility.FindAdjacentVertex(currentVertex, CompassVector.OppositeDir(dirTowardLocation));
            }
            
            return perpEdge;
        }
        
        ConnectVertexToTargetVertex(sourceVertex: VisibilityVertex, targetVertex: VisibilityVertex, finalEdgeDir: Direction, weight: number) {
            //  finalDir is the required direction of the final edge to the targetIntersect
            //  (there will be two edges if we have to add a bend vertex).
            // StaticGraphUtility.Assert(PointComparer.IsPureDirection(finalEdgeDir), "finalEdgeDir is not pure", this.ObstacleTree, this.VisGraph);
            // //  targetIntersect may be CenterVertex if that is on an extreme bend or a flat border.
            if (Point.closeDistEps(sourceVertex.point, targetVertex.point)) {
                return;
            }
            
            //  If the target is collinear with sourceVertex we can just create one edge to it.
            let targetDirs: Direction = PointComparer.GetDirections(sourceVertex.point, targetVertex.point);
            if (PointComparer.IsPureDirectionD(targetDirs)) {
                this.FindOrAddEdgeVV(sourceVertex, targetVertex);
                return;
            }
            
            //  Not collinear so we need to create a bend vertex and edge if they don't yet exist.
            let bendPoint: Point = StaticGraphUtility.FindBendPointBetween(sourceVertex.point, targetVertex.point, finalEdgeDir);
            let bendVertex: VisibilityVertex = this.FindOrAddVertex(bendPoint);
            this.FindOrAddEdge(sourceVertex, bendVertex, weight);
            //  Now create the outer target vertex if it doesn't exist.
            this.FindOrAddEdge(bendVertex, targetVertex, weight);
        }
        
        AddEdgeToTargetEdge(sourceVertex: VisibilityVertex, targetEdge: VisibilityEdge, targetIntersect: Point): VisibilityVertex {
            // StaticGraphUtility.Assert((Point.closeDistEps(sourceVertex.point, targetIntersect) || PointComparer.IsPureDirection(sourceVertex.point, targetIntersect)), "non-orthogonal edge request", this.ObstacleTree, this.VisGraph);
            // StaticGraphUtility.Assert(StaticGraphUtility.PointIsOnSegmentSP(targetEdge.SourcePoint, targetEdge.TargetPoint, targetIntersect), "targetIntersect is not on targetEdge", this.ObstacleTree, this.VisGraph);
            //  If the target vertex does not exist, we must split targetEdge to add it.
            let targetVertex: VisibilityVertex = this.VisGraph.FindVertex(targetIntersect);
            if ((targetVertex == null)) {
                targetVertex = this.AddVertex(targetIntersect);
                this.SplitEdge(targetEdge, targetVertex);
            }
            
            this.FindOrAddEdgeVV(sourceVertex, targetVertex);
            return targetVertex;
        }
        
        SplitEdge(edge: VisibilityEdge, splitVertex: VisibilityVertex): VisibilityEdge {
            //  If the edge is NULL it means we could not find an appropriate one, so do nothing.
            if ((edge == null)) {
                return null;
            }
            
            // StaticGraphUtility.Assert(StaticGraphUtility.PointIsOnSegmentSP(edge.SourcePoint, edge.TargetPoint, splitVertex.point), "splitVertex is not on edge", this.ObstacleTree, this.VisGraph);
            if ((Point.closeDistEps(edge.Source.point, splitVertex.point) || Point.closeDistEps(edge.Target.point, splitVertex.point))) {
                //  No split needed.
                return edge;
            }
            
            //  Store the original edge, if needed.
            if (!(edge instanceof  TollFreeVisibilityEdge)) {
                this.edgesToRestore.push(edge);
            }
            
            VisibilityGraph.RemoveEdge(edge);
            //  If this is an overlapped edge, or we're in sparseVg, then it may be an unpadded->padded edge that crosses
            //  over another obstacle's padded boundary, and then either a collinear splice from a free point or another
            //  obstacle in the same cluster starts splicing from that leapfrogged boundary, so we have the edges:
            //       A   ->   D                      | D is unpadded, A is padded border of sourceObstacle
            //         B -> C  ->  E  ->  F          | B and C are vertical ScanSegments between A and D
            //       <-- splice direction is West    | F is unpadded, E is padded border of targetObstacle
            //  Now after splicing F to E to C to B we go A, calling FindOrAddEdge B->A; the bracketing process finds
            //  A->D which we'll be splitting at B, which would wind up with A->B, B->C, B->D, having to Eastward
            //  outEdges from B.  See RectilinearTests.Reflection_Block1_Big_UseRect for overlapped, and 
            //  RectilinearTests.FreePortLocationRelativeToTransientVisibilityEdgesSparseVg for sparseVg.
            //  To avoid this we add the edges in each direction from splitVertex with FindOrAddEdge.  If we've
            //  come here from a previous call to FindOrAddEdge, then that call has found the bracketing vertices, 
            //  which are the endpoints of 'edge', and we've removed 'edge', so we will not call SplitEdge again.
            if (((this.IsSparseVg 
                        || (edge.Weight == ScanSegment.OverlappedWeight)) 
                        && (splitVertex.Degree > 0))) {
                this.FindOrAddEdge(splitVertex, edge.Source, edge.Weight);
                return this.FindOrAddEdge(splitVertex, edge.Target, edge.Weight);
            }
            
            //  Splice it into the graph in place of targetEdge.  Return the first half, because
            //  this may be called from AddEdge, in which case the split vertex is the target vertex.
            this.CreateEdge(splitVertex, edge.Target, edge.Weight);
            return this.CreateEdge(edge.Source, splitVertex, edge.Weight);
        }
        
        ExtendEdgeChainVRLPB(startVertex: VisibilityVertex, limitRect: Rectangle, maxVisibilitySegment: LineSegment, pacList: PointAndCrossingsList, isOverlapped: boolean) {
            let dir = PointComparer.GetDirections(maxVisibilitySegment.start, maxVisibilitySegment.end);
            if ((dir == Direction.None)) {
                return;
            }
            
            Assert.assert(CompassVector.IsPureDirection(dir), "impure max visibility segment");
            //  Shoot the edge chain out to the shorter of max visibility or intersection with the limitrect.
            // StaticGraphUtility.Assert((Point.closeDistEps(maxVisibilitySegment.start, startVertex.point) 
            //                 || (PointComparer.GetPureDirectionVV(maxVisibilitySegment.start, startVertex.point) == dir)), "Inconsistent direction found", this.ObstacleTree, this.VisGraph);
            let oppositeFarBound: number = StaticGraphUtility.GetRectangleBound(limitRect, dir);
            let maxDesiredSplicePoint: Point = GeomConstants.RoundPoint(new Point(startVertex.point.x, oppositeFarBound));
            // TODO: Warning!!!, inline IF is not supported ?
            StaticGraphUtility.IsVertical(dir);
            ApproximateComparer.Round(new Point(oppositeFarBound, startVertex.point.y));
            if (Point.closeDistEps(maxDesiredSplicePoint, startVertex.point)) {
                //  Nothing to do.
                return;
            }
            
            if ((PointComparer.GetPureDirectionVV(startVertex.point, maxDesiredSplicePoint) != dir)) {
                //  It's in the opposite direction, so no need to do anything.
                return;
            }
            
            //  If maxDesiredSplicePoint is shorter, create a new shorter segment.  We have to pass both segments
            //  through to the worker function so it knows whether it can go past maxDesiredSegment (which may be limited
            //  by limitRect).
            let maxDesiredSegment = maxVisibilitySegment;
            if ((PointComparer.GetDirections(maxDesiredSplicePoint, maxDesiredSegment.end) == dir)) {
                maxDesiredSegment = new LineSegment(maxDesiredSegment.start, maxDesiredSplicePoint);
            }
            
            this.ExtendEdgeChain(startVertex, dir, maxDesiredSegment, maxVisibilitySegment, pacList, isOverlapped);
        }
        
        private ExtendEdgeChain(startVertex: VisibilityVertex, extendDir: Direction, maxDesiredSegment: LineSegment, maxVisibilitySegment: LineSegment, pacList: PointAndCrossingsList, isOverlapped: boolean) {
            StaticGraphUtility.Assert((PointComparer.GetPureDirectionVV(maxDesiredSegment.start, maxDesiredSegment.end) == extendDir), "maxDesiredSegment is reversed", this.ObstacleTree, this.VisGraph);
            //  Direction*s*, because it may return None, which is valid and means startVertex is on the
            //  border of an obstacle and we don't want to go inside it.
            let segmentDir: Direction = PointComparer.GetDirections(startVertex.point, maxDesiredSegment.end);
            if ((segmentDir != extendDir)) {
                //  OppositeDir may happen on overlaps where the boundary has a gap in its ScanSegments due to other obstacles
                //  overlapping it and each other.  This works because the port has an edge connected to startVertex,
                //  which is on a ScanSegment outside the obstacle.
                StaticGraphUtility.Assert((isOverlapped 
                                || (segmentDir != CompassVector.OppositeDir(extendDir))), "obstacle encountered between prevPoint and startVertex", this.ObstacleTree, this.VisGraph);
                return;
            }
            
            //  We'll find the segment to the left (or right if to the left doesn't exist),
            //  then splice across in the opposite direction.
            let spliceSourceDir: Direction = CompassVector.RotateLeft(extendDir);
            let spliceSource: VisibilityVertex = StaticGraphUtility.FindAdjacentVertex(startVertex, spliceSourceDir);
            if ((spliceSource == null)) {
                spliceSourceDir = CompassVector.OppositeDir(spliceSourceDir);
                spliceSource = StaticGraphUtility.FindAdjacentVertex(startVertex, spliceSourceDir);
                if ((spliceSource == null)) {
                    return;
                }
                
            }
            
            //  Store this off before ExtendSpliceWorker, which overwrites it.
            let spliceTargetDir: Direction = CompassVector.OppositeDir(spliceSourceDir);
            let spliceTarget: VisibilityVertex;
            if (this.ExtendSpliceWorker(spliceSource, extendDir, spliceTargetDir, maxDesiredSegment, maxVisibilitySegment, isOverlapped, /* out */spliceTarget)) {
                //  We ended on the source side and may have dead-ends on the target side so reverse sides.
                this.ExtendSpliceWorker(spliceTarget, extendDir, spliceSourceDir, maxDesiredSegment, maxVisibilitySegment, isOverlapped, /* out */spliceTarget);
            }
            
            this.SpliceGroupBoundaryCrossings(pacList, startVertex, maxDesiredSegment);
        }
        
        private SpliceGroupBoundaryCrossings(crossingList: PointAndCrossingsList, startVertex: VisibilityVertex, maxSegment: LineSegment) {
            if (((crossingList == null) || (0 == crossingList.Count))) {
                return;
            }
            
            crossingList.Reset();
            let start = maxSegment.start;
            let end = maxSegment.end;
            let dir = PointComparer.GetPureDirectionVV(start, end);
            //  Make sure we are going in the ascending direction.
            if (!StaticGraphUtility.IsAscending(dir)) {
                start = maxSegment.end;
                end = maxSegment.start;
                dir = CompassVector.OppositeDir(dir);
            }
            
            //  We need to back up to handle group crossings that are between a VisibilityBorderIntersect on a sloped border and the
            //  incoming startVertex (which is on the first ScanSegment in Perpendicular(dir) that is outside that padded border).
            startVertex = TransientGraphUtility.TraverseToFirstVertexAtOrAbove(startVertex, start, CompassVector.OppositeDir(dir));
            //  Splice into the Vertices between and including the start/end points.
            for (let currentVertex = startVertex; (currentVertex != null); currentVertex = StaticGraphUtility.FindAdjacentVertex(currentVertex, dir)) {
                let isFinalVertex: boolean = (PointComparer.Compare(currentVertex.point, end) >= 0);
                while (crossingList.CurrentIsBeforeOrAt(currentVertex.point)) {
                    let pac: PointAndCrossings = crossingList.Pop();
                    //  If it's past the start and at or before the end, splice in the crossings in the descending direction.
                    if ((PointComparer.Compare(pac.Location, startVertex.point) > 0)) {
                        if ((PointComparer.Compare(pac.Location, end) <= 0)) {
                            this.SpliceGroupBoundaryCrossing(currentVertex, pac, CompassVector.OppositeDir(dir));
                        }
                        
                    }
                    
                    //  If it's at or past the start and before the end, splice in the crossings in the descending direction.
                    if ((PointComparer.Compare(pac.Location, startVertex.point) >= 0)) {
                        if ((PointComparer.Compare(pac.Location, end) < 0)) {
                            this.SpliceGroupBoundaryCrossing(currentVertex, pac, dir);
                        }
                        
                    }
                    
                }
                
                if (isFinalVertex) {
                    break;
                }
                
            }
            
        }
        
        private static TraverseToFirstVertexAtOrAbove(startVertex: VisibilityVertex, start: Point, dir: Direction): VisibilityVertex {
            let returnVertex = startVertex;
            let oppositeDir = CompassVector.OppositeDir(dir);
            for (
            ; ; 
            ) {
                let nextVertex = StaticGraphUtility.FindAdjacentVertex(returnVertex, dir);
                //  This returns Directions. None on a match.
                if (((nextVertex == null) 
                            || (PointComparer.GetDirections(nextVertex.point, start) == oppositeDir))) {
                    break;
                }
                
                returnVertex = nextVertex;
            }
            
            return returnVertex;
        }
        
        private SpliceGroupBoundaryCrossing(currentVertex: VisibilityVertex, pac: PointAndCrossings, dirToInside: Direction) {
            let crossings: GroupBoundaryCrossing[] = PointAndCrossingsList.ToCrossingArray(pac.Crossings, dirToInside);
            if ((crossings != null)) {
                let outerVertex;
                this.AddVertex(pac.Location);
                if ((currentVertex.point != outerVertex.Point)) {
                    this.FindOrAddEdge(currentVertex, outerVertex);
                }
                
                let interiorPoint = crossings[0].GetInteriorVertexPoint(pac.Location);
                let interiorVertex;
                this.AddVertex(interiorPoint);
                //  FindOrAddEdge splits an existing edge so may not return the portion bracketed by outerVertex and interiorVertex.
                this.FindOrAddEdge(outerVertex, interiorVertex);
                let edge = this.VisGraph.FindEdgePP(outerVertex.Point, interiorVertex.Point);
                let crossingsArray = crossings.Select(() => {  }, c.Group.InputShape).ToArray();
                return crossingsArray.Any(() => {  }, s.IsTransparent);
                
            }
            
        }
        
        //  The return value is whether we should try a second pass if this is called on the first pass,
        //  using spliceTarget to wrap up dead-ends on the target side.
        ExtendSpliceWorker(spliceSource: VisibilityVertex, extendDir: Direction, spliceTargetDir: Direction, maxDesiredSegment: LineSegment, maxVisibilitySegment: LineSegment, isOverlapped: boolean, /* out */spliceTarget: VisibilityVertex): boolean {
            //  This is called after having created at least one extension vertex (initially, the
            //  first one added outside the obstacle), so we know extendVertex will be there. spliceSource
            //  is the vertex to the OppositeDir(spliceTargetDir) of that extendVertex.
            let extendVertex: VisibilityVertex = StaticGraphUtility.FindAdjacentVertex(spliceSource, spliceTargetDir);
            spliceTarget = StaticGraphUtility.FindAdjacentVertex(extendVertex, spliceTargetDir);
            for (
            ; ; 
            ) {
                if (!TransientGraphUtility.GetNextSpliceSource(/* ref */spliceSource, spliceTargetDir, extendDir)) {
                    break;
                }
                
                //  spliceSource is now on the correct edge relative to the desired nextExtendPoint.
                //  spliceTarget is in the opposite direction of the extension-line-to-spliceSource.
                let nextExtendPoint: Point = StaticGraphUtility.FindBendPointBetween(extendVertex.point, spliceSource.point, CompassVector.OppositeDir(spliceTargetDir));
                //  We test below for being on or past maxDesiredSegment; here we may be skipping 
                //  over maxDesiredSegmentEnd which is valid since we want to be sure to go to or
                //  past limitRect, but be sure to stay within maxVisibilitySegment.
                if (TransientGraphUtility.IsPointPastSegmentEnd(maxVisibilitySegment, nextExtendPoint)) {
                    break;
                }
                
                spliceTarget = TransientGraphUtility.GetSpliceTarget(/* ref */spliceSource, spliceTargetDir, nextExtendPoint);
                // StaticGraphUtility.Test_DumpVisibilityGraph(ObstacleTree, VisGraph);
                if ((spliceTarget == null)) {
                    //  This may be because spliceSource was created just for Group boundaries.  If so,
                    //  skip to the next nextExtendVertex location.
                    if (this.IsSkippableSpliceSourceWithNullSpliceTarget(spliceSource, extendDir)) {
                        // TODO: Warning!!! continue If
                    }
                    
                    //  We're at a dead-end extending from the source side, or there is an intervening obstacle, or both.
                    //  Don't splice across lateral group boundaries.
                    if (this.ObstacleTree.SegmentCrossesAnObstacle(spliceSource.point, nextExtendPoint)) {
                        return false;
                    }
                    
                }
                
                //  We might be walking through a point where a previous chain dead-ended.
                let nextExtendVertex: VisibilityVertex = this.VisGraph.FindVertex(nextExtendPoint);
                if ((nextExtendVertex != null)) {
                    if (((spliceTarget == null) 
                                || (this.VisGraph.FindEdgePP(extendVertex.point, nextExtendPoint) != null))) {
                        //  We are probably along a ScanSegment so visibility in this direction has already been determined.
                        //  Stop and don't try to continue extension from the opposite side.  If we continue splicing here
                        //  it might go across an obstacle.
                        if ((spliceTarget == null)) {
                            this.Debug_VerifyNonOverlappedExtension(isOverlapped, extendVertex, nextExtendVertex, /* spliceSource:*/ null, /* spliceTarget:*/ null);
                            this.FindOrAddEdge(extendVertex, nextExtendVertex, ScanSegment.OverlappedWeight);
                            // TODO: Warning!!!, inline IF is not supported ?
                            isOverlapped;
                            ScanSegment.NormalWeight;
                        }
                        
                        return false;
                    }
                    
                    //  This should always have been found in the find-the-next-target loop above if there is
                    //  a vertex (which would be nextExtendVertex, which we just found) between spliceSource
                    //  and spliceTarget.  Even for a sparse graph, an edge should not skip over a vertex.
                    StaticGraphUtility.Assert((spliceTarget == StaticGraphUtility.FindAdjacentVertex(nextExtendVertex, spliceTargetDir)), "no edge exists between an existing nextExtendVertex and spliceTarget", this.ObstacleTree, this.VisGraph);
                }
                else {
                    StaticGraphUtility.Assert(((spliceTarget == null) 
                                    || (spliceTargetDir == PointComparer.GetPureDirectionVV(nextExtendPoint, spliceTarget.point))), "spliceTarget is not to spliceTargetDir of nextExtendVertex", this.ObstacleTree, this.VisGraph);
                    nextExtendVertex = this.AddVertex(nextExtendPoint);
                }
                
                this.FindOrAddEdge(extendVertex, nextExtendVertex, ScanSegment.OverlappedWeight);
                // TODO: Warning!!!, inline IF is not supported ?
                isOverlapped;
                ScanSegment.NormalWeight;
                this.Debug_VerifyNonOverlappedExtension(isOverlapped, extendVertex, nextExtendVertex, spliceSource, spliceTarget);
                //  This will split the edge if targetVertex is non-null; otherwise we are at a dead-end
                //  on the target side so must not create a vertex as it would be inside an obstacle.
                this.FindOrAddEdge(spliceSource, nextExtendVertex, ScanSegment.OverlappedWeight);
                // TODO: Warning!!!, inline IF is not supported ?
                isOverlapped;
                ScanSegment.NormalWeight;
                if (isOverlapped) {
                    isOverlapped = this.SeeIfSpliceIsStillOverlapped(extendDir, nextExtendVertex);
                }
                
                extendVertex = nextExtendVertex;
                //  Test GetDirections because it may return Directions. None.
                if ((0 
                            == (extendDir & PointComparer.GetDirections(nextExtendPoint, maxDesiredSegment.end)))) {
                    //  At or past the desired max extension point, so we're done.
                    spliceTarget = null;
                    break;
                }
                
            }
            
            return (spliceTarget != null);
        }
        
        @Conditional("TEST_MSAGL")
        private Debug_VerifyNonOverlappedExtension(isOverlapped: boolean, extendVertex: VisibilityVertex, nextExtendVertex: VisibilityVertex, spliceSource: VisibilityVertex, spliceTarget: VisibilityVertex) {
            if (isOverlapped) {
                return;
            }
            
            #if (TEST_MSAGL)
            StaticGraphUtility.Assert(!this.ObstacleTree.SegmentCrossesANonGroupObstacle(extendVertex.point, nextExtendVertex.point), "extendDir edge crosses an obstacle", this.ObstacleTree, this.VisGraph);
            #endif
            //  TEST_MSAGL
            if ((spliceSource == null)) {
                //  Only verifying the direct extension.
                return;
            }
            
            //  Verify lateral splices as well.
            if (((spliceTarget == null) 
                        || ((this.VisGraph.FindEdgePP(spliceSource.point, spliceTarget.point) == null) 
                        && (this.VisGraph.FindEdgePP(spliceSource.point, nextExtendVertex.point) == null)))) {
                //  If targetVertex isn't null and the proposed edge from nextExtendVertex -> targetVertex
                //  edge doesn't already exist, then we assert that we're not creating a new edge that
                //  crosses the obstacle bounds (a bounds-crossing edge may already exist, from a port
                //  within the obstacle; in that case nextExtendPoint splits that edge).  As above, don't
                //  splice laterally across groups.
                StaticGraphUtility.Assert(!this.ObstacleTree.SegmentCrossesAnObstacle(spliceSource.point, nextExtendVertex.point), "spliceSource->extendVertex edge crosses an obstacle", this.ObstacleTree, this.VisGraph);
                //  Above we moved spliceTarget over when nextExtendVertex existed, so account
                //  for that here.
                StaticGraphUtility.Assert(((spliceTarget == null) 
                                || ((this.VisGraph.FindEdgePP(nextExtendVertex.point, spliceTarget.point) != null) 
                                || !this.ObstacleTree.SegmentCrossesAnObstacle(nextExtendVertex.point, spliceTarget.point))), "extendVertex->spliceTarget edge crosses an obstacle", this.ObstacleTree, this.VisGraph);
            }
            
        }
        
        private static GetNextSpliceSource(/* ref */spliceSource: VisibilityVertex, spliceTargetDir: Direction, extendDir: Direction): boolean {
            let nextSpliceSource: VisibilityVertex = StaticGraphUtility.FindAdjacentVertex(spliceSource, extendDir);
            if ((nextSpliceSource == null)) {
                //  See if there is a source further away from the extension line - we might have
                //  been on freePoint line (or another nearby PortEntry line) that dead-ended.
                //  Look laterally from the previous spliceSource first.
                nextSpliceSource = spliceSource;
                for (
                ; ; 
                ) {
                    nextSpliceSource = StaticGraphUtility.FindAdjacentVertex(nextSpliceSource, CompassVector.OppositeDir(spliceTargetDir));
                    if ((nextSpliceSource == null)) {
                        return false;
                    }
                    
                    let nextSpliceSourceExtend = StaticGraphUtility.FindAdjacentVertex(nextSpliceSource, extendDir);
                    if ((nextSpliceSourceExtend != null)) {
                        nextSpliceSource = nextSpliceSourceExtend;
                        break;
                    }
                    
                }
                
            }
            
            spliceSource = nextSpliceSource;
            return true;
        }
        
        private static GetSpliceTarget(/* ref */spliceSource: VisibilityVertex, spliceTargetDir: Direction, nextExtendPoint: Point): VisibilityVertex {
            //  Look for the target.  There may be a dead-ended edge starting at the current spliceSource
            //  edge that has a vertex closer to the extension line; in that case keep walking until we
            //  have the closest vertex on the Source side of the extension line as spliceSource.
            let prevDir: Direction = PointComparer.GetPureDirectionVV(spliceSource.point, nextExtendPoint);
            let nextDir: Direction = prevDir;
            let spliceTarget = spliceSource;
            while ((nextDir == prevDir)) {
                spliceSource = spliceTarget;
                spliceTarget = StaticGraphUtility.FindAdjacentVertex(spliceSource, spliceTargetDir);
                if ((spliceTarget == null)) {
                    break;
                }
                
                if (Point.closeDistEps(spliceTarget.point, nextExtendPoint)) {
                    //  If we encountered an existing vertex for the extension chain, update spliceTarget
                    //  to be after it and we're done with this loop.
                    spliceTarget = StaticGraphUtility.FindAdjacentVertex(spliceTarget, spliceTargetDir);
                    break;
                }
                
                nextDir = PointComparer.GetPureDirectionVV(spliceTarget.point, nextExtendPoint);
            }
            
            return spliceTarget;
        }
        
        private SeeIfSpliceIsStillOverlapped(extendDir: Direction, nextExtendVertex: VisibilityVertex): boolean {
            //  If we've spliced out of overlapped space into free space, we may be able to turn off the 
            //  overlapped state if we have a perpendicular non-overlapped edge.
            let edge = this.FindNextEdge(nextExtendVertex, CompassVector.RotateLeft(extendDir));
            let maybeFreeSpace = false;
            // TODO: Warning!!!, inline IF is not supported ?
            (edge == null);
            (ScanSegment.NormalWeight == edge.Weight);
            if (!maybeFreeSpace) {
                edge = this.FindNextEdge(nextExtendVertex, CompassVector.RotateRight(extendDir));
                maybeFreeSpace = false;
                // TODO: Warning!!!, inline IF is not supported ?
                (edge == null);
                (ScanSegment.NormalWeight == edge.Weight);
            }
            
            return (!maybeFreeSpace 
                        || this.ObstacleTree.PointIsInsideAnObstacle(nextExtendVertex.point, extendDir));
        }
        
        IsSkippableSpliceSourceWithNullSpliceTarget(spliceSource: VisibilityVertex, extendDir: Direction): boolean {
            if (TransientGraphUtility.IsSkippableSpliceSourceEdgeWithNullTarget(StaticGraphUtility.FindAdjacentEdge(spliceSource, extendDir))) {
                return true;
            }
            
            let spliceSourceEdge = StaticGraphUtility.FindAdjacentEdge(spliceSource, CompassVector.OppositeDir(extendDir));
            //  Since target is null, if this is a reflection, it is bouncing off an outer side of a group or 
            //  obstacle at spliceSource.  In that case, we don't want to splice from it because then we could
            //  cut through the group and outside again; instead we should just stay outside it.
            return (TransientGraphUtility.IsSkippableSpliceSourceEdgeWithNullTarget(spliceSourceEdge) || TransientGraphUtility.IsReflectionEdge(spliceSourceEdge));
        }
        
        static IsSkippableSpliceSourceEdgeWithNullTarget(spliceSourceEdge: VisibilityEdge): boolean {
            return ((spliceSourceEdge != null) 
                        && ((spliceSourceEdge.IsPassable != null) 
                        && Point.closeDistEps(spliceSourceEdge.Length, GroupBoundaryCrossing.BoundaryWidth)));
        }
        
        static IsReflectionEdge(edge: VisibilityEdge): boolean {
            return ((edge != null) 
                        && (edge.Weight == ScanSegment.ReflectionWeight));
        }
        
        static IsPointPastSegmentEnd(maxSegment: LineSegment, point: Point): boolean {
            return (PointComparer.GetDirections(maxSegment.start, maxSegment.end) == PointComparer.GetDirections(maxSegment.end, point));
        }
        
        ///  <summary>
        ///  </summary>
        ///  <returns></returns>
        @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1305:SpecifyIFormatProvider", MessageId="System.String.Format(System.String,System.Object,System.Object)")
        public /* override */ ToString(): string {
            return string.Format("{0} {1}", this.AddedVertices.Count, this.edgesToRestore.Count);
        }
        
        transGraphTrace: DevTrace = new DevTrace("Rectilinear_TransGraphTrace", "TransGraph");
        
        transGraphVerify: DevTrace = new DevTrace("Rectilinear_TransGraphVerify");
    }
}