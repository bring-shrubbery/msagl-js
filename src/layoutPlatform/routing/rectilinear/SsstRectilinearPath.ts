///  <summary>
///  single source single target rectilinear path

import { ArgumentOutOfRangeException, IEnumerable } from "linq-to-typescript";
import { Point } from "../../..";
import { CompassVector } from "../../math/geometry/compassVector";
import { Direction } from "../../math/geometry/direction";
import { VisibilityEdge } from "../visibility/VisibilityEdge";
import { VisibilityVertex } from "../visibility/VisibilityVertex";
import { VertexEntry } from "./VertexEntry";
import { VisibilityVertexRectilinear } from "./VisibilityVertexRectiline";

class NextNeighbor {
        
    Vertex: VisibilityVertexRectilinear;
   
    Weight: number;
   
    constructor () {
       this.Clear();
   }
   
    Set(v: VisibilityVertexRectilinear, w: number) {
       this.Vertex = v;
       this.Weight = w;
   }
   
    Clear() {
       this.Vertex = null;
       this.Weight = Number.NaN;
   }
}
///  </summary>
export class SsstRectilinearPath {
    
    LengthImportance: number 
    
     BendsImportance: number 
    
    //  Only bends importance needs to be public.
     static DefaultBendPenaltyAsAPercentageOfDistance: number = 4;
    
    Target: VisibilityVertexRectilinear 
    
    Source: VisibilityVertexRectilinear 
    
   EntryDirectionsToTarget: Direction 
    
    private upperBoundOnCost: number;
    
    private sourceCostAdjustment: number;
    
    private targetCostAdjustment: number;
    
    ///  <summary>
    ///  The cost of the path calculation
    ///  </summary>
    private CombinedCost(length: number, numberOfBends: number): number {
        return ((this.LengthImportance * length) 
                    + (this.BendsImportance * numberOfBends));
    }
    
    private TotalCostFromSourceToVertex(length: number, numberOfBends: number): number {
        return (this.CombinedCost(length, numberOfBends) + this.sourceCostAdjustment);
    }
    
    ///  <summary>
    ///  The priority queue for path extensions.
    ///  </summary>
    private queue: GenericBinaryHeapPriorityQueueWithTimestamp<VertexEntry>;
    
    ///  <summary>
    ///  The list of vertices we've visited for all paths.
    ///  </summary>
    private visitedVertices: Array<VisibilityVertexRectilinear>;
    
    //  For consistency and speed, path extensions impose an ordering as in the paper:  straight, right, left.  We
    //  enqueue entries in the reverse order of preference so the latest timestamp will be the preferred direction.
    //  Thus straight-ahead neighbors are in slot 2, right in slot 1, left in slot 0.  (If the target happens
    //  to be to the Left, then the heuristic lookahead score will override the Right preference).
    
    
    ///  <summary>
    ///  The next neighbors to extend the path to from the current vertex.
    ///  </summary>
    private nextNeighbors: NextNeighbor[];
    
    private new: NextNeighbor[];
    
    private new: NextNeighbor[];
    
    public constructor () {
        this.LengthImportance = 1;
        this.BendsImportance = 1;
    }
    
    private InitPath(sourceVertexEntries: VertexEntry[], source: VisibilityVertexRectilinear, target: VisibilityVertexRectilinear): boolean {
        if (((source == target) 
                    || !this.InitEntryDirectionsAtTarget(target))) {
            return false;
        }
        
        this.Target = target;
        this.Source = source;
        let cost: number = (this.TotalCostFromSourceToVertex(0, 0) + this.HeuristicDistanceFromVertexToTarget(source.Point, Direction.None));
        if ((cost >= this.upperBoundOnCost)) {
            return false;
        }
        
        //  This path starts lower than upperBoundOnCost, so create our structures and process it.
        this.queue = new GenericBinaryHeapPriorityQueueWithTimestamp<VertexEntry>();
        this.visitedVertices = [][
                source];
        if ((sourceVertexEntries == null)) {
            this.EnqueueInitialVerticesFromSource(cost);
        }
        else {
            this.EnqueueInitialVerticesFromSourceEntries(sourceVertexEntries);
        }
        
        return (this.queue.Count > 0);
    }
    
    private InitEntryDirectionsAtTarget(vert: VisibilityVertex): boolean {
        this.EntryDirectionsToTarget = Direction.None;
        //  This routine is only called once so don't worry about optimizing foreach.
        for (let edge in vert.OutEdges) {
            this.EntryDirectionsToTarget = (this.EntryDirectionsToTarget | CompassVector.DirectionsFromPointToPoint(edge.TargetPoint, vert.Point));
        }
        
        for (let edge in vert.InEdges) {
            this.EntryDirectionsToTarget = (this.EntryDirectionsToTarget | CompassVector.DirectionsFromPointToPoint(edge.SourcePoint, vert.Point));
        }
        
        //  If this returns false then the target is isolated.
        return (this.EntryDirectionsToTarget != Direction.None);
    }
    
    private static IsInDirs(direction: Direction, dirs: Direction): boolean {
        return (direction 
                    == (direction & dirs));
    }
    
     MultistageAdjustedCostBound(bestCost: number): number {
        //  Allow an additional bend's cost for intermediate stages so we don't jump out early.
        return (bestCost + this.BendsImportance);
        // TODO: Warning!!!, inline IF is not supported ?
        !number.IsPositiveInfinity(bestCost);
        bestCost;
    }
    
    ///  <summary>
    ///  estimation from below for the distance
    ///  </summary>
    ///  <param name="point"></param>
    ///  <param name="entryDirToVertex"></param>
    ///  <returns></returns>
    private HeuristicDistanceFromVertexToTarget(point: Point, entryDirToVertex: Direction): number {
        let vectorToTarget: Point = (this.Target.Point - point);
        if ((ApproximateComparer.Close(vectorToTarget.X, 0) && ApproximateComparer.Close(vectorToTarget.Y, 0))) {
            //  We are at the target.
            return this.targetCostAdjustment;
        }
        
        let dirToTarget: Direction = CompassVector.VectorDirection(vectorToTarget);
        let numberOfBends: number;
        if ((entryDirToVertex == Direction.None)) {
            entryDirToVertex = (Direction.East 
                        | (Direction.North 
                        | (Direction.West | Direction.South)));
            numberOfBends = this.GetNumberOfBends(entryDirToVertex, dirToTarget);
        }
        else {
            numberOfBends = this.GetNumberOfBends(entryDirToVertex, dirToTarget);
        }
        
        return (this.CombinedCost(SsstRectilinearPath.ManhattanDistance(point, this.Target.Point), numberOfBends) + this.targetCostAdjustment);
    }
    
    private GetNumberOfBends(entryDirToVertex: Direction, dirToTarget: Direction): number {
        return this.GetNumberOfBendsForPureDirection(entryDirToVertex, dirToTarget);
        // TODO: Warning!!!, inline IF is not supported ?
        CompassVector.IsPureDirection(dirToTarget);
        SsstRectilinearPath.GetBendsForNotPureDirection(dirToTarget, entryDirToVertex, this.EntryDirectionsToTarget);
    }
    
    private GetNumberOfBendsForPureDirection(entryDirToVertex: Direction, dirToTarget: Direction): number {
        if (((dirToTarget & entryDirToVertex) 
                    == dirToTarget)) {
            if (SsstRectilinearPath.IsInDirs(dirToTarget, this.EntryDirectionsToTarget)) {
                return 0;
            }
            
            if ((SsstRectilinearPath.IsInDirs(SsstRectilinearPath.Left(dirToTarget), this.EntryDirectionsToTarget) || SsstRectilinearPath.IsInDirs(SsstRectilinearPath.Right(dirToTarget), this.EntryDirectionsToTarget))) {
                return 2;
            }
            
            return 4;
        }
        
        return (this.GetNumberOfBendsForPureDirection(AddOneTurn[(<number>(entryDirToVertex))], dirToTarget) + 1);
    }
    
    private static GetBendsForNotPureDirection(dirToTarget: Direction, entryDirToVertex: Direction, entryDirectionsToTarget: Direction): number {
        let a: Direction = (dirToTarget & entryDirToVertex);
        if ((a == Direction.None)) {
            return (SsstRectilinearPath.GetBendsForNotPureDirection(dirToTarget, AddOneTurn[(<number>(entryDirToVertex))], entryDirectionsToTarget) + 1);
        }
        
        let b: Direction = (dirToTarget & entryDirectionsToTarget);
        if ((b == Direction.None)) {
            return (SsstRectilinearPath.GetBendsForNotPureDirection(dirToTarget, entryDirToVertex, AddOneTurn[(<number>(entryDirectionsToTarget))]) + 1);
        }
        
        return 1;
        // TODO: Warning!!!, inline IF is not supported ?
        ((a | b) 
                    == dirToTarget);
        2;
    }
    
    private static AddOneTurn: Direction[];
    
    private static Direction.North: Direction[];
    
    private static Direction.North: Direction[];
    
    private static (: Direction[];
    
    private static Direction.East: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static (: Direction[];
    
    private static Unknown: Direction[];
    
    private static Left(direction: Direction): Direction {
        switch (direction) {
            case Direction.None:
                return Direction.None;
                break;
            case Direction.North:
                return Direction.West;
                break;
            case Direction.East:
                return Direction.North;
                break;
            case Direction.South:
                return Direction.East;
                break;
            case Direction.West:
                return Direction.South;
                break;
            default:
                throw new ArgumentOutOfRangeException("direction");
                break;
        }
        
    }
    
    private static Right(direction: Direction): Direction {
        switch (direction) {
            case Direction.None:
                return Direction.None;
                break;
            case Direction.North:
                return Direction.East;
                break;
            case Direction.East:
                return Direction.South;
                break;
            case Direction.South:
                return Direction.West;
                break;
            case Direction.West:
                return Direction.North;
                break;
            default:
                throw new ArgumentOutOfRangeException("direction");
                break;
        }
        
    }
    
     static RestorePath(entry: VertexEntry): IEnumerable<Point> {
        return SsstRectilinearPath.RestorePath(/* ref */entry, null);
    }
    
     static RestorePath(/* ref */entry: VertexEntry, firstVertexInStage: VisibilityVertex): IEnumerable<Point> {
        if ((entry == null)) {
            return null;
        }
        
        let list = new Array<Point>();
        let skippedCollinearEntry: boolean = false;
        let lastEntryDir: Direction = Direction.None;
        while (true) {
            //  Reduce unnecessary AxisEdge creations in Nudger by including only bend points, not points in the middle of a segment.
            if ((lastEntryDir == entry.Direction)) {
                skippedCollinearEntry = true;
            }
            else {
                skippedCollinearEntry = false;
                list.push(entry.Vertex.Point);
                lastEntryDir = entry.Direction;
            }
            
            let previousEntry = entry.PreviousEntry;
            if (((previousEntry == null) 
                        || (entry.Vertex == firstVertexInStage))) {
                break;
            }
            
            entry = previousEntry;
        }
        
        if (skippedCollinearEntry) {
            list.Add(entry.Vertex.Point);
        }
        
        list.Reverse();
        return list;
    }
    
    private QueueReversedEntryToNeighborVertexIfNeeded(bestEntry: VertexEntry, entryFromNeighbor: VertexEntry, weight: number) {
        //  If we have a lower-cost path from bestEntry to entryFromNeighbor.PreviousVertex than the cost of entryFromNeighbor,
        //  or bestEntry has degree 1 (it is a dead-end), enqueue a path in the opposite direction (entryFromNeighbor will probably
        //  never be extended from this point).
        let numberOfBends: number;
        let length: number;
        let neigVer = entryFromNeighbor.PreviousVertex;
        let dirToNeighbor = SsstRectilinearPath.GetLengthAndNumberOfBendsToNeighborVertex(bestEntry, neigVer, weight, /* out */numberOfBends, /* out */length);
        if (((this.CombinedCost(length, numberOfBends) < this.CombinedCost(entryFromNeighbor.Length, entryFromNeighbor.NumberOfBends)) 
                    || (bestEntry.Vertex.Degree == 1))) {
            let cost = (this.TotalCostFromSourceToVertex(length, numberOfBends) + this.HeuristicDistanceFromVertexToTarget(neigVer.Point, dirToNeighbor));
            this.EnqueueEntry(bestEntry, neigVer, length, numberOfBends, cost);
        }
        
    }
    
    private UpdateEntryToNeighborVertexIfNeeded(bestEntry: VertexEntry, neigEntry: VertexEntry, weight: number) {
        let numberOfBends: number;
        let length: number;
        let dirToNeighbor = SsstRectilinearPath.GetLengthAndNumberOfBendsToNeighborVertex(bestEntry, neigEntry.Vertex, weight, /* out */numberOfBends, /* out */length);
        if ((this.CombinedCost(length, numberOfBends) < this.CombinedCost(neigEntry.Length, neigEntry.NumberOfBends))) {
            let newCost = (this.TotalCostFromSourceToVertex(length, numberOfBends) + this.HeuristicDistanceFromVertexToTarget(neigEntry.Vertex.Point, dirToNeighbor));
            neigEntry.ResetEntry(bestEntry, length, numberOfBends, newCost);
            this.queue.DecreasePriority(neigEntry, newCost);
        }
        
    }
    
    private CreateAndEnqueueEntryToNeighborVertex(bestEntry: VertexEntry, neigVer: VisibilityVertexRectilinear, weight: number) {
        let numberOfBends: number;
        let length: number;
        let dirToNeighbor = SsstRectilinearPath.GetLengthAndNumberOfBendsToNeighborVertex(bestEntry, neigVer, weight, /* out */numberOfBends, /* out */length);
        let cost = (this.TotalCostFromSourceToVertex(length, numberOfBends) + this.HeuristicDistanceFromVertexToTarget(neigVer.Point, dirToNeighbor));
        if ((cost < this.upperBoundOnCost)) {
            if ((neigVer.VertexEntries == null)) {
                this.visitedVertices.Add(neigVer);
            }
            
            this.EnqueueEntry(bestEntry, neigVer, length, numberOfBends, cost);
        }
        
    }
    
    private EnqueueEntry(bestEntry: VertexEntry, neigVer: VisibilityVertexRectilinear, length: number, numberOfBends: number, cost: number) {
        let entry = new VertexEntry(neigVer, bestEntry, length, numberOfBends, cost);
        neigVer.SetVertexEntry(entry);
        this.queue.Enqueue(entry, entry.Cost);
    }
    
    private static GetLengthAndNumberOfBendsToNeighborVertex(prevEntry: VertexEntry, vertex: VisibilityVertex, weight: number, /* out */numberOfBends: number, /* out */length: number): Direction {
        length = (prevEntry.Length 
                    + (SsstRectilinearPath.ManhattanDistance(prevEntry.Vertex.Point, vertex.Point) * weight));
        let directionToVertex: Direction = CompassVector.PureDirectionFromPointToPoint(prevEntry.Vertex.Point, vertex.Point);
        numberOfBends = prevEntry.NumberOfBends;
        if (((prevEntry.Direction != Direction.None) 
                    && (directionToVertex != prevEntry.Direction))) {
            numberOfBends++;
        }
        
        return directionToVertex;
    }
    
     static ManhattanDistance(a: Point, b: Point): number {
        return (Math.Abs((b.X - a.X)) + Math.Abs((b.Y - a.Y)));
    }
    
     GetPathWithCost(sourceVertexEntries: VertexEntry[], source: VisibilityVertexRectilinear, adjustmentToSourceCost: number, targetVertexEntries: VertexEntry[], target: VisibilityVertexRectilinear, adjustmentToTargetCost: number, priorBestCost: number): VertexEntry {
        this.upperBoundOnCost = priorBestCost;
        this.sourceCostAdjustment = adjustmentToSourceCost;
        this.targetCostAdjustment = adjustmentToTargetCost;
        DevTracePrintSourceAndTarget(source, target);
        if (!this.InitPath(sourceVertexEntries, source, target)) {
            this.DevTraceShowPath(source, null);
            return null;
        }
        
        while ((this.queue.Count > 0)) {
            this.TestPreDequeue();
            let bestEntry = this.queue.Dequeue();
            let bestVertex = bestEntry.Vertex;
            if ((bestVertex == this.Target)) {
                this.DevTraceShowPath(source, bestEntry);
                if ((targetVertexEntries == null)) {
                    this.Cleanup();
                    return bestEntry;
                }
                
                //  We'll never get a duplicate entry direction here; we either relaxed the cost via UpdateEntryToNeighborIfNeeded
                //  before we dequeued it, or it was closed.  So, we simply remove the direction from the valid target entry directions
                //  and if we get to none, we're done.  We return a null path until the final stage.
                bestEntry.Direction;
                if ((this.EntryDirectionsToTarget == Direction.None)) {
                    this.Target.VertexEntries.CopyTo(targetVertexEntries, 0);
                    this.Cleanup();
                    return null;
                }
                
                this.upperBoundOnCost = Math.Min(this.MultistageAdjustedCostBound(bestEntry.Cost), this.upperBoundOnCost);
                // TODO: Warning!!! continue If
            }
            
            //  It's safe to close this after removing it from the queue.  Any updateEntryIfNeeded that changes it must come
            //  while it is still on the queue; it is removed from the queue only if it has the lowest cost path, and we have
            //  no negative path weights, so any other path that might try to extend to it after this cannot have a lower cost.
            bestEntry.IsClosed = true;
            //  PerfNote: Array.ForEach is optimized, but don't use .Where.
            for (let bendNeighbor in this.nextNeighbors) {
                bendNeighbor.Clear();
            }
            
            let preferredBendDir = SsstRectilinearPath.Right(bestEntry.Direction);
            this.ExtendPathAlongInEdges(bestEntry, bestVertex.InEdges, preferredBendDir);
            this.ExtendPathAlongOutEdges(bestEntry, bestVertex.OutEdges, preferredBendDir);
            for (let bendNeighbor in this.nextNeighbors) {
                if ((bendNeighbor.Vertex != null)) {
                    this.ExtendPathToNeighborVertex(bestEntry, bendNeighbor.Vertex, bendNeighbor.Weight);
                }
                
            }
            
            this.DevTraceShowAllPartialPaths(source, bestEntry);
        }
        
        //  Either there is no path to the target, or we have abandoned the path due to exceeding priorBestCost.
        if (((targetVertexEntries != null) 
                    && (this.Target.VertexEntries != null))) {
            this.Target.VertexEntries.CopyTo(targetVertexEntries, 0);
        }
        
        this.DevTraceShowPath(source, null);
        this.Cleanup();
        return null;
    }
    
    private ExtendPathAlongInEdges(bestEntry: VertexEntry, edges: Array<VisibilityEdge>, preferredBendDir: Direction) {
        //  Iteration is faster than foreach and much faster than .Where.
        let count: number = edges.Count;
        for (let ii: number = 0; (ii < count); ii++) {
            let edge = edges[ii];
            this.ExtendPathAlongEdge(bestEntry, edge, true, preferredBendDir);
        }
        
    }
    
    private ExtendPathAlongOutEdges(bestEntry: VertexEntry, edges: RbTree<VisibilityEdge>, preferredBendDir: Direction) {
        //  Avoid GetEnumerator overhead.
        let outEdgeNode = null;
        // TODO: Warning!!!, inline IF is not supported ?
        edges.IsEmpty();
        edges.TreeMinimum();
        for (
        ; (outEdgeNode != null); outEdgeNode = edges.Next(outEdgeNode)) {
            this.ExtendPathAlongEdge(bestEntry, outEdgeNode.Item, false, preferredBendDir);
        }
        
    }
    
    private ExtendPathAlongEdge(bestEntry: VertexEntry, edge: VisibilityEdge, isInEdges: boolean, preferredBendDir: Direction) {
        if (!SsstRectilinearPath.IsPassable(edge)) {
            return;
        }
        
        //  This is after the initial source vertex so PreviousEntry won't be null.
        let neigVer = (<VisibilityVertexRectilinear>(edge.Source));
        // TODO: Warning!!!, inline IF is not supported ?
        isInEdges;
        edge.Target;
        if ((neigVer == bestEntry.PreviousVertex)) {
            //  For multistage paths, the source may be a waypoint outside the graph boundaries that is collinear
            //  with both the previous and next points in the path; in that case it may have only one degree.
            //  For other cases, we just ignore it and the path will be abandoned.
            if (((bestEntry.Vertex.Degree > 1) 
                        || (bestEntry.Vertex != this.Source))) {
                return;
            }
            
            this.ExtendPathToNeighborVertex(bestEntry, neigVer, edge.Weight);
            return;
        }
        
        //  Enqueue in reverse order of preference per comments on NextNeighbor class.
        let neigDir = CompassVector.PureDirectionFromPointToPoint(bestEntry.Vertex.Point, neigVer.Point);
        let nextNeighbor = this.nextNeighbors[2];
        if ((neigDir != bestEntry.Direction)) {
            nextNeighbor = this.nextNeighbors[1];
            // TODO: Warning!!!, inline IF is not supported ?
            (neigDir == preferredBendDir);
            0;
        }
        
        Debug.Assert((nextNeighbor.Vertex == null), "bend neighbor already exists");
        nextNeighbor.Set(neigVer, edge.Weight);
    }
    
    private EnqueueInitialVerticesFromSource(cost: number) {
        let bestEntry = new VertexEntry(this.Source, null, 0, 0, cost);
        //  This routine is only called once so don't worry about optimizing foreach.where
        for (let edge in this.Source.OutEdges.Where(IsPassable)) {
            this.ExtendPathToNeighborVertex(bestEntry, (<VisibilityVertexRectilinear>(edge.Target)), edge.Weight);
        }
        
        for (let edge in this.Source.InEdges.Where(IsPassable)) {
            this.ExtendPathToNeighborVertex(bestEntry, (<VisibilityVertexRectilinear>(edge.Source)), edge.Weight);
        }
        
    }
    
    private EnqueueInitialVerticesFromSourceEntries(sourceEntries: VertexEntry[]) {
        for (let entry in sourceEntries) {
            if ((entry != null)) {
                this.queue.Enqueue(entry, entry.Cost);
            }
            
        }
        
    }
    
    private ExtendPathToNeighborVertex(bestEntry: VertexEntry, neigVer: VisibilityVertexRectilinear, weight: number) {
        let dirToNeighbor = CompassVector.PureDirectionFromPointToPoint(bestEntry.Vertex.Point, neigVer.Point);
        let neigEntry = neigVer.VertexEntries[CompassVector.ToIndex(dirToNeighbor)];
        // TODO: Warning!!!, inline IF is not supported ?
        (neigVer.VertexEntries != null);
        null;
        if ((neigEntry == null)) {
            if (!this.CreateAndEnqueueReversedEntryToNeighborVertex(bestEntry, neigVer, weight)) {
                this.CreateAndEnqueueEntryToNeighborVertex(bestEntry, neigVer, weight);
            }
            
        }
        else if (!neigEntry.IsClosed) {
            this.UpdateEntryToNeighborVertexIfNeeded(bestEntry, neigEntry, weight);
        }
        
    }
    
    private CreateAndEnqueueReversedEntryToNeighborVertex(bestEntry: VertexEntry, neigVer: VisibilityVertexRectilinear, weight: number): boolean {
        //  VertexEntries is null for the initial source. Otherwise, if there is already a path into bestEntry's vertex
        //  from neigVer, we're turning back on the path; therefore we have already enqueued the neighbors of neigVer.
        //  However, the path cost includes both path length to the current point and the lookahead; this means that we
        //  may now be coming into the neigVer from the opposite side with an equal score to the previous entry, but
        //  the new path may be going toward the target while the old one (from neigVer to bestEntry) went away from
        //  the target.  So, if we score better going in the opposite direction, enqueue bestEntry->neigVer; ignore
        //  neigVer->bestEntry as it probably won't be extended again.
        if ((bestEntry.Vertex.VertexEntries != null)) {
            let dirFromNeighbor = CompassVector.PureDirectionFromPointToPoint(neigVer.Point, bestEntry.Vertex.Point);
            let entryFromNeighbor = bestEntry.Vertex.VertexEntries[CompassVector.ToIndex(dirFromNeighbor)];
            if ((entryFromNeighbor != null)) {
                Debug.Assert((entryFromNeighbor.PreviousVertex == neigVer), "mismatch in turnback PreviousEntry");
                Debug.Assert(entryFromNeighbor.PreviousEntry.IsClosed, "turnback PreviousEntry should be closed");
                this.QueueReversedEntryToNeighborVertexIfNeeded(bestEntry, entryFromNeighbor, weight);
                return true;
            }
            
        }
        
        return false;
    }
    
    private static IsPassable(edge: VisibilityEdge): boolean {
        return ((edge.IsPassable == null) 
                    || edge.IsPassable());
    }
    
    private Cleanup() {
        for (let v in this.visitedVertices) {
            v.RemoveVertexEntries();
        }
        
        this.visitedVertices.Clear();
        this.queue = null;
        this.TestClearIterations();
    }
}