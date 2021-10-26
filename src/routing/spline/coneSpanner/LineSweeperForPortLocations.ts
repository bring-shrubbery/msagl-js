//  Sweeps a given direction of cones and adds discovered edges to the graph.

import { IEnumerable } from "linq-to-typescript";
import { Point, ICurve, CurveFactory } from "../../..";
import { Polyline, GeomConstants, LineSegment } from "../../../math/geometry";
import { DebugCurve } from "../../../math/geometry/debugCurve";
import { Ellipse } from "../../../math/geometry/ellipse";
import { TriangleOrientation } from "../../../math/geometry/point";
import { PolylinePoint } from "../../../math/geometry/polylinePoint";
import { RBNode } from "../../../structs/RBTree/rbNode";
import { RBTree } from "../../../structs/RBTree/rbTree";
import { Assert } from "../../../utils/assert";
import { EventQueue } from "../../rectilinear/EventQueue";
import { LineSweeperBase } from "../../visibility/LineSweeperBase";
import { PortObstacleEvent } from "../../visibility/PortObstacleEvent";
import { VisibilityEdge } from "../../visibility/VisibilityEdge";
import { VisibilityGraph } from "../../visibility/VisibilityGraph";
import { VisibilityVertex } from "../../visibility/VisibilityVertex";
import { BrokenConeSide } from "./BrokenConeSide";
import { Cone } from "./Cone";
import { ConeClosureEvent } from "./ConeClosureEvent";
import { ConeLeftSide } from "./ConeLeftSide";
import { ConeRightSide } from "./ConeRightSide";
import { ConeSide } from "./ConeSide";
import { ConeSideComparer } from "./ConeSideComparer";
import { LeftIntersectionEvent } from "./LeftIntersectionEvent";
import { LeftObstacleSide } from "./LeftObstacleSide";
import { LeftVertexEvent } from "./LeftVertexEvent";
import { ObstacleSide } from "./ObstacleSide";
import { PortLocationEvent } from "./PortLocationEvent";
import { RightIntersectionEvent } from "./RightIntersectionEvent";
import { RightObstacleSide } from "./RightObstacleSide";
import { RightVertexEvent } from "./RightVertexEvent";
import { SweepEvent } from "./SweepEvent";
import { VertexEvent } from "./VertexEvent";

//  The cones can only start at ports here.
class LineSweeperForPortLocations extends LineSweeperBase /* IConeSweeper */{
    
    ConeRightSideDirection: Point 
    
     ConeLeftSideDirection: Point
    
    coneSideComparer: ConeSideComparer;
    
    visibilityGraph: VisibilityGraph;
    
    rightConeSides: RBTree<ConeSide>;
    
    leftConeSides: RBTree<ConeSide>;
    
    constructor (obstacles: Array<Polyline>, direction: Point, coneRsDir: Point, coneLsDir: Point, visibilityGraph: VisibilityGraph, portLocations: Array<Point>)  
         {     super(obstacles, direction)
        this.visibilityGraph = visibilityGraph;
        this.ConeRightSideDirection = coneRsDir;
        this.ConeLeftSideDirection = coneLsDir;
        this.coneSideComparer = new ConeSideComparer(this);
        this.leftConeSides = new RBTree<ConeSide>((a, b) =>
      this.coneSideComparer.Compare(<ConeSide>a, <ConeSide>b),
    )
    this.rightConeSides = new RBTree<ConeSide>((a, b) =>
      this.coneSideComparer.Compare(<ConeSide>a, <ConeSide>b),
    )
    this.PortLocations = portLocations;
    }
    
    PortLocations: Array<Point> 
    
    private /* internal */ static Sweep(obstacles: IEnumerable<Polyline>, direction: Point, coneAngle: number, visibilityGraph: VisibilityGraph, portLocations: IEnumerable<Point>) {
        let cs = new LineSweeperForPortLocations(obstacles, direction, direction.rotate(((coneAngle / 2) 
                            * -1)), direction.rotate((coneAngle / 2)), this.visibilityGraph, portLocations);
        cs.Calculate();
    }
    
    Calculate() {
        InitQueueOfEvents();
        for (let portLocation: Point in of) {
            this.PortLocations;
        }
        
        this.EnqueueEvent(new PortLocationEvent(portLocation));
        while ((EventQueue.Count > 0)) {
            this.ProcessEvent(EventQueue.Dequeue());
        }
        
    }
    
    ProcessEvent(p: SweepEvent) {
        let vertexEvent = (<VertexEvent>(p));
        //  ShowTrees(CurveFactory.CreateDiamond(3, 3, p.Site));
        if ((vertexEvent != null)) {
            this.ProcessVertexEvent(vertexEvent);
        }
        else {
            let rightIntersectionEvent = (<RightIntersectionEvent>(p));
            if ((rightIntersectionEvent != null)) {
                this.ProcessRightIntersectionEvent(rightIntersectionEvent);
            }
            else {
                let leftIntersectionEvent = (<LeftIntersectionEvent>(p));
                if ((leftIntersectionEvent != null)) {
                    this.ProcessLeftIntersectionEvent(leftIntersectionEvent);
                }
                else {
                    let coneClosure = (<ConeClosureEvent>(p));
                    if ((coneClosure != null)) {
                        if (!coneClosure.ConeToClose.Removed) {
                            this.RemoveCone(coneClosure.ConeToClose);
                        }
                        
                    }
                    else {
                        let portLocationEvent = (<PortLocationEvent>(p));
                        if ((portLocationEvent != null)) {
                            this.ProcessPortLocationEvent(portLocationEvent);
                        }
                        else {
                            this.ProcessPointObstacleEvent((<PortObstacleEvent>(p)));
                        }
                        
                    }
                    
                    Z = GetZ(p);
                }
                
            }
            
        }
        
        //      ShowTrees(CurveFactory.CreateEllipse(3,3,p.Site));
    }
    
    ProcessPointObstacleEvent(portObstacleEvent: PortObstacleEvent) {
        Z = GetZ(portObstacleEvent);
        this.GoOverConesSeeingVertexEvent(portObstacleEvent);
    }
    
    CreateConeOnPortLocation(sweepEvent: SweepEvent) {
        let cone = new Cone(sweepEvent.Site, this);
        let leftNode: RBNode<ConeSide> = this.InsertToTree(this.leftConeSides, cone.LeftSide=newConeLeftSide(coneUnknown);
        let rightNode: RBNode<ConeSide> = this.InsertToTree(this.rightConeSides, cone.RightSide=newConeRightSide(coneUnknown);
        this.LookForIntersectionWithConeRightSide(rightNode);
        this.LookForIntersectionWithConeLeftSide(leftNode);
    }
    
    ProcessPortLocationEvent(portEvent: PortLocationEvent) {
        Z = GetZ(portEvent);
        this.GoOverConesSeeingVertexEvent(portEvent);
        this.CreateConeOnPortLocation(portEvent);
    }
    
    ProcessLeftIntersectionEvent(leftIntersectionEvent: LeftIntersectionEvent) {
        if ((leftIntersectionEvent.coneLeftSide.Removed == false)) {
            if ((Math.Abs(((leftIntersectionEvent.EndVertex.point - leftIntersectionEvent.Site) 
                            * SweepDirection)) < GeomConstants.distanceEpsilon)) {
                // the cone is totally covered by a horizontal segment
                this.RemoveCone(leftIntersectionEvent.coneLeftSide.Cone);
            }
            else {
                this.RemoveSegFromLeftTree(leftIntersectionEvent.coneLeftSide);
                Z = (SweepDirection * leftIntersectionEvent.Site);
                // it is safe now to restore the order
                let leftSide = new BrokenConeSide(leftIntersectionEvent.Site, leftIntersectionEvent.EndVertex, leftIntersectionEvent.coneLeftSide);
                this.InsertToTree(this.leftConeSides, leftSide);
                leftIntersectionEvent.coneLeftSide.Cone.LeftSide = leftSide;
                this.LookForIntersectionOfObstacleSideAndLeftConeSide(leftIntersectionEvent.Site, leftIntersectionEvent.EndVertex);
                this.TryCreateConeClosureForLeftSide(leftSide);
            }
            
        }
        else {
            Z = (SweepDirection * leftIntersectionEvent.Site);
        }
        
    }
    
    TryCreateConeClosureForLeftSide(leftSide: BrokenConeSide) {
        let coneRightSide = (<ConeRightSide>(leftSide.Cone.RightSide));
        if ((coneRightSide != null)) {
            if ((Point.getTriangleOrientation(coneRightSide.start, (coneRightSide.start + coneRightSide.Direction), leftSide.EndVertex.point) == TriangleOrientation.Clockwise)) {
                this.CreateConeClosureEvent(leftSide, coneRightSide);
            }
            
        }
        
    }
    
    CreateConeClosureEvent(brokenConeSide: BrokenConeSide, otherSide: ConeSide) {
        let x: Point;
        let r: boolean = Point.RayIntersectsRayInteriors(brokenConeSide.start, brokenConeSide.Direction, otherSide.start, otherSide.Direction, /* out */x);
        Assert.assert(r);
        this.EnqueueEvent(new ConeClosureEvent(x, brokenConeSide.Cone));
    }
    
    ProcessRightIntersectionEvent(rightIntersectionEvent: RightIntersectionEvent) {
        // restore Z for the time being
        //  Z = PreviousZ;
        if ((rightIntersectionEvent.coneRightSide.Removed == false)) {
            // it can happen that the cone side participating in the intersection is gone;
            // obstracted by another obstacle or because of a vertex found inside of the cone
            // PrintOutRightSegTree();
            this.RemoveSegFromRightTree(rightIntersectionEvent.coneRightSide);
            Z = (SweepDirection * rightIntersectionEvent.Site);
            let rightSide = new BrokenConeSide(rightIntersectionEvent.Site, rightIntersectionEvent.EndVertex, rightIntersectionEvent.coneRightSide);
            this.InsertToTree(this.rightConeSides, rightSide);
            rightIntersectionEvent.coneRightSide.Cone.RightSide = rightSide;
            this.LookForIntersectionOfObstacleSideAndRightConeSide(rightIntersectionEvent.Site, rightIntersectionEvent.EndVertex);
            this.TryCreateConeClosureForRightSide(rightSide);
        }
        else {
            Z = (SweepDirection * rightIntersectionEvent.Site);
        }
        
    }
    
    TryCreateConeClosureForRightSide(rightSide: BrokenConeSide) {
        let coneLeftSide = (<ConeLeftSide>(rightSide.Cone.LeftSide));
        if ((coneLeftSide != null)) {
            if ((Point.getTriangleOrientation(coneLeftSide.start, (coneLeftSide.start + coneLeftSide.Direction), rightSide.EndVertex.point) == TriangleOrientation.Counterclockwise)) {
                this.CreateConeClosureEvent(rightSide, coneLeftSide);
            }
            
        }
        
    }
    
    RemoveConesClosedBySegment(leftPoint: Point, rightPoint: Point) {
        this.CloseConesCoveredBySegment(leftPoint, rightPoint, this.leftConeSides);
        // TODO: Warning!!!, inline IF is not supported ?
        ((SweepDirection * leftPoint) 
                    > (SweepDirection * rightPoint));
        this.rightConeSides;
    }
    
    CloseConesCoveredBySegment(leftPoint: Point, rightPoint: Point, tree: RBTree<ConeSide>) {
        let node: RBNode<ConeSide> = tree.FindFirst(() => {  }, (Point.getTriangleOrientation(s.start, (s.start + s.Direction), leftPoint) == TriangleOrientation.Counterclockwise));
        let x: Point;
        if (((node == null) 
                    || !Point.IntervalIntersectsRay(leftPoint, rightPoint, node.Item.start, node.Item.Direction, /* out */x))) {
            return;
        }
        
        let conesToRemove = new Array<Cone>();
        for (
        ; ((node != null) 
                    && Point.IntervalIntersectsRay(leftPoint, rightPoint, node.Item.start, node.Item.Direction, /* out */x)); 
        ) {
            conesToRemove.Add(node.Item.Cone);
            node = tree.next(node);
        }
        
        for (let cone: Cone in of) {
            conesToRemove;
        }
        
        this.RemoveCone(cone);
    }
    
    ProcessVertexEvent(vertexEvent: VertexEvent) {
        Z = GetZ(vertexEvent);
        this.GoOverConesSeeingVertexEvent(vertexEvent);
        this.AddConeAndEnqueueEvents(vertexEvent);
    }
    
    //  ReSharper disable UnusedMember.Local
    @SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    static EllipseOnVert(vertexEvent: SweepEvent): Ellipse {
        //  ReSharper restore UnusedMember.Local
        return new Ellipse(2, 2, vertexEvent.Site);
    }
    
    //  ReSharper disable UnusedMember.Local
    @SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    static EllipseOnPolylinePoint(pp: PolylinePoint): Ellipse {
        //  ReSharper restore UnusedMember.Local
        return new Ellipse(2, 2, pp.point);
    }
    
    //  ReSharper disable UnusedMember.Local
    @SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId="System.Diagnostics.Debug.WriteLine(System.String)")
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    CheckConsistency() {
        //  ReSharper restore UnusedMember.Local
        for (let s in of) {
            this.rightConeSides;
        }
        
        this.coneSideComparer.SetOperand(s);
        for (let s in of) {
            this.leftConeSides;
        }
        
        this.coneSideComparer.SetOperand(s);
        if (!this.rightConeSides.Contains(s.Cone.RightSide)) {
            this.PrintOutRightSegTree();
            this.PrintOutLeftSegTree();
        }
        
    }
    
    //  ReSharper disable UnusedMember.Local
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    ShowTrees(params curves: ICurve[]) {
        //  ReSharper restore UnusedMember.Local
        let l = Obstacles.Select(() => {  }, new DebugCurve(100, 1, "blue", c));
        l = l.Concat(this.rightConeSides.Select(() => {  }, new DebugCurve(200, 1, "brown", this.ExtendSegmentToZ(s))));
        l = l.Concat(this.leftConeSides.Select(() => {  }, new DebugCurve(200, 1, "gree", this.ExtendSegmentToZ(s))));
        l = l.Concat(curves.Select(() => {  }, new DebugCurve("red", c)));
        l = l.Concat(this.visibilityGraph.Edges.Select(() => {  }, new LineSegment(e.SourcePoint, e.TargetPoint)).Select(() => {  }, new DebugCurve("marine", c)));
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    }
    
    ShowLeftTree(params curves: ICurve[]) {
        let l = Obstacles.Select(() => {  }, new DebugCurve(c));
        l = l.Concat(this.leftConeSides.Select(() => {  }, new DebugCurve("brown", this.ExtendSegmentToZ(s))));
        l = l.Concat(curves.Select(() => {  }, new DebugCurve("red", c)));
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    }
    
    ShowRightTree(params curves: ICurve[]) {
        let l = Obstacles.Select(() => {  }, new DebugCurve(c));
        l = l.Concat(this.rightConeSides.Select(() => {  }, new DebugCurve("brown", this.ExtendSegmentToZ(s))));
        l = l.Concat(curves.Select(() => {  }, new DebugCurve("red", c)));
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    }
    
    //  ReSharper disable UnusedMember.Global
    private /* internal */ Show(params curves: ICurve[]) {
        //  ReSharper restore UnusedMember.Global
        let l = Obstacles.Select(() => {  }, new DebugCurve(100, 1, "black", c));
        l = l.Concat(curves.Select(() => {  }, new DebugCurve(200, 1, "red", c)));
        //             foreach (var s of rightConeSides){
        //                 l.Add(ExtendSegmentToZ(s));
        //                 if (s is BrokenConeSide)
        //                     l.Add(Diamond(s.start));
        //                 l.Add(ExtendSegmentToZ(s.Cone.LeftSide));
        //             }
        l = l.Concat(this.visibilityGraph.Edges.Select(() => {  }, new LineSegment(edge.SourcePoint, edge.TargetPoint)).Select(() => {  }, new DebugCurve(100, 1, "blue", c)));
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    }
    
    ExtendSegmentToZ(segment: ConeSide): ICurve {
        let den: number = (segment.Direction * SweepDirection);
        Assert.assert((Math.Abs(den) > GeomConstants.distanceEpsilon));
        let t: number = ((Z 
                    - (segment.start * SweepDirection)) 
                    / den);
        return new LineSegment(segment.start, (segment.start 
                        + (segment.Direction * t)));
    }
    
    //  ReSharper disable UnusedMember.Global
    private /* internal */ ExtendSegmentToZPlus1(segment: ConeSide): ICurve {
        //  ReSharper restore UnusedMember.Global
        let den: number = (segment.Direction * SweepDirection);
        Assert.assert((Math.Abs(den) > GeomConstants.distanceEpsilon));
        let t: number = ((Z + (1 
                    - (segment.start * SweepDirection))) 
                    / den);
        return new LineSegment(segment.start, (segment.start 
                        + (segment.Direction * t)));
    }
    
    AddConeAndEnqueueEvents(vertexEvent: VertexEvent) {
        let leftVertexEvent = (<LeftVertexEvent>(vertexEvent));
        if ((leftVertexEvent != null)) {
            let nextPoint: PolylinePoint = vertexEvent.Vertex.NextOnPolyline;
            this.CloseConesAtLeftVertex(leftVertexEvent, nextPoint);
        }
        else {
            let rightVertexEvent = (<RightVertexEvent>(vertexEvent));
            if ((rightVertexEvent != null)) {
                let nextPoint: PolylinePoint = vertexEvent.Vertex.PrevOnPolyline;
                this.CloseConesAtRightVertex(rightVertexEvent, nextPoint);
            }
            else {
                this.CloseConesAtLeftVertex(vertexEvent, vertexEvent.Vertex.NextOnPolyline);
                this.CloseConesAtRightVertex(vertexEvent, vertexEvent.Vertex.PrevOnPolyline);
            }
            
        }
        
    }
    
    CloseConesAtRightVertex(rightVertexEvent: VertexEvent, nextVertex: PolylinePoint) {
        let prevSite: Point = rightVertexEvent.Vertex.NextOnPolyline.point;
        let prevZ: number = (prevSite * SweepDirection);
        if (((prevZ <= Z) 
                    && ((Z - prevZ) 
                    < GeomConstants.distanceEpsilon))) {
            this.RemoveConesClosedBySegment(prevSite, rightVertexEvent.Vertex.point);
        }
        
        let site: Point = rightVertexEvent.Site;
        let coneLp: Point = (site + this.ConeLeftSideDirection);
        let coneRp: Point = (site + this.ConeRightSideDirection);
        let nextSite: Point = nextVertex.point;
        // SugiyamaLayoutSettings.Show(new LineSegment(site, coneLP), new LineSegment(site, coneRP), new LineSegment(site, nextSite));
        // try to remove the right side
        if ((((site - prevSite) 
                    * SweepDirection) 
                    > GeomConstants.distanceEpsilon)) {
            RemoveRightSide(new RightObstacleSide(rightVertexEvent.Vertex.NextOnPolyline));
        }
        
        if ((GetZ(nextSite) 
                    + (GeomConstants.distanceEpsilon < GetZ(rightVertexEvent)))) {
            return;
        }
        
        if (!Point.PointToTheRightOfLineOrOnLine(nextSite, site, coneLp)) {
            // if (angle <= -coneAngle / 2) {
            //    CreateConeOnVertex(rightVertexEvent);
            if (Point.PointToTheLeftOfLineOrOnLine((nextSite + DirectionPerp), nextSite, site)) {
                this.EnqueueEvent(new RightVertexEvent(nextVertex));
            }
            
            //   TryEnqueueRighVertexEvent(nextVertex);
        }
        else if (Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneRp)) {
            // if (angle < coneAngle / 2) {
            this.CaseToTheLeftOfLineOrOnLineConeRp(rightVertexEvent, nextVertex);
        }
        else {
            if ((((nextSite - site) 
                        * SweepDirection) 
                        > GeomConstants.distanceEpsilon)) {
                this.LookForIntersectionOfObstacleSideAndLeftConeSide(rightVertexEvent.Site, nextVertex);
                InsertRightSide(new RightObstacleSide(rightVertexEvent.Vertex));
            }
            
            this.EnqueueEvent(new RightVertexEvent(nextVertex));
        }
        
    }
    
    CaseToTheLeftOfLineOrOnLineConeRp(rightVertexEvent: VertexEvent, nextVertex: PolylinePoint) {
        this.EnqueueEvent(new RightVertexEvent(nextVertex));
        // the obstacle side is inside of the cone
        // we need to create an obstacle left side segment instead of the left cone side
        //                 var cone = new Cone(rightVertexEvent.Vertex.point, this);
        //                 var obstacleSideSeg = new BrokenConeSide(cone.Apex, nextVertex, new ConeLeftSide(cone));
        //                 cone.LeftSide = obstacleSideSeg;
        //                 cone.RightSide = new ConeRightSide(cone);
        //                 var rnode = InsertToTree(rightConeSides, cone.RightSide);
        //                 LookForIntersectionWithConeRightSide(rnode);
        let lnode: RBNode<ConeSide> = this.leftConeSides.FindFirst(() => {  }, LineSweeperForPortLocations.PointIsToTheLeftOfSegment(rightVertexEvent.Site, side));
        this.FixConeLeftSideIntersections(rightVertexEvent.Vertex, nextVertex, lnode);
        if ((((nextVertex.point - rightVertexEvent.Site) 
                    * SweepDirection) 
                    > GeomConstants.distanceEpsilon)) {
            InsertRightSide(new RightObstacleSide(rightVertexEvent.Vertex));
        }
        
    }
    
    LookForIntersectionOfObstacleSideAndRightConeSide(obstacleSideStart: Point, obstacleSideVertex: PolylinePoint) {
        let node: RBNode<ConeSide> = this.GetLastNodeToTheLeftOfPointInRightSegmentTree(obstacleSideStart);
        if ((node != null)) {
            let coneRightSide = (<ConeRightSide>(node.Item));
            if ((coneRightSide != null)) {
                let intersection: Point;
                if ((Point.IntervalIntersectsRay(obstacleSideStart, obstacleSideVertex.point, coneRightSide.start, this.ConeRightSideDirection, /* out */intersection) && SegmentIsNotHorizontal(intersection, obstacleSideVertex.point))) {
                    this.EnqueueEvent(this.CreateRightIntersectionEvent(coneRightSide, intersection, obstacleSideVertex));
                }
                
            }
            
        }
        
    }
    
    @SuppressMessage("Microsoft.Performance", "CA1822:MarkMembersAsStatic")
    CreateRightIntersectionEvent(coneRightSide: ConeRightSide, intersection: Point, obstacleSideVertex: PolylinePoint): RightIntersectionEvent {
        Assert.assert((Math.Abs(((obstacleSideVertex.point - intersection) 
                            * SweepDirection)) > GeomConstants.distanceEpsilon));
        return new RightIntersectionEvent(coneRightSide, intersection, obstacleSideVertex);
    }
    
    GetLastNodeToTheLeftOfPointInRightSegmentTree(obstacleSideStart: Point): RBNode<ConeSide> {
        return this.rightConeSides.FindLast(() => {  }, LineSweeperForPortLocations.PointIsToTheRightOfSegment(obstacleSideStart, s));
    }
    
    LookForIntersectionOfObstacleSideAndLeftConeSide(obstacleSideStart: Point, obstacleSideVertex: PolylinePoint) {
        let node: RBNode<ConeSide> = this.GetFirstNodeToTheRightOfPoint(obstacleSideStart);
        //           ShowLeftTree(Box(obstacleSideStart));
        if ((node == null)) {
            return;
        }
        
        let coneLeftSide = (<ConeLeftSide>(node.Item));
        if ((coneLeftSide == null)) {
            return;
        }
        
        let intersection: Point;
        if (Point.IntervalIntersectsRay(obstacleSideStart, obstacleSideVertex.point, coneLeftSide.start, this.ConeLeftSideDirection, /* out */intersection)) {
            this.EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, intersection, obstacleSideVertex));
        }
        
    }
    
    GetFirstNodeToTheRightOfPoint(p: Point): RBNode<ConeSide> {
        return this.leftConeSides.FindFirst(() => {  }, LineSweeperForPortLocations.PointIsToTheLeftOfSegment(p, s));
    }
    
    //  ReSharper disable UnusedMember.Local
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    static Box(p: Point): ICurve {
        //  ReSharper restore UnusedMember.Local
        return CurveFactory.CreateRectangle(2, 2, p);
    }
    
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId="System.Diagnostics.Debug.WriteLine(System.String)")
    PrintOutRightSegTree() {
        System.Diagnostics.Debug.WriteLine("right segment tree");
        for (let t in of) {
            this.rightConeSides;
        }
        
        System.Diagnostics.Debug.WriteLine(t);
        System.Diagnostics.Debug.WriteLine("end of right segments");
    }
    
    static PointIsToTheLeftOfSegment(p: Point, seg: ConeSide): boolean {
        return (Point.getTriangleOrientation(seg.start, (seg.start + seg.Direction), p) == TriangleOrientation.Counterclockwise);
    }
    
    static PointIsToTheRightOfSegment(p: Point, seg: ConeSide): boolean {
        return (Point.getTriangleOrientation(seg.start, (seg.start + seg.Direction), p) == TriangleOrientation.Clockwise);
    }
    
    FixConeLeftSideIntersections(obstSideStart: PolylinePoint, obstSideEnd: PolylinePoint, rbNode: RBNode<ConeSide>) {
        if ((rbNode != null)) {
            let intersection: Point;
            let seg = (<ConeLeftSide>(rbNode.Item));
            if (((seg != null) 
                        && Point.IntervalIntersectsRay(obstSideStart.point, obstSideEnd.point, seg.start, seg.Direction, /* out */intersection))) {
                this.EnqueueEvent(new LeftIntersectionEvent(seg, intersection, obstSideEnd));
            }
            
        }
        
    }
    
    InsertToTree(tree: RBTree<ConeSide>, coneSide: ConeSide): RBNode<ConeSide> {
        Assert.assert(((coneSide.Direction * SweepDirection) 
                        > GeomConstants.distanceEpsilon));
        this.coneSideComparer.SetOperand(coneSide);
        return tree.Insert(coneSide);
    }
    
    CloseConesAtLeftVertex(leftVertexEvent: VertexEvent, nextVertex: PolylinePoint) {
        // close segments first
        let prevSite: Point = leftVertexEvent.Vertex.PrevOnPolyline.point;
        let prevZ: number = (prevSite * SweepDirection);
        if (((prevZ <= Z) 
                    && ((Z - prevZ) 
                    < GeomConstants.distanceEpsilon))) {
            // Show(
            //     new Ellipse(1, 1, prevSite),
            //     CurveFactory.CreateBox(2, 2, leftVertexEvent.Vertex.point));
            this.RemoveConesClosedBySegment(leftVertexEvent.Vertex.point, prevSite);
        }
        
        let site: Point = leftVertexEvent.Site;
        let coneLp: Point = (site + this.ConeLeftSideDirection);
        let coneRp: Point = (site + this.ConeRightSideDirection);
        let nextSite: Point = nextVertex.point;
        //  SugiyamaLayoutSettings.Show(new LineSegment(site, coneLP), new LineSegment(site, coneRP), new LineSegment(site, nextSite));
        if ((((site - prevSite) 
                    * SweepDirection) 
                    > GeomConstants.distanceEpsilon)) {
            RemoveLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex.PrevOnPolyline));
        }
        
        if (Point.PointToTheRightOfLineOrOnLine(nextSite, site, (site + DirectionPerp))) {
            // if (angle > Math.PI / 2)
            //    CreateConeOnVertex(leftVertexEvent); //it is the last left vertex on this obstacle
        }
        else if (!Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneRp)) {
            // if (angle >= coneAngle / 2) {
            //  CreateConeOnVertex(leftVertexEvent);
            this.EnqueueEvent(new LeftVertexEvent(nextVertex));
            // we schedule LeftVertexEvent for a vertex with horizontal segment to the left on the top of the obstace
        }
        else if (!Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneLp)) {
            // if (angle >= -coneAngle / 2) {
            // we cannot completely obscure the cone here
            this.EnqueueEvent(new LeftVertexEvent(nextVertex));
            // the obstacle side is inside of the cone
            // we need to create an obstacle right side segment instead of the cone side
            //                 var cone = new Cone(leftVertexEvent.Vertex.point, this);
            //                 var rightSide = new BrokenConeSide(leftVertexEvent.Vertex.point, nextVertex,
            //                                                         new ConeRightSide(cone));
            //                 cone.RightSide = rightSide;
            //                 cone.LeftSide = new ConeLeftSide(cone);
            //                 LookForIntersectionWithConeLeftSide(InsertToTree(leftConeSides, cone.LeftSide));
            let rbNode: RBNode<ConeSide> = this.rightConeSides.FindLast(() => {  }, LineSweeperForPortLocations.PointIsToTheRightOfSegment(site, s));
            this.FixConeRightSideIntersections(leftVertexEvent.Vertex, nextVertex, rbNode);
            if ((((nextVertex.point - leftVertexEvent.Site) 
                        * SweepDirection) 
                        > GeomConstants.distanceEpsilon)) {
                InsertLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex));
            }
            
        }
        else {
            this.EnqueueEvent(new LeftVertexEvent(nextVertex));
            if ((((nextVertex.point - leftVertexEvent.Site) 
                        * SweepDirection) 
                        > GeomConstants.distanceEpsilon)) {
                // if( angle >- Pi/2
                //  Assert.assert(angle > -Math.PI / 2);
                this.LookForIntersectionOfObstacleSideAndRightConeSide(leftVertexEvent.Site, nextVertex);
                InsertLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex));
            }
            
        }
        
    }
    
    RemoveCone(cone: Cone) {
        Assert.assert((cone.Removed == false));
        cone.Removed = true;
        this.RemoveSegFromLeftTree(cone.LeftSide);
        this.RemoveSegFromRightTree(cone.RightSide);
    }
    
    RemoveSegFromRightTree(coneSide: ConeSide) {
        //    ShowRightTree();
        Assert.assert((coneSide.Removed == false));
        this.coneSideComparer.SetOperand(coneSide);
        let b: RBNode<ConeSide> = this.rightConeSides.Remove(coneSide);
        coneSide.Removed = true;
        if ((b == null)) {
            let tmpZ: number = Z;
            Z = Math.Max(GetZ(coneSide.start), (Z - 0.01));
            // we need to return to the past a little bit when the order was still correc
            this.coneSideComparer.SetOperand(coneSide);
            #if (TEST_MSAGL)
            b = // TODO: Warning!!!! NULL EXPRESSION DETECTED...
            ;
            this.rightConeSides.Remove(coneSide);
            Z = tmpZ;
            #if (TEST_MSAGL)
            if ((b == null)) {
                this.PrintOutRightSegTree();
                this.ShowRightTree(CurveFactory.CreateDiamond(3, 4, coneSide.start));
                let gg: GeometryGraph = LineSweeperForPortLocations.CreateGraphFromObstacles(Obstacles);
                GeometryGraphWriter.Write(gg, "c:\    mp\bug1");
            }
            
            #endif
        }
        
        Assert.assert((b != null));
    }
    
    RemoveSegFromLeftTree(coneSide: ConeSide) {
        Assert.assert((coneSide.Removed == false));
        coneSide.Removed = true;
        this.coneSideComparer.SetOperand(coneSide);
        let b: RBNode<ConeSide> = this.leftConeSides.Remove(coneSide);
        if ((b == null)) {
            let tmpZ: number = Z;
            Z = Math.Max(GetZ(coneSide.start), (Z - 0.01));
            this.coneSideComparer.SetOperand(coneSide);
            #if (TEST_MSAGL)
            b = // TODO: Warning!!!! NULL EXPRESSION DETECTED...
            ;
            this.leftConeSides.Remove(coneSide);
            Z = tmpZ;
            #if (TEST_MSAGL)
            if ((b == null)) {
                this.PrintOutLeftSegTree();
                this.ShowLeftTree(new Ellipse(2, 2, coneSide.start));
            }
            
            #endif
        }
        
        Assert.assert((b != null));
    }
    
    // 
    //  <
    FixConeRightSideIntersections(obstSideStartVertex: PolylinePoint, obstSideEndVertex: PolylinePoint, rbNode: RBNode<ConeSide>) {
        if ((rbNode != null)) {
            let intersection: Point;
            let seg = (<ConeRightSide>(rbNode.Item));
            if (((seg != null) 
                        && Point.IntervalIntersectsRay(obstSideStartVertex.point, obstSideEndVertex.point, seg.start, seg.Direction, /* out */intersection))) {
                this.EnqueueEvent(this.CreateRightIntersectionEvent(seg, intersection, obstSideEndVertex));
            }
            
        }
        
    }
    
    LookForIntersectionWithConeLeftSide(leftNode: RBNode<ConeSide>) {
        // Show(new Ellipse(1, 1, leftNode.item.start));
        let coneLeftSide = (<ConeLeftSide>(leftNode.Item));
        if ((coneLeftSide != null)) {
            // leftNode = leftSegmentTree.TreePredecessor(leftNode);
            // if (leftNode != null) {
            //     var seg = leftNode.item as ObstacleSideSegment;
            //     if (seg != null)
            //         TryIntersectionOfConeLeftSideAndObstacleConeSide(coneLeftSide, seg);
            // }
            let rightObstacleSide: RightObstacleSide = FindFirstObstacleSideToTheLeftOfPoint(coneLeftSide.start);
            if ((rightObstacleSide != null)) {
                this.TryIntersectionOfConeLeftSideAndObstacleSide(coneLeftSide, rightObstacleSide);
            }
            
        }
        else {
            let seg = (<BrokenConeSide>(leftNode.Item));
            leftNode = this.leftConeSides.next(leftNode);
            if ((leftNode != null)) {
                coneLeftSide = (<ConeLeftSide>(leftNode.Item));
                if ((coneLeftSide != null)) {
                    this.TryIntersectionOfConeLeftSideAndObstacleConeSide(coneLeftSide, seg);
                }
                
            }
            
        }
        
    }
    
    LookForIntersectionWithConeRightSide(rightNode: RBNode<ConeSide>) {
        // Show(new Ellipse(10, 5, rightNode.item.start));
        let coneRightSide = (<ConeRightSide>(rightNode.Item));
        if ((coneRightSide != null)) {
            // rightNode = rightSegmentTree.TreeSuccessor(rightNode);
            // if (rightNode != null) {
            //     var seg = rightNode.item as ObstacleSideSegment;
            //     if (seg != null)
            //         TryIntersectionOfConeRightSideAndObstacleConeSide(coneRightSide, seg);
            // }
            let leftObstacleSide: LeftObstacleSide = FindFirstObstacleSideToToTheRightOfPoint(coneRightSide.start);
            if ((leftObstacleSide != null)) {
                this.TryIntersectionOfConeRightSideAndObstacleSide(coneRightSide, leftObstacleSide);
            }
            
        }
        else {
            let seg = (<BrokenConeSide>(rightNode.Item));
            rightNode = this.rightConeSides.Previous(rightNode);
            if ((rightNode != null)) {
                coneRightSide = (<ConeRightSide>(rightNode.Item));
                if ((coneRightSide != null)) {
                    this.TryIntersectionOfConeRightSideAndObstacleConeSide(coneRightSide, seg);
                }
                
            }
            
        }
        
    }
    
    TryIntersectionOfConeRightSideAndObstacleConeSide(coneRightSide: ConeRightSide, seg: BrokenConeSide) {
        let x: Point;
        if (Point.IntervalIntersectsRay(seg.start, seg.End, coneRightSide.start, coneRightSide.Direction, /* out */x)) {
            this.EnqueueEvent(this.CreateRightIntersectionEvent(coneRightSide, x, seg.EndVertex));
            // Show(CurveFactory.CreateDiamond(3, 3, x));
        }
        
    }
    
    TryIntersectionOfConeRightSideAndObstacleSide(coneRightSide: ConeRightSide, side: ObstacleSide) {
        let x: Point;
        if (Point.IntervalIntersectsRay(side.start, side.End, coneRightSide.start, coneRightSide.Direction, /* out */x)) {
            this.EnqueueEvent(this.CreateRightIntersectionEvent(coneRightSide, x, side.EndVertex));
            // Show(CurveFactory.CreateDiamond(3, 3, x));
        }
        
    }
    
    TryIntersectionOfConeLeftSideAndObstacleConeSide(coneLeftSide: ConeLeftSide, seg: BrokenConeSide) {
        let x: Point;
        if (Point.IntervalIntersectsRay(seg.start, seg.End, coneLeftSide.start, coneLeftSide.Direction, /* out */x)) {
            this.EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, x, seg.EndVertex));
            // Show(CurveFactory.CreateDiamond(3, 3, x));
        }
        
    }
    
    TryIntersectionOfConeLeftSideAndObstacleSide(coneLeftSide: ConeLeftSide, side: ObstacleSide) {
        let x: Point;
        if (Point.IntervalIntersectsRay(side.start, side.End, coneLeftSide.start, coneLeftSide.Direction, /* out */x)) {
            this.EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, x, side.EndVertex));
            //     Show(CurveFactory.CreateDiamond(3, 3, x));
        }
        
    }
    
    //         static int count;
    GoOverConesSeeingVertexEvent(vertexEvent: SweepEvent) {
        let rbNode: RBNode<ConeSide> = this.FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(vertexEvent);
        if ((rbNode == null)) {
            return;
        }
        
        let coneRightSide: ConeSide = rbNode.Item;
        let cone: Cone = coneRightSide.Cone;
        let leftConeSide: ConeSide = cone.LeftSide;
        if (LineSweeperForPortLocations.VertexIsToTheLeftOfSegment(vertexEvent, leftConeSide)) {
            return;
        }
        
        let visibleCones = [][
                cone];
        this.coneSideComparer.SetOperand(leftConeSide);
        rbNode = this.leftConeSides.Find(leftConeSide);
        if ((rbNode == null)) {
            let tmpZ: number = Z;
            Z = Math.Max(GetZ(leftConeSide.start), PreviousZ);
            // we need to return to the past when the order was still correct
            this.coneSideComparer.SetOperand(leftConeSide);
            rbNode = this.leftConeSides.Find(leftConeSide);
            Z = tmpZ;
            #if (TEST_MSAGL)
            if ((rbNode == null)) {
                // GeometryGraph gg = CreateGraphFromObstacles();
                // gg.Save("c:\\tmp\\bug");
                this.PrintOutLeftSegTree();
                System.Diagnostics.Debug.WriteLine(leftConeSide);
                this.ShowLeftTree(new Ellipse(3, 3, vertexEvent.Site));
                this.ShowRightTree(new Ellipse(3, 3, vertexEvent.Site));
            }
            
            #endif
        }
        
        rbNode = this.leftConeSides.next(rbNode);
        while (((rbNode != null) 
                    && !LineSweeperForPortLocations.VertexIsToTheLeftOfSegment(vertexEvent, rbNode.Item))) {
            visibleCones.Add(rbNode.Item.Cone);
            rbNode = this.leftConeSides.next(rbNode);
        }
        
        // Show(new Ellipse(1, 1, vertexEvent.Site));
        for (let c: Cone in of) {
            visibleCones;
        }
        
        this.addEdge(c.Apex, vertexEvent.Site);
        this.RemoveCone(c);
    }
    
    addEdge(a: Point, b: Point) {
        Assert.assert(this.PortLocations.Contains(a));
        let ab: VisibilityEdge = this.visibilityGraph.addEdge(a, b);
        let av: VisibilityVertex = ab.Source;
        Assert.assert(((av.point == a) 
                        && (ab.TargetPoint == b)));
        // all edges adjacent to a which are different from ab
        let edgesToFix: VisibilityEdge[] = av.InEdges.Where(() => {  }, (e != ab)).Concat(av.OutEdges.Where(() => {  }, (e != ab))).ToArray();
        for (let edge: VisibilityEdge in of) {
            edgesToFix;
        }
        
        let c: Point = edge.Source.point;
        // TODO: Warning!!!, inline IF is not supported ?
        (edge.Target == av);
        edge.Target;
        VisibilityGraph.RemoveEdge(edge);
        this.visibilityGraph.addEdge(c, b);
    }
    
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1305:SpecifyIFormatProvider", MessageId="System.Int32.ToString")
    static CreateGraphFromObstacles(obstacles: IEnumerable<Polyline>): GeometryGraph {
        let gg = new GeometryGraph();
        for (let ob in of) {
            obstacles;
        }
        
        gg.Nodes.Add(new Node(ob.ToCurve()));
        return gg;
    }
    
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId="System.Diagnostics.Debug.WriteLine(System.String)")
    PrintOutLeftSegTree() {
        System.Diagnostics.Debug.WriteLine("Left cone segments");
        for (let t in of) {
            this.leftConeSides;
        }
        
        System.Diagnostics.Debug.WriteLine(t);
        System.Diagnostics.Debug.WriteLine("end of left cone segments");
    }
    
    static VertexIsToTheLeftOfSegment(vertexEvent: SweepEvent, seg: ConeSide): boolean {
        return (Point.getTriangleOrientation(seg.start, (seg.start + seg.Direction), vertexEvent.Site) == TriangleOrientation.Counterclockwise);
    }
    
    static VertexIsToTheRightOfSegment(vertexEvent: SweepEvent, seg: ConeSide): boolean {
        return (Point.getTriangleOrientation(seg.start, (seg.start + seg.Direction), vertexEvent.Site) == TriangleOrientation.Clockwise);
    }
    
    FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(vertexEvent: SweepEvent): RBNode<ConeSide> {
        return this.rightConeSides.FindFirst(() => {  }, !LineSweeperForPortLocations.VertexIsToTheRightOfSegment(vertexEvent, s));
    }
    
    EnqueueEvent(vertexEvent: RightVertexEvent) {
        if (((SweepDirection 
                    * (vertexEvent.Site - vertexEvent.Vertex.PrevOnPolyline.point)) 
                    > ApproximateComparer.Tolerance)) {
            return;
        }
        
        // otherwise we enqueue the vertex twice; once as a LeftVertexEvent and once as a RightVertexEvent
        super.EnqueueEvent(vertexEvent);
    }
}