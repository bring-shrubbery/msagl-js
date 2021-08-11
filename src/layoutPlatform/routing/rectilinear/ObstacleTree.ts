import { from, IEnumerable } from "linq-to-typescript";
import { HitTestBehavior } from "../../core/geometry/RTree/HitTestBehavior";
import { RectangleNode } from "../../core/geometry/RTree/RectangleNode";
import { CompassVector } from "../../math/geometry/compassVector";
import { ConvexHull } from "../../math/geometry/convexHull";
import { Curve, PointLocation } from "../../math/geometry/curve";
import { Direction } from "../../math/geometry/directiton";
import { IntersectionInfo } from "../../math/geometry/intersectionInfo";
import { LineSegment } from "../../math/geometry/lineSegment";
import { Point } from "../../math/geometry/point";
import { Polyline } from "../../math/geometry/polyline";
import { Rectangle } from "../../math/geometry/rectangle";
import { BasicGraphOnEdges } from "../../structs/basicGraphOnEdges";
import { IntPair } from "../../utils/IntPair";
import { Shape } from "../shape";
import { Obstacle } from "./obstacle";
import { PointAndCrossingsList } from "./PointAndCrossingsList";
import { PointComparer } from "./PointComparer";
import { ScanDirection } from "./ScanDirection";
import { StaticGraphUtility } from "./StaticGraphUtility";
import { VisibilityGraphGenerator } from "./VisibilityGraphGenerator";

export class ObstacleTree {
        
        
       //   // The root of the hierarchy.
        
         Root: RectangleNode<Obstacle, Point> 
         
         
         get GraphBox(): Rectangle {
            return <Rectangle>(this.Root.irect);
        }
        
        
          // Dictionary of sets of ancestors for each shape, for evaluating necessary group-boundary crossings.
        
         AncestorSets: Map<Shape, Set<Shape>>;
        
        
          /// Indicates whether we adjusted spatial ancestors due to blocked paths.
        
         SpatialAncestorsAdjusted: boolean;
        
        
          // // The map of shapes to obstacles.
        
        private shapeIdToObstacleMap: Map<Shape, Obstacle>;
        
        
          // // The map of all group boundary crossings for the current RestrictSegmentWithObstacles call.
        
         CurrentGroupBoundaryCrossingMap: GroupBoundaryCrossingMap = new GroupBoundaryCrossingMap();
        
        
          // The list of all obstacles (not just those in the Root, which may have accretions of obstacles in convex hulls).
        
        private allObstacles: List<Obstacle>;
        
        
          // For accreting obstacles for clumps or convex hulls.
        
        private overlapPairs: Set<IntPair> = new Set<IntPair>();
        
        
          // Indicates whether one or more obstacles overlap.
        
        private hasOverlaps: boolean;
        
        
         // Member to avoid unnecessary class creation just to do a lookup.
        
        private lookupIntPair: IntPair = new IntPair(-1, -1);
        
        
          //Create the tree hierarchy from the enumeration.
        
         Init(obstacles: IEnumerable<Obstacle>, ancestorSets: Dictionary<Shape, Set<Shape>>, idToObstacleMap: Dictionary<Shape, Obstacle>) {
            this.CreateObstacleListAndOrdinals(obstacles);
            this.AncestorSets = ancestorSets;
            this.CreateRoot();
            this.shapeIdToObstacleMap = idToObstacleMap;
        }
        
        private CreateObstacleListAndOrdinals(obstacles: IEnumerable<Obstacle>) {
            this.allObstacles = obstacles.ToList();
            let scanlineOrdinal: number = Obstacle.FirstNonSentinelOrdinal;
            for (let obstacle in this.allObstacles) {
                scanlineOrdinal++;
                obstacle.Ordinal = scanlineOrdinal;
            }
            
        }
        
        private OrdinalToObstacle(index: number): Obstacle {
            Assert.assert((index >= Obstacle.FirstNonSentinelOrdinal), "index too small");
            Assert.assert((index 
                            < (this.allObstacles.Count + Obstacle.FirstNonSentinelOrdinal)), "index too large");
            return this.allObstacles[(index - Obstacle.FirstNonSentinelOrdinal)];
        }
        
        
         // Create the root with overlapping non-rectangular obstacles converted to their convex hulls, for more reliable calculations.
        
        private CreateRoot() {
            this.Root = ObstacleTree.CalculateHierarchy(this.GetAllObstacles());
            if (!this.OverlapsExist()) {
                return;
            }
            
            this.AccreteClumps();
            this.AccreteConvexHulls();
            this.GrowGroupsToAccommodateOverlaps();
            this.Root = ObstacleTree.CalculateHierarchy(this.GetAllObstacles().Where(() => {  }, obs.IsPrimaryObstacle));
        }
        
        private OverlapsExist(): boolean {
            if ((this.Root == null)) {
                return false;
            }
            
            RectangleNodeUtils.CrossRectangleNodes<Obstacle, Point>(this.Root, this.Root, this.CheckForInitialOverlaps);
            return this.hasOverlaps;
        }
        
        private OverlapPairAlreadyFound(a: Obstacle, b: Obstacle): boolean {
            //  If we already found it then we'll have enqueued it in the reverse order.
            this.lookupIntPair.x = b.Ordinal;
            this.lookupIntPair.y = a.Ordinal;
            return this.overlapPairs.Contains(this.lookupIntPair);
        }
        
        private CheckForInitialOverlaps(a: Obstacle, b: Obstacle) {
            if (this.hasOverlaps) {
                return;
            }
            
            let bIsInsideA: boolean;
            let aIsInsideB: boolean;
            if (ObstacleTree.ObstaclesIntersect(a, b, /* out */aIsInsideB, /* out */bIsInsideA)) {
                this.hasOverlaps = true;
                return;
            }
            
            if ((!aIsInsideB 
                        && !bIsInsideA)) {
                return;
            }
            
            //  One obstacle is inside the other.  If they're both groups, or a non-group is inside a group, nothing
            //  further is needed; we process groups differently because we can go through their sides.
            if ((a.IsGroup && b.IsGroup)) {
                return;
            }
            
            if (((a.IsGroup && bIsInsideA) 
                        || (b.IsGroup && aIsInsideB))) {
                return;
            }
            
            this.hasOverlaps = true;
        }
        
        private AccreteClumps() {
            //  Clumps are only created once.  After that, as the result of convex hull creation, we may
            //  overlap an obstacle of a clump, in which case we enclose the clump in the convex hull as well.
            //  We only allow clumps of rectangular obstacles, to avoid angled sides in the scanline.
            this.AccumulateObstaclesForClumps();
            if ((this.overlapPairs.Count == 0)) {
                return;
            }
            
            this.CreateClumps();
        }
        
        private AccreteConvexHulls() {
            //  Convex-hull creation is transitive, because the created hull may overlap additional obstacles.
            for (
            ; ; 
            ) {
                this.AccumulateObstaclesForConvexHulls();
                if (!this.CreateConvexHulls()) {
                    return;
                }
                
            }
            
        }
        
         static CalculateHierarchy(obstacles: IEnumerable<Obstacle>): RectangleNode<Obstacle, Point> {
            let rectNodes = obstacles.Select(() => {  }, new RectangleNode<Obstacle, Point>(obs, obs.VisibilityBoundingBox)).ToList();
            return RectangleNode.CreateRectangleNodeOnListOfNodes(rectNodes);
        }
        
        private AccumulateObstaclesForClumps() {
            this.overlapPairs.Clear();
            let rectangularObstacles = ObstacleTree.CalculateHierarchy(this.GetAllObstacles().Where(() => {  }, (!obs.IsGroup 
                                && obs.IsRectangle)));
            if ((rectangularObstacles == null)) {
                return;
            }
            
            RectangleNodeUtils.CrossRectangleNodes<Obstacle, Point>(rectangularObstacles, rectangularObstacles, this.EvaluateOverlappedPairForClump);
        }
        
        private EvaluateOverlappedPairForClump(a: Obstacle, b: Obstacle) {
            Assert.assert((!a.IsGroup 
                            && !b.IsGroup), "Groups should not come here");
            Assert.assert((a.IsRectangle && b.IsRectangle), "Only rectangles should come here");
            if (((a == b) 
                        || this.OverlapPairAlreadyFound(a, b))) {
                return;
            }
            
            let bIsInsideA: boolean;
            let aIsInsideB: boolean;
            if ((!ObstacleTree.ObstaclesIntersect(a, b, /* out */aIsInsideB, /* out */bIsInsideA) 
                        && (!aIsInsideB 
                        && !bIsInsideA))) {
                return;
            }
            
            this.overlapPairs.Insert(new IntPair(a.Ordinal, b.Ordinal));
        }
        
        private AccumulateObstaclesForConvexHulls() {
            this.overlapPairs.Clear();
            let allPrimaryNonGroupObstacles = ObstacleTree.CalculateHierarchy(this.GetAllObstacles().Where(() => {  }, (obs.IsPrimaryObstacle 
                                && !obs.IsGroup)));
            if ((allPrimaryNonGroupObstacles == null)) {
                return;
            }
            
            RectangleNodeUtils.CrossRectangleNodes<Obstacle, Point>(allPrimaryNonGroupObstacles, allPrimaryNonGroupObstacles, this.EvaluateOverlappedPairForConvexHull);
        }
        
        private EvaluateOverlappedPairForConvexHull(a: Obstacle, b: Obstacle) {
            Assert.assert((!a.IsGroup 
                            && !b.IsGroup), "Groups should not come here");
            if (((a == b) 
                        || this.OverlapPairAlreadyFound(a, b))) {
                return;
            }
            
            let bIsInsideA: boolean;
            let aIsInsideB: boolean;
            if ((!ObstacleTree.ObstaclesIntersect(a, b, /* out */aIsInsideB, /* out */bIsInsideA) 
                        && (!aIsInsideB 
                        && !bIsInsideA))) {
                return;
            }
            
            //  If either is in a convex hull, those must be coalesced.
            if ((!a.IsInConvexHull 
                        && !b.IsInConvexHull)) {
                //  If the obstacles are rectangles, we don't need to do anything (for this pair).
                if ((a.IsRectangle && b.IsRectangle)) {
                    return;
                }
                
            }
            
            this.overlapPairs.Insert(new IntPair(a.Ordinal, b.Ordinal));
            this.AddClumpToConvexHull(a);
            this.AddClumpToConvexHull(b);
            this.AddConvexHullToConvexHull(a);
            this.AddConvexHullToConvexHull(b);
        }
        
        GrowGroupsToAccommodateOverlaps() {
            //  Group growth is transitive, because the created hull may overlap additional obstacles.
            for (
            ; ; 
            ) {
                this.AccumulateObstaclesForGroupOverlaps();
                if (!this.GrowGroupsToResolveOverlaps()) {
                    return;
                }
                
            }
            
        }
        
        private AccumulateObstaclesForGroupOverlaps() {
            let groupObstacles = ObstacleTree.CalculateHierarchy(this.GetAllObstacles().Where(() => {  }, obs.IsGroup));
            let allPrimaryObstacles = ObstacleTree.CalculateHierarchy(this.GetAllObstacles().Where(() => {  }, obs.IsPrimaryObstacle));
            if (((groupObstacles == null) 
                        || (allPrimaryObstacles == null))) {
                return;
            }
            
            RectangleNodeUtils.CrossRectangleNodes<Obstacle, Point>(groupObstacles, allPrimaryObstacles, this.EvaluateOverlappedPairForGroup);
        }
        
        private EvaluateOverlappedPairForGroup(a: Obstacle, b: Obstacle) {
            Assert.assert(a.IsGroup, "Inconsistency in overlapping group enumeration");
            if (((a == b) 
                        || this.OverlapPairAlreadyFound(a, b))) {
                return;
            }
            
            let bIsInsideA: boolean;
            let aIsInsideB: boolean;
            let curvesIntersect = ObstacleTree.ObstaclesIntersect(a, b, /* out */aIsInsideB, /* out */bIsInsideA);
            if ((!curvesIntersect 
                        && (!aIsInsideB 
                        && !bIsInsideA))) {
                return;
            }
            
            if ((a.IsRectangle && b.IsRectangle)) {
                //  If these are already rectangles, we don't need to do anything here.  Non-group VisibilityPolylines
                //  will not change by the group operations; we'll just grow the group if needed (if it is already 
                //  nonrectangular, either because it came in that way or because it has intersected a non-rectangle).
                //  However, SparseVg needs to know about the overlap so it will create interior scansegments if the
                //  obstacle is not otherwise overlapped.
                if (!b.IsGroup) {
                    if ((aIsInsideB || ObstacleTree.FirstRectangleContainsACornerOfTheOther(b.VisibilityBoundingBox, a.VisibilityBoundingBox))) {
                        b.OverlapsGroupCorner = true;
                    }
                    
                }
                
                return;
            }
            
            if (!curvesIntersect) {
                //  If the borders don't intersect, we don't need to do anything if both are groups or the
                //  obstacle or convex hull is inside the group.  Otherwise we have to grow group a to encompass b.
                if ((b.IsGroup || bIsInsideA)) {
                    return;
                }
                
            }
            
            this.overlapPairs.Insert(new IntPair(a.Ordinal, b.Ordinal));
        }
        
        private static FirstRectangleContainsACornerOfTheOther(a: Rectangle, b: Rectangle): boolean {
            return (a.Contains(b.LeftBottom) 
                        || (a.Contains(b.LeftTop) 
                        || (a.Contains(b.RightTop) || a.Contains(b.RightBottom))));
        }
        
        private static FirstPolylineStartIsInsideSecondPolyline(first: Polyline, second: Polyline): boolean {
            return (Curve.PointRelativeToCurveLocation(first.Start, second) != PointLocation.Outside);
        }
        
        private AddClumpToConvexHull(obstacle: Obstacle) {
            if (obstacle.IsOverlapped) {
                for (let sibling in obstacle.Clump.Where(() => {  }, (sib.Ordinal != obstacle.Ordinal))) {
                    this.overlapPairs.Insert(new IntPair(obstacle.Ordinal, sibling.Ordinal));
                }
                
                //  Clear this now so any overlaps with other obstacles in the clump won't doubly insert.
                obstacle.Clump.Clear();
            }
            
        }
        
        private AddConvexHullToConvexHull(obstacle: Obstacle) {
            if (obstacle.IsInConvexHull) {
                for (let sibling in obstacle.ConvexHull.Obstacles.Where(() => {  }, (sib.Ordinal != obstacle.Ordinal))) {
                    this.overlapPairs.Insert(new IntPair(obstacle.Ordinal, sibling.Ordinal));
                }
                
                //  Clear this now so any overlaps with other obstacles in the ConvexHull won't doubly insert.
                obstacle.ConvexHull.Obstacles.Clear();
            }
            
        }
        
        private CreateClumps() {
            let graph = new BasicGraphOnEdges<IntPair>(this.overlapPairs);
            let connectedComponents = ConnectedComponentCalculator.GetComponents(graph);
            for (let component in connectedComponents) {
                //  GetComponents returns at least one self-entry for each index - including the < FirstNonSentinelOrdinal ones.
                if ((component.Count() == 1)) {
                    // TODO: Warning!!! continue If
                }
                
                let clump = new Clump(component.Select(this.OrdinalToObstacle));
                for (let obstacle in clump) {
                    obstacle.Clump = clump;
                }
                
            }
            
        }
        
        private CreateConvexHulls(): boolean {
            let found = false;
            let graph = new BasicGraphOnEdges<IntPair>(this.overlapPairs);
            let connectedComponents = ConnectedComponentCalculator.GetComponents(graph);
            for (let component in connectedComponents) {
                //  GetComponents returns at least one self-entry for each index - including the < FirstNonSentinelOrdinal ones.
                if ((component.Count() == 1)) {
                    // TODO: Warning!!! continue If
                }
                
                found = true;
                let obstacles = component.Select(this.OrdinalToObstacle);
                let points = obstacles.SelectMany(() => {  }, obs.VisibilityPolyline);
                let och = new OverlapConvexHull(ConvexHull.CreateConvexHullAsClosedPolyline(points), obstacles);
                for (let obstacle in obstacles) {
                    obstacle.SetConvexHull(och);
                }
                
            }
            
            return found;
        }
        
        private GrowGroupsToResolveOverlaps(): boolean {
            //  This is one-at-a-time so not terribly efficient but there should be a very small number of such overlaps, if any.
            let found = false;
            for (let pair in this.overlapPairs) {
                found = true;
                let a = this.OrdinalToObstacle(pair.First);
                let b = this.OrdinalToObstacle(pair.Second);
                if (!ObstacleTree.ResolveGroupAndGroupOverlap(a, b)) {
                    ObstacleTree.ResolveGroupAndObstacleOverlap(a, b);
                }
                
            }
            
            this.overlapPairs.Clear();
            return found;
        }
        
        private static ResolveGroupAndGroupOverlap(a: Obstacle, b: Obstacle): boolean {
            //  For simplicity, pick the larger group and make grow its convex hull to encompass the smaller.
            if (!b.IsGroup) {
                return false;
            }
            
            if ((a.VisibilityPolyline.BoundingBox.Area > b.VisibilityPolyline.BoundingBox.Area)) {
                ObstacleTree.ResolveGroupAndObstacleOverlap(a, b);
            }
            else {
                ObstacleTree.ResolveGroupAndObstacleOverlap(b, a);
            }
            
            return true;
        }
        
        private static ResolveGroupAndObstacleOverlap(group: Obstacle, obstacle: Obstacle) {
            //  Create a convex hull for the group which goes outside the obstacle (which may also be a group).
            //  It must go outside the obstacle so we don't have coinciding angled sides in the scanline.
            let loosePolyline = obstacle.LooseVisibilityPolyline;
            ObstacleTree.GrowGroupAroundLoosePolyline(group, loosePolyline);
            //  Due to rounding we may still report this to be close or intersecting; grow it again if so.
            let bIsInsideA: boolean;
            let aIsInsideB: boolean;
            while ((ObstacleTree.ObstaclesIntersect(obstacle, group, /* out */aIsInsideB, /* out */bIsInsideA) 
                        || !aIsInsideB)) {
                loosePolyline = Obstacle.CreateLoosePolyline(loosePolyline);
                ObstacleTree.GrowGroupAroundLoosePolyline(group, loosePolyline);
            }
            
            return;
        }
        
        private static GrowGroupAroundLoosePolyline(group: Obstacle, loosePolyline: Polyline) {
            let points = group.VisibilityPolyline.Select(() => {  }, p).Concat(loosePolyline.Select(() => {  }, p));
            group.SetConvexHull(new OverlapConvexHull(ConvexHull.CreateConvexHullAsClosedPolyline(points), new, [));
            group;
        }
        
         static ObstaclesIntersect(a: Obstacle, b: Obstacle, /* out */aIsInsideB: boolean, /* out */bIsInsideA: boolean): boolean {
            if (Curve.CurvesIntersect(a.VisibilityPolyline, b.VisibilityPolyline)) {
                aIsInsideB = false;
                bIsInsideA = false;
                return true;
            }
            
            aIsInsideB = ObstacleTree.FirstPolylineStartIsInsideSecondPolyline(a.VisibilityPolyline, b.VisibilityPolyline);
            bIsInsideA = (!aIsInsideB 
                        && ObstacleTree.FirstPolylineStartIsInsideSecondPolyline(b.VisibilityPolyline, a.VisibilityPolyline));
            if ((a.IsRectangle && b.IsRectangle)) {
                //  Rectangles do not require further evaluation.
                return false;
            }
            
            if (ObstacleTree.ObstaclesAreCloseEnoughToBeConsideredTouching(a, b, aIsInsideB, bIsInsideA)) {
                aIsInsideB = false;
                bIsInsideA = false;
                return true;
            }
            
            return false;
        }
        
        private static ObstaclesAreCloseEnoughToBeConsideredTouching(a: Obstacle, b: Obstacle, aIsInsideB: boolean, bIsInsideA: boolean): boolean {
            //  This is only called when the obstacle.VisibilityPolylines don't intersect, thus one is inside the other
            //  or both are outside. If both are outside then either one's LooseVisibilityPolyline may be used.
            if ((!aIsInsideB 
                        && !bIsInsideA)) {
                return Curve.CurvesIntersect(a.LooseVisibilityPolyline, b.VisibilityPolyline);
            }
            
            //  Otherwise see if the inner one is close enough to the outer border to consider them touching.
            let innerLoosePolyline = a.LooseVisibilityPolyline;
            // TODO: Warning!!!, inline IF is not supported ?
            aIsInsideB;
            b.LooseVisibilityPolyline;
            let outerPolyline = b.VisibilityPolyline;
            // TODO: Warning!!!, inline IF is not supported ?
            aIsInsideB;
            a.VisibilityPolyline;
            for (let innerPoint: Point in innerLoosePolyline) {
                if ((Curve.PointRelativeToCurveLocation(innerPoint, outerPolyline) == PointLocation.Outside)) {
                    let outerParamPoint = Curve.ClosestPoint(outerPolyline, innerPoint);
                    if (!ApproximateComparer.CloseIntersections(innerPoint, outerParamPoint)) {
                        return true;
                    }
                    
                }
                
            }
            
            return false;
        }
        
        
          Add ancestors that are spatial parents - they may not be in the hierarchy, but we need to be
          able to cross their boundaries if we're routing between obstacles on different sides of them.
        
         AdjustSpatialAncestors(): boolean {
            if (this.SpatialAncestorsAdjusted) {
                return false;
            }
            
            //  Add each group to the AncestorSet of any spatial children (duplicate Insert() is ignored).
            for (let group in this.GetAllGroups()) {
                let groupBox = group.VisibilityBoundingBox;
                for (let obstacle in this.Root.GetNodeItemsIntersectingRectangle(groupBox)) {
                    if (((obstacle != group) 
                                && Curve.ClosedCurveInteriorsIntersect(obstacle.VisibilityPolyline, group.VisibilityPolyline))) {
                        if (obstacle.IsInConvexHull) {
                            Assert.assert(obstacle.IsPrimaryObstacle, "Only primary obstacles should be in the hierarchy");
                            for (let sibling in obstacle.ConvexHull.Obstacles) {
                                this.AncestorSets[sibling.InputShape].Insert(group.InputShape);
                            }
                            
                        }
                        
                        this.AncestorSets[obstacle.InputShape].Insert(group.InputShape);
                    }
                    
                }
                
            }
            
            //  Remove any hierarchical ancestors that are not spatial ancestors.  Otherwise, when trying to route to
            //  obstacles that *are* spatial children of such a non-spatial-but-hierarchical ancestor, we won't enable
            //  crossing the boundary the first time and will always go to the full "activate all groups" path.  By
            //  removing them here we not only get a better graph (avoiding some spurious crossings) but we're faster
            //  both in path generation and Nudging.
            let nonSpatialGroups = new List<Shape>();
            for (let child in this.Root.GetAllLeaves()) {
                let childBox = child.VisibilityBoundingBox;
                //  This has to be two steps because we can't modify the Set during enumeration.
                nonSpatialGroups.AddRange(this.AncestorSets[child.InputShape].Where(() => {  }, !childBox.Intersects(this.shapeIdToObstacleMap[anc].VisibilityBoundingBox)));
                for (let group in nonSpatialGroups) {
                    this.AncestorSets[child.InputShape].Remove(group);
                }
                
                nonSpatialGroups.Clear();
            }
            
            this.SpatialAncestorsAdjusted = true;
            return true;
        }
        
         GetAllGroups(): IEnumerable<Obstacle> {
            return this.GetAllObstacles().Where(() => {  }, obs.IsGroup);
        }
        
        
          Clear the internal state.
        
         Clear() {
            this.Root = null;
            this.AncestorSets = null;
        }
        
        
          Create a LineSegment that contains the max visibility from startPoint in the desired direction.
        
         CreateMaxVisibilitySegment(startPoint: Point, dir: Direction, /* out */pacList: PointAndCrossingsList): LineSegment {
            let graphBoxBorderIntersect = StaticGraphUtility.RectangleBorderIntersect(this.GraphBox, startPoint, dir);
            if ((PointComparer.GetDirections(startPoint, graphBoxBorderIntersect) == Direction.None)) {
                pacList = null;
                return new LineSegment(startPoint, startPoint);
            }
            
            let segment = this.RestrictSegmentWithObstacles(startPoint, graphBoxBorderIntersect);
            //  Store this off before other operations which overwrite it.
            pacList = this.CurrentGroupBoundaryCrossingMap.GetOrderedListBetween(segment.Start, segment.End);
            return segment;
        }
        
        
          Convenience functions that call through to RectangleNode.
        
          <returns></returns>
         GetAllObstacles(): IEnumerable<Obstacle> {
            return this.allObstacles;
        }
        
        
          Returns a list of all primary obstacles - secondary obstacles inside a convex hull are not needed in the VisibilityGraphGenerator.
        
          <returns></returns>
         GetAllPrimaryObstacles(): IEnumerable<Obstacle> {
            return this.Root.GetAllLeaves();
        }
        
        //  Hit-testing.
         IntersectionIsInsideAnotherObstacle(sideObstacle: Obstacle, eventObstacle: Obstacle, intersect: Point, scanDirection: ScanDirection): boolean {
            insideHitTestIgnoreObstacle1 = eventObstacle;
            insideHitTestIgnoreObstacle2 = sideObstacle;
            insideHitTestScanDirection = scanDirection;
            let obstacleNode: RectangleNode<Obstacle, Point> = this.Root.FirstHitNode(intersect, InsideObstacleHitTest);
            return (null != obstacleNode);
        }
        
         PointIsInsideAnObstacle(intersect: Point, direction: Direction): boolean {
            return this.PointIsInsideAnObstacle(intersect, ScanDirection.GetInstance(direction));
        }
        
         PointIsInsideAnObstacle(intersect: Point, scanDirection: ScanDirection): boolean {
            insideHitTestIgnoreObstacle1 = null;
            insideHitTestIgnoreObstacle2 = null;
            insideHitTestScanDirection = scanDirection;
            let obstacleNode: RectangleNode<Obstacle, Point> = this.Root.FirstHitNode(intersect, InsideObstacleHitTest);
            return (null != obstacleNode);
        }
        
        //  Ignore one (always) or both (depending on location) of these obstacles on Obstacle hit testing.
        insideHitTestIgnoreObstacle1: Obstacle;
        
        insideHitTestIgnoreObstacle2: Obstacle;
        
        insideHitTestScanDirection: ScanDirection;
        
        InsideObstacleHitTest(location: Point, obstacle: Obstacle): HitTestBehavior {
            if (((obstacle == this.insideHitTestIgnoreObstacle1) 
                        || (obstacle == this.insideHitTestIgnoreObstacle2))) {
                //  It's one of the two obstacles we already know about.
                return HitTestBehavior.Continue;
            }
            
            if (obstacle.IsGroup) {
                //  Groups are handled differently from overlaps; we create ScanSegments (overlapped
                //  if within a non-group obstacle, else non-overlapped), and turn on/off access across
                //  the Group boundary vertices.
                return HitTestBehavior.Continue;
            }
            
            if (!StaticGraphUtility.PointIsInRectangleInterior(location, obstacle.VisibilityBoundingBox)) {
                //  // The point is on the obstacle boundary, not inside it.
                return HitTestBehavior.Continue;
            }
            
            //  Note: There are rounding issues using Curve.PointRelativeToCurveLocation at angled
            //  obstacle boundaries, hence this function.
            let high: Point = (StaticGraphUtility.RectangleBorderIntersect(obstacle.VisibilityBoundingBox, location, this.insideHitTestScanDirection.Direction) + this.insideHitTestScanDirection.DirectionAsPoint);
            let low: Point = (StaticGraphUtility.RectangleBorderIntersect(obstacle.VisibilityBoundingBox, location, this.insideHitTestScanDirection.OppositeDirection) - this.insideHitTestScanDirection.DirectionAsPoint);
            let testSeg = new LineSegment(low, high);
            let xxs: IList<IntersectionInfo> = Curve.GetAllIntersections(testSeg, obstacle.VisibilityPolyline, true);
            //  If this is an extreme point it can have one intersection, in which case we're either on the border
            //  or outside; if it's a collinear flat boundary, there can be 3 intersections to this point which again
            //  means we're on the border (and 3 shouldn't happen anymore with the curve intersection fixes and 
            //  PointIsInsideRectangle check above).  So the interesting case is that we have 2 intersections.
            if ((2 == xxs.Count)) {
                let firstInt: Point = SpliceUtility.RawIntersection(xxs[0], location);
                let secondInt: Point = SpliceUtility.RawIntersection(xxs[1], location);
                //  If we're on either intersection, we're on the border rather than inside.
                if ((!PointComparer.Equal(location, firstInt) 
                            && (!PointComparer.Equal(location, secondInt) 
                            && (location.CompareTo(firstInt) != location.CompareTo(secondInt))))) {
                    //  We're inside.  However, this may be an almost-flat side, in which case rounding
                    //  could have reported the intersection with the start or end of the same side and
                    //  a point somewhere on the interior of that side.  Therefore if both intersections
                    //  are on the same side (integral portion of the parameter), we consider location 
                    //  to be on the border.  testSeg is always xxs[*].Segment0.
                    Assert.assert((testSeg == xxs[0].Segment0), "incorrect parameter ordering to GetAllIntersections");
                    if (!ApproximateComparer.Close(Math.Floor(xxs[0].Par1), Math.Floor(xxs[1].Par1))) {
                        return HitTestBehavior.Stop;
                    }
                    
                }
                
            }
            
            return HitTestBehavior.Continue;
        }
        
         SegmentCrossesAnObstacle(startPoint: Point, endPoint: Point): boolean {
            stopAtGroups = true;
            wantGroupCrossings = false;
            let obstacleIntersectSeg: LineSegment = this.RestrictSegmentPrivate(startPoint, endPoint);
            return !PointComparer.Equal(obstacleIntersectSeg.End, endPoint);
        }
        
         SegmentCrossesANonGroupObstacle(startPoint: Point, endPoint: Point): boolean {
            stopAtGroups = false;
            wantGroupCrossings = false;
            let obstacleIntersectSeg: LineSegment = this.RestrictSegmentPrivate(startPoint, endPoint);
            return !PointComparer.Equal(obstacleIntersectSeg.End, endPoint);
        }
        
        //  TEST_MSAGL
         RestrictSegmentWithObstacles(startPoint: Point, endPoint: Point): LineSegment {
            stopAtGroups = false;
            wantGroupCrossings = true;
            return this.RestrictSegmentPrivate(startPoint, endPoint);
        }
        
        private RestrictSegmentPrivate(startPoint: Point, endPoint: Point): LineSegment {
            this.GetRestrictedIntersectionTestSegment(startPoint, endPoint);
            currentRestrictedRay = new LineSegment(startPoint, endPoint);
            restrictedRayLengthSquared = (startPoint - endPoint).LengthSquared;
            this.CurrentGroupBoundaryCrossingMap.Clear();
            this.RecurseRestrictRayWithObstacles(this.Root);
            return currentRestrictedRay;
        }
        
        private GetRestrictedIntersectionTestSegment(startPoint: Point, endPoint: Point) {
            //  Due to rounding issues use a larger line span for intersection calculations.
            let segDir: Direction = PointComparer.GetPureDirection(startPoint, endPoint);
            let startX: number = this.GraphBox.Right;
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.West == segDir);
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.East == segDir);
            startPoint.X;
            this.GraphBox.Left;
            let endX: number = this.GraphBox.Left;
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.West == segDir);
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.East == segDir);
            endPoint.X;
            this.GraphBox.Right;
            let startY: number = (this.GraphBox.Top * 2);
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.South == segDir);
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.North == segDir);
            startPoint.Y;
            this.GraphBox.Bottom;
            let endY: number = this.GraphBox.Bottom;
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.South == segDir);
            // TODO: Warning!!!, inline IF is not supported ?
            (Direction.North == segDir);
            startPoint.Y;
            this.GraphBox.Top;
            restrictedIntersectionTestSegment = new LineSegment(new Point(startX, startY), new Point(endX, endY));
        }
        
        //  Due to rounding at the endpoints of the segment on intersection calculations, we need to preserve the original full-length segment.
        restrictedIntersectionTestSegment: LineSegment;
        
        currentRestrictedRay: LineSegment;
        
        wantGroupCrossings: boolean;
        
        stopAtGroups: boolean;
        
        restrictedRayLengthSquared: number;
        
        private RecurseRestrictRayWithObstacles(rectNode: RectangleNode<Obstacle, Point>) {
            //  A lineSeg that moves along the boundary of an obstacle is not blocked by it.
            if (!StaticGraphUtility.RectangleInteriorsIntersect(this.currentRestrictedRay.BoundingBox, (<Rectangle>(rectNode.Rectangle)))) {
                return;
            }
            
            let obstacle: Obstacle = rectNode.UserData;
            if ((null != obstacle)) {
                //  Leaf node. Get the interior intersections.  Use the full-length original segment for the intersection calculation.
                let intersections: IList<IntersectionInfo> = Curve.GetAllIntersections(this.restrictedIntersectionTestSegment, obstacle.VisibilityPolyline, true);
                if ((!obstacle.IsGroup 
                            || this.stopAtGroups)) {
                    this.LookForCloserNonGroupIntersectionToRestrictRay(intersections);
                    return;
                }
                
                if (this.wantGroupCrossings) {
                    this.AddGroupIntersectionsToRestrictedRay(obstacle, intersections);
                }
                
                Assert.assert(rectNode.IsLeaf, "RectNode with UserData is not a Leaf");
                return;
            }
            
            //  Not a leaf; recurse into children.
            this.RecurseRestrictRayWithObstacles(rectNode.Left);
            this.RecurseRestrictRayWithObstacles(rectNode.Right);
        }
        
        private LookForCloserNonGroupIntersectionToRestrictRay(intersections: IList<IntersectionInfo>) {
            let numberOfGoodIntersections: number = 0;
            let closestIntersectionInfo: IntersectionInfo = null;
            let localLeastDistSquared = this.restrictedRayLengthSquared;
            let testDirection = PointComparer.GetDirections(this.restrictedIntersectionTestSegment.Start, this.restrictedIntersectionTestSegment.End);
            for (let intersectionInfo in intersections) {
                let intersect = SpliceUtility.RawIntersection(intersectionInfo, this.currentRestrictedRay.Start);
                let dirToIntersect = PointComparer.GetDirections(this.currentRestrictedRay.Start, intersect);
                if ((dirToIntersect == CompassVector.OppositeDir(testDirection))) {
                    // TODO: Warning!!! continue If
                }
                
                numberOfGoodIntersections++;
                if ((Direction.None == dirToIntersect)) {
                    localLeastDistSquared = 0;
                    closestIntersectionInfo = intersectionInfo;
                    // TODO: Warning!!! continue If
                }
                
                let distSquared = (intersect - this.currentRestrictedRay.Start).LengthSquared;
                if ((distSquared < localLeastDistSquared)) {
                    //  Rounding may falsely report two intersections as different when they are actually "Close",
                    //  e.g. a horizontal vs. vertical intersection on a slanted edge.
                    let rawDistSquared = (intersectionInfo.IntersectionPoint - this.currentRestrictedRay.Start).LengthSquared;
                    if ((rawDistSquared < ApproximateComparer.SquareOfDistanceEpsilon)) {
                        // TODO: Warning!!! continue If
                    }
                    
                    localLeastDistSquared = distSquared;
                    closestIntersectionInfo = intersectionInfo;
                }
                
            }
            
            if ((null != closestIntersectionInfo)) {
                //  If there was only one intersection and it is quite close to an end, ignore it.
                //  If there is more than one intersection, we have crossed the obstacle so we want it.
                if ((numberOfGoodIntersections == 1)) {
                    let intersect = SpliceUtility.RawIntersection(closestIntersectionInfo, this.currentRestrictedRay.Start);
                    if ((ApproximateComparer.CloseIntersections(intersect, this.currentRestrictedRay.Start) || ApproximateComparer.CloseIntersections(intersect, this.currentRestrictedRay.End))) {
                        return;
                    }
                    
                }
                
                this.restrictedRayLengthSquared = localLeastDistSquared;
                this.currentRestrictedRay.End = SpliceUtility.MungeClosestIntersectionInfo(this.currentRestrictedRay.Start, closestIntersectionInfo, !StaticGraphUtility.IsVertical(this.currentRestrictedRay.Start, this.currentRestrictedRay.End));
            }
            
        }
        
        private AddGroupIntersectionsToRestrictedRay(obstacle: Obstacle, intersections: IList<IntersectionInfo>) {
            //  We'll let the lines punch through any intersections with groups, but track the location so we can enable/disable crossing.
            for (let intersectionInfo in intersections) {
                let intersect = SpliceUtility.RawIntersection(intersectionInfo, this.currentRestrictedRay.Start);
                //  Skip intersections that are past the end of the restricted segment (though there may still be some
                //  there if we shorten it later, but we'll skip them later).
                let distSquared = (intersect - this.currentRestrictedRay.Start).LengthSquared;
                if ((distSquared > this.restrictedRayLengthSquared)) {
                    // TODO: Warning!!! continue If
                }
                
                let dirTowardIntersect = PointComparer.GetPureDirection(this.currentRestrictedRay.Start, this.currentRestrictedRay.End);
                let polyline = (<Polyline>(intersectionInfo.Segment1));
                //  this is the second arg to GetAllIntersections
                let dirsOfSide = CompassVector.VectorDirection(polyline.Derivative(intersectionInfo.Par1));
                //  // The derivative is always clockwise, so if the side contains the rightward rotation of the
                //  direction from the ray origin, then we're hitting it from the inside; otherwise from the outside.
                let dirToInsideOfGroup = dirTowardIntersect;
                if ((0 
                            != (dirsOfSide & CompassVector.RotateRight(dirTowardIntersect)))) {
                    dirToInsideOfGroup = CompassVector.OppositeDir(dirToInsideOfGroup);
                }
                
                this.CurrentGroupBoundaryCrossingMap.AddIntersection(intersect, obstacle, dirToInsideOfGroup);
            }
            
        }
    }