    

    //  the router between nodes

import { IEnumerable, from, InvalidOperationException } from "linq-to-typescript";
import { ICurve, Rectangle, Point, CurveFactory } from "..";
import { CurvePort } from "../layout/core/curvePort";
import { EdgeGeometry } from "../layout/core/edgeGeometry";
import { FloatingPort } from "../layout/core/floatingPort";
import { HookUpAnywhereFromInsidePort } from "../layout/core/hookUpAnywhereFromInsidePort";
import { Polyline, LineSegment, Curve, PointLocation, GeomConstants } from "../math/geometry";
import { DebugCurve } from "../math/geometry/debugCurve";
import { Ellipse } from "../math/geometry/ellipse";
import { IntersectionInfo } from "../math/geometry/intersectionInfo";
import { TriangleOrientation } from "../math/geometry/point";
import { PolylinePoint } from "../math/geometry/polylinePoint";
import { HitTestBehavior } from "../math/geometry/RTree/HitTestBehavior";
import { RectangleNode } from "../math/geometry/RTree/RectangleNode";
import { SmoothedPolyline } from "../math/geometry/smoothedPolyline";
import { InteractiveObstacleCalculator } from "./interactiveObstacleCalculator";
import { SingleSourceMultipleTargetsShortestPathOnVisibilityGraph } from "./SingleSourceMultipleTargetsShortestPathOnVisibilityGraph";
import { SingleSourceSingleTargetShortestPathOnVisibilityGraph } from "./SingleSourceSingleTargetShortestPathOnVisibilityGraph";
import { ConeSpanner } from "./spline/coneSpanner/ConeSpanner";
import { Polygon } from "./visibility/Polygon";
import { TollFreeVisibilityEdge } from "./visibility/TollFreeVisibilityEdge";
import { VisibilityGraph } from "./visibility/VisibilityGraph";
import { VisibilityKind } from "./visibility/VisibilityKind";
import { VisibilityVertex } from "./visibility/VisibilityVertex";
import { Algorithm } from "../utils/algorithm";
import { Port } from "../layout/core/port";
import { InteractiveTangentVisibilityGraphCalculator } from "./visibility/InteractiveTangentVisibilityGraphCalculator";
import { AddRange } from "../utils/setOperations";
import { PointVisibilityCalculator } from "./visibility/PointVisibilityCalculator";
import { Assert } from "../utils/assert";
import { RelaxedPolylinePoint } from "./RelaxedPolylinePoint";
    
export class InteractiveEdgeRouter extends Algorithm {
        
           
        //  the obstacles for routing
      obstacles_:Array<ICurve>
  targetVisibilityVertex: VisibilityVertex
        get Obstacles(): Array<ICurve> {
          return this.obstacles_
        }
        set Obstacles(value: Array<ICurve>)  {
          this.obstacles_=value
        }
        

        //  the minimum angle between a node boundary curve and and an edge 
        //  curve at the place where the edge curve intersects the node boundary
        enteringAngleBound_: number;
        get EnteringAngleBound(): number {
          return this.enteringAngleBound_
        }
        set EnteringAngleBound(value: number)  {
          this.enteringAngleBound_=value
        }
        
        _sourceTightPolyline: Polyline;
        
        get SourceTightPolyline(): Polyline {
            return this._sourceTightPolyline;
        }
        set SourceTightPolyline(value: Polyline)  {
            this._sourceTightPolyline = value;
        }
        

         

        SourceLoosePolyline: Polyline
        targetTightPolyline: Polyline;
        

        

        get TargetTightPolyline(): Polyline {
            return this.targetTightPolyline;
        }
        set TargetTightPolyline(value: Polyline)  {
            this.targetTightPolyline = value;
        }
        
        targetLoosePolyline: Polyline;
        
        get TargetLoosePolyline(): Polyline {
            return this.targetLoosePolyline;
        }
        set TargetLoosePolyline(value: Polyline)  {
            this.targetLoosePolyline = value;
        }
        
        // RectangleNode<Polyline, Point> RootOfTightHierarchy {
        //     get { return this.obstacleCalculator.RootOfTightHierararchy; }
        // }
        activeRectangle: Rectangle = Rectangle.mkEmpty();
        
        visibilityGraph: VisibilityGraph;
        
         get VisibilityGraph(): VisibilityGraph {
            return this.visibilityGraph;
        }
         set VisibilityGraph(value: VisibilityGraph)  {
            this.visibilityGraph = value;
        }
        
        // Array<Polyline> activeTightPolylines = new Array<Polyline>();
        activePolygons: Array<Polygon> = new Array<Polygon>();
        
        alreadyAddedOrExcludedPolylines: Set<Polyline> = new Set<Polyline>();
        
        //     Dictionary<Point, Polyline> pointsToObstacles = new Dicitonary<Point, Polyline>();
        sourcePort: Port;
        

        //  the port of the edge start

        get SourcePort(): Port {
            return this.sourcePort;
        }
        set SourcePort(value: Port)  {
            this.sourcePort = value;
            if ((this.sourcePort != null)) {
                this.SourceTightPolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.sourcePort.Location, 
                  this.ObstacleCalculator.RootOfTightHierarchy);
                if ((this.sourcePort instanceof  FloatingPort)) {
                    this.alreadyAddedOrExcludedPolylines.add(this.SourceLoosePolyline);
                    // we need to exclude the loose polyline around the source port from the tangent visibily graph
                    this.StartPointOfEdgeRouting = this.SourcePort.Location;
                }
                else {
                    let bp = (<CurvePort>(this.sourcePort));
                    this.StartPointOfEdgeRouting = this.TakeBoundaryPortOutsideOfItsLoosePolyline(bp.Curve, bp.Parameter, this.SourceLoosePolyline);
                }
                
            }
            
        }
        
        targetPort: Port;
        

        //  the port of the edge end

        get TargetPort(): Port {
            return this.targetPort;
        }
        set TargetPort(value: Port)  {
            this.targetPort = value;
        }
        

        //  the curve should not come closer than Padding to the nodes

        TightPadding: number
        
        loosePadding: number;
        

        //  we further pad each node but not more than LoosePadding.

        get LoosePadding(): number {
            return this.loosePadding;
        }
        set LoosePadding(value: number)  {
            this.loosePadding = value;
            if ((this.ObstacleCalculator != null)) {
                this.ObstacleCalculator.LoosePadding = value;
            }
            
        }
        
        _sourceVisibilityVertex: VisibilityVertex;
        
        get SourceVisibilityVertex(): VisibilityVertex {
            return this._sourceVisibilityVertex;
        }

        _polyline: Polyline;


    OffsetForPolylineRelaxing: number
    

    //  The expected number of progress steps this algorithm will take.

    ExpectedProgressSteps: number

    targetIsInsideOfSourceTightPolyline: boolean;
    
    sourceIsInsideOfTargetTightPolyline: boolean;
    
     UseEdgeLengthMultiplier: boolean;
    

    //  if set to true the algorithm will try to shortcut a shortest polyline inner points

     UseInnerPolylingShortcutting: boolean = true;
    

    //  if set to true the algorithm will try to shortcut a shortest polyline start and end

     UsePolylineEndShortcutting: boolean = true;
    
     AllowedShootingStraightLines: boolean = true;
    
    startPointOfRouting_:Point
    get StartPointOfEdgeRouting(): Point {
      return this.startPointOfRouting_
    }
    set StartPointOfEdgeRouting(value: Point)  {
      this.startPointOfRouting_= value
    }
    
    ExtendVisibilityGraphToLocation(location: Point) {
        if ((this.VisibilityGraph == null)) {
           this.VisibilityGraph = new VisibilityGraph();
        }
        
        let addedPolygons: Array<Polygon> = null;
        if (!this.activeRectangle.contains(location)) {
            if (this.activeRectangle.isEmpty) {
                this.activeRectangle = Rectangle.mkPP(this.SourcePort.Location, location);
            }
            else {
                this.activeRectangle.add(location);
            }
            
            addedPolygons = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
            for (const polygon of addedPolygons) {
               this.VisibilityGraph.AddHole(polygon.Polyline);
            }
            
        }
        
        if (((addedPolygons == null) 
                    || (addedPolygons.length == 0))) {
            if ((this.targetVisibilityVertex != null)) {
                this.VisibilityGraph.RemoveVertex(this.targetVisibilityVertex);
            }
            
            this.CalculateEdgeTargetVisibilityGraph(location);
        }
        else {
            this.RemovePointVisibilityGraphs();
            let visibilityGraphGenerator = new InteractiveTangentVisibilityGraphCalculator(addedPolygons, 
              this.activePolygons, this.VisibilityGraph);
            visibilityGraphGenerator.run();
            AddRange(this.activePolygons,addedPolygons);
            this.CalculateEdgeTargetVisibilityGraph(location);
            this.CalculateSourcePortVisibilityGraph();
        }
        
    }
    
    RemovePointVisibilityGraphs() {
        if ((this.targetVisibilityVertex != null)) {
            this.VisibilityGraph.RemoveVertex(this.targetVisibilityVertex);
        }
        
        if ((this._sourceVisibilityVertex != null)) {
            this.VisibilityGraph.RemoveVertex(this._sourceVisibilityVertex);
        }
        
    }
    
    CalculateEdgeTargetVisibilityGraph(location: Point) {
        this.targetVisibilityVertex=PointVisibilityCalculator.CalculatePointVisibilityGraph(
         from(this.GetActivePolylines()), this.VisibilityGraph, location, VisibilityKind.Tangent);
    }
    
    CalculateSourcePortVisibilityGraph() {
        this._sourceVisibilityVertex=PointVisibilityCalculator.CalculatePointVisibilityGraph(from(
          this.GetActivePolylines()), this.VisibilityGraph, this.StartPointOfEdgeRouting, VisibilityKind.Tangent);
    }
    
    TakeBoundaryPortOutsideOfItsLoosePolyline(nodeBoundary: ICurve, parameter: number, loosePolyline: Polyline): Point {
        let location: Point = nodeBoundary.value(parameter)
        let tangent: Point = 
        (nodeBoundary.leftDerivative(parameter).normalize().add(nodeBoundary.rightDerivative(parameter).normalize())).normalize();
        if (Point.getTriangleOrientation(InteractiveEdgeRouter.PointInsideOfConvexCurve(nodeBoundary),
         location, 
        location.add(tangent)) == TriangleOrientation.Counterclockwise) {
            tangent  = tangent.mul(-1);
        }
        
        tangent = tangent.rotate((Math.PI / 2));
        let len: number = loosePolyline.boundingBox.diagonal;
        let ls = LineSegment.mkPP(location, (location.add(tangent.mul(len))));
        let p: Point = Curve.intersectionOne(ls, loosePolyline, false).x
        let del: Point = tangent.mul(p.sub(location).length / 2);
        // Point del = tangent * this.OffsetForPolylineRelaxing * 2;
        while (true) {
            ls = LineSegment.mkPP(location, (p.add(del)));
            let foundIntersectionsOutsideOfSource: boolean = false;
            for (const ii of InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.ObstacleCalculator.RootOfLooseHierarchy)) {
                if ((ii.seg1 != loosePolyline)) {
                    del = del.div(1.5)
                    foundIntersectionsOutsideOfSource = true;
                    break;
                }
                
            }
            
            if (!foundIntersectionsOutsideOfSource) {
                break;
            }
            
        }
        
        return ls.end;
    }
    
    static PointInsideOfConvexCurve(nodeBoundary: ICurve): Point {
        return (nodeBoundary.value(0).add(nodeBoundary.value(1.5)).div(2));
        // a hack !!!!!!!!!!!!!!!!!!!!!!
    }
    
    // Point TakeSourcePortOutsideOfLoosePolyline() {
    //     CurvePort bp = SourcePort as CurvePort;
    //     ICurve nodeBoundary = bp.Node.BoundaryCurve;
    //     Point location = bp.Location;
    //     Point tangent = (nodeBoundary.LeftDerivative(bp.Parameter).Normalize() + nodeBoundary.RightDerivative(bp.Parameter).Normalize()).Normalize();
    //     if (Point.GetTriangleOrientation(bp.Node.Center, location, location + tangent) == TriangleOrientation.Counterclockwise)
    //         tangent = -tangent;
    //     tangent = tangent.Rotate(Math.PI / 2);
    //     double len = this.sourceLoosePolyline.BoundingBox.Diagonal;
    //     Point portLocation = bp.Location;
    //     LineSegment ls = new LineSegment(portLocation, portLocation + len * tangent);
    //     Point p = Curve.GetAllIntersections(ls, this.SourceLoosePolyline, false)[0].IntersectionPoint;
    //     Point del = tangent * this.OffsetForPolylineRelaxing * 2;
    //     while (true) {
    //         ls = new LineSegment(portLocation, p + del);
    //         bool foundIntersectionsOutsideOfSource = false;
    //         foreach (IntersectionInfo ii in IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.obstacleCalculator.RootOfLooseHierarchy))
    //             if (ii.Segment1 != this.SourceLoosePolyline) {
    //                 del /= 1.5;
    //                 foundIntersectionsOutsideOfSource = true;
    //                 break;
    //             }
    //         if (!foundIntersectionsOutsideOfSource)
    //             break;
    //     }
    //     return ls.End;
    // }
    *GetActivePolylines(): IterableIterator<Polyline> {
        for (const polygon of this.activePolygons) {
            yield polygon.Polyline;
    }
  }
    
    GetAddedPolygonesAndMaybeExtendActiveRectangle(): Array<Polygon> {
        const rect: Rectangle = this.activeRectangle;
       const addedPolygones = new Array<Polygon>();
        let added: boolean;
        for (
        ; added; 
        ) {
            added = false;
            for (let loosePoly of this.ObstacleCalculator.RootOfLooseHierarchy.GetNodeItemsIntersectingRectangle(this.activeRectangle)) {
                if (!this.alreadyAddedOrExcludedPolylines.has(loosePoly)) {
                    rect.addRec(loosePoly.boundingBox);
                    addedPolygones.push(new Polygon(loosePoly));
                    this.alreadyAddedOrExcludedPolylines.add(loosePoly);
                    // we register the loose polyline in the set to not add it twice
                    added = true;
                }
                
            }
            
            if (added) {
                this.activeRectangle = rect;
            }
            
        }
        
        return addedPolygones;
    }
    
    RelaxPolyline() {
        let relaxedPolylinePoint= InteractiveEdgeRouter.CreateRelaxedPolylinePoints(this._polyline);
        for (relaxedPolylinePoint = relaxedPolylinePoint.Next; (relaxedPolylinePoint.Next != null); relaxedPolylinePoint = relaxedPolylinePoint.Next) {
            this.RelaxPolylinePoint(relaxedPolylinePoint);
        }
        
    }
    
    static CreateRelaxedPolylinePoints(polyline: Polyline): RelaxedPolylinePoint {
        let p: PolylinePoint = polyline.startPoint;
        let ret = new RelaxedPolylinePoint(p, p.point);
        let currentRelaxed: RelaxedPolylinePoint = ret;
        while ((p.next != null)) {
            p = p.next;
            let r = new RelaxedPolylinePoint(p, p.point);
            currentRelaxed.Next = r;
            currentRelaxed = r;
        }
        
        return ret;
    }
    
    RelaxPolylinePoint(relaxedPoint: RelaxedPolylinePoint) {
        if (((relaxedPoint.PolylinePoint.prev.prev == null) 
                    && this.SourcePort instanceof  CurvePort 
                    && (relaxedPoint.PolylinePoint.polyline != this.SourceLoosePolyline))) {
            return;
        }
        
        if ((((relaxedPoint.PolylinePoint.next.next == null) 
                    && this.TargetPort instanceof  CurvePort 
                    && relaxedPoint.PolylinePoint.polyline != this.TargetLoosePolyline))) {
            return;
        }
        
        for (let d: number = this.OffsetForPolylineRelaxing; ((d > GeomConstants.distanceEpsilon) 
                    && !this.RelaxWithGivenOffset(d, relaxedPoint)); 
        ) {
            
        }
        
    }
    
    RelaxWithGivenOffset(offset: number, relaxedPoint: RelaxedPolylinePoint): boolean {
        Assert.assert((offset > ApproximateComparer.DistanceEpsilon));
        // otherwise we are cycling infinitely here
        InteractiveEdgeRouter.SetRelaxedPointLocation(offset, relaxedPoint);
        if (this.StickingSegmentDoesNotIntersectTightObstacles(relaxedPoint)) {
            return true;
        }
        
        InteractiveEdgeRouter.PullCloserRelaxedPoint(relaxedPoint.Prev);
        return false;
    }
    
    static PullCloserRelaxedPoint(relaxedPolylinePoint: RelaxedPolylinePoint) {
        relaxedPolylinePoint.PolylinePoint.point = ((0.2 * relaxedPolylinePoint.OriginalPosition) + (0.8 * relaxedPolylinePoint.PolylinePoint.point));
    }
    
    StickingSegmentDoesNotIntersectTightObstacles(relaxedPoint: RelaxedPolylinePoint): boolean {
        return (!this.PolylineSegmentIntersectsTightHierarchy(relaxedPoint.PolylinePoint.point, relaxedPoint.Prev.PolylinePoint.point) 
                    && ((relaxedPoint.Next == null) 
                    || !this.PolylineSegmentIntersectsTightHierarchy(relaxedPoint.PolylinePoint.point, relaxedPoint.Next.PolylinePoint.point)));
    }
    
    PolylineSegmentIntersectsTightHierarchy(a: Point, b: Point): boolean {
        return this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(a, b, this.ObstacleCalculator.RootOfTightHierarchy);
    }
    
    PolylineIntersectsPolyRectangleNodeOfTightHierarchy(a: Point, b: Point, rect: RectangleNode<Polyline, Point>): boolean {
        return this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(new LineSegment(a, b), rect);
    }
    
    PolylineIntersectsPolyRectangleNodeOfTightHierarchy(ls: LineSegment, rect: RectangleNode<Polyline, Point>): boolean {
        if (!ls.boundingBox.intersects((<Rectangle>(rect.Rectangle)))) {
            return false;
        }
        
        if ((rect.UserData != null)) {
            for (let ii of Curve.getAllIntersections(ls, rect.UserData, false)) {
                if (((ii.Segment1 != this.SourceTightPolyline) 
                            && (ii.Segment1 != this.TargetTightPolyline))) {
                    return true;
                }
                
                if ((((ii.Segment1 == this.SourceTightPolyline) 
                            && this.SourcePort) instanceof  CurvePort)) {
                    return true;
                }
                
                if ((((ii.Segment1 == this.TargetTightPolyline) 
                            && this.TargetPort) instanceof  CurvePort)) {
                    return true;
                }
                
            }
            
            return false;
        }
        
        return (this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(ls, rect.Left) || this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(ls, rect.Right));
    }
    
     static IntersectionsOfLineAndRectangleNodeOverPolyline(ls: LineSegment, rectNode: RectangleNode<Polyline, Point>): Array<IntersectionInfo> {
        let ret = new Array<IntersectionInfo>();
        InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, rectNode, ret);
        return ret;
    }
    
    static IntersectionsOfLineAndRectangleNodeOverPolyline(ls: LineSegment, rectNode: RectangleNode<Polyline, Point>, listOfIntersections: Array<IntersectionInfo>) {
        if ((rectNode == null)) {
            return;
        }
        
        if (!ls.boundingBox.intersects((<Rectangle>(rectNode.Rectangle)))) {
            return;
        }
        
        if ((rectNode.UserData != null)) {
            listOfIntersections.AddRange(Curve.getAllIntersections(ls, rectNode.UserData, true));
            return;
        }
        
        InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, rectNode.Left, listOfIntersections);
        InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, rectNode.Right, listOfIntersections);
    }
    
    LineCanBeAcceptedForRouting(ls: LineSegment): boolean {
        let sourceIsFloating: boolean = (this.SourcePort instanceof  FloatingPort);
        let targetIsFloating: boolean = (this.TargetPort instanceof  FloatingPort);
        if ((!sourceIsFloating 
                    && !this.targetIsInsideOfSourceTightPolyline)) {
            if (!this.InsideOfTheAllowedConeOfBoundaryPort(ls.end, (<CurvePort>(this.SourcePort)))) {
                return false;
            }
            
        }
        
        if ((!targetIsFloating 
                    && ((this.TargetPort != null) 
                    && !this.sourceIsInsideOfTargetTightPolyline))) {
            if (!this.InsideOfTheAllowedConeOfBoundaryPort(ls.start, (<CurvePort>(this.TargetPort)))) {
                return false;
            }
            
        }
        
        let xx: Array<IntersectionInfo> = InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.ObstacleCalculator.RootOfTightHierarchy);
        for (let ii of xx) {
            if ((ii.Segment1 == this.SourceTightPolyline)) {
                // TODO: Warning!!! continue If
            }
            
            if ((ii.Segment1 == this.targetTightPolyline)) {
                // TODO: Warning!!! continue If
            }
            
            return false;
        }
        
        return true;
    }
    
    InsideOfTheAllowedConeOfBoundaryPort(pointToTest: Point, port: CurvePort): boolean {
        let boundaryCurve: ICurve = port.Curve;
        let curveIsClockwise: boolean = InteractiveObstacleCalculator.CurveIsClockwise(boundaryCurve, InteractiveEdgeRouter.PointInsideOfConvexCurve(boundaryCurve));
        let portLocation: Point = port.Location;
        let pointOnTheRightConeSide: Point = this.GetPointOnTheRightBoundaryPortConeSide(portLocation, boundaryCurve, curveIsClockwise, port.Parameter);
        let pointOnTheLeftConeSide: Point = this.GetPointOnTheLeftBoundaryPortConeSide(portLocation, boundaryCurve, curveIsClockwise, port.Parameter);
        return ((Point.getTriangleOrientation(portLocation, pointOnTheRightConeSide, pointToTest) != TriangleOrientation.Clockwise) 
                    && (Point.getTriangleOrientation(portLocation, pointToTest, pointOnTheLeftConeSide) != TriangleOrientation.Clockwise));
    }
    
    GetPointOnTheRightBoundaryPortConeSide(portLocation: Point, boundaryCurve: ICurve, curveIsClockwise: boolean, portParam: number): Point {
        let tan: Point = boundaryCurve.rightDerivative(portParam);
        // TODO: Warning!!!, inline IF is not supported ?
        curveIsClockwise;
        (boundaryCurve.leftDerivative(portParam) * -1);
        return (portLocation + tan.rotate(this.EnteringAngleBound));
    }
    
    GetPointOnTheLeftBoundaryPortConeSide(portLocation: Point, boundaryCurve: ICurve, curveIsClockwise: boolean, portParam: number): Point {
        let tan: Point = (boundaryCurve.leftDerivative(portParam) * -1);
        // TODO: Warning!!!, inline IF is not supported ?
        curveIsClockwise;
        boundaryCurve.rightDerivative(portParam);
        return (portLocation + tan.rotate((this.EnteringAngleBound * -1)));
    }
    
    static SetRelaxedPointLocation(offset: number, relaxedPoint: RelaxedPolylinePoint) {
        let leftTurn: boolean = (Point.getTriangleOrientation(relaxedPoint.Next.OriginalPosition, relaxedPoint.OriginalPosition, relaxedPoint.Prev.OriginalPosition) == TriangleOrientation.Counterclockwise);
        let v: Point = ((((relaxedPoint.Next.OriginalPosition - relaxedPoint.Prev.OriginalPosition)).Normalize() * offset)).Rotate((Math.PI / 2));
        if (!leftTurn) {
            v = (v * -1);
        }
        
        relaxedPoint.PolylinePoint.point = (relaxedPoint.OriginalPosition + v);
    }
    
     ShowPolylineAndObstacles(params curves: ICurve[]) {
        //  ReSharper restore UnusedMember.Local
        let ls: IEnumerable<DebugCurve> = this.GetDebugCurves(curves);
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(ls);
    }
    
    @SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    GetDebugCurves(params curves: ICurve[]): IEnumerable<DebugCurve> {
        let ls = this.CreateListWithObstaclesAndPolyline(curves);
        // ls.AddRange(this.VisibilityGraph.Edges.Select(e => new DebugCurve(100,0.1, e is TollFreeVisibilityEdge?"red":"green", new LineSegment(e.SourcePoint, e.TargetPoint))));
        if ((this._sourceVisibilityVertex != null)) {
            ls.Add(new DebugCurve("red", CurveFactory.CreateDiamond(4, 4, this._sourceVisibilityVertex.point)));
        }
        
        if ((targetVisibilityVertex != null)) {
            ls.Add(new DebugCurve("purple", new Ellipse(4, 4, targetVisibilityVertex.Point)));
        }
        
        let anywerePort = (<HookUpAnywhereFromInsidePort>(this.targetPort));
        if ((anywerePort != null)) {
            ls.Add(new DebugCurve("purple", anywerePort.LoosePolyline));
        }
        
        return ls;
    }
    
    @SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    CreateListWithObstaclesAndPolyline(params curves: ICurve[]): Array<DebugCurve> {
        let ls = new Array<DebugCurve>(this.ObstacleCalculator.RootOfLooseHierarchy.GetAllLeaves().select(() => {  }, new DebugCurve(100, 0.01, "green", e)));
        ls.AddRange(curves.Select(() => {  }, new DebugCurve(100, 0.01, "red", c)));
        ls.AddRange(this.ObstacleCalculator.RootOfTightHierarchy.GetAllLeaves().select(() => {  }, new DebugCurve(100, 0.01, "blue", e)));
        //  ls.AddRange(visibilityGraph.Edges.Select(e => (ICurve) new LineSegment(e.SourcePoint, e.TargetPoint)));
        if ((this._polyline != null)) {
            ls.Add(new DebugCurve(100, 0.03, "blue", this._polyline));
        }
        
        return ls;
    }
    

    //  smoothing the corners of the polyline

    //  <param name="edgePolyline"></param>
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="Polyline")
    SmoothCorners(edgePolyline: SmoothedPolyline) {
        ValidateArg.IsNotNull(edgePolyline, "edgePolyline");
        let a: Site = edgePolyline.headSite;
        // the corner start
        let b: Site;
        // the corner origin
        let c: Site;
        // the corner other end
        while (Curve.findCorner(a, /* out */b, /* out */c)) {
            a = this.SmoothOneCorner(a, c, b);
        }
        
    }
    
    SmoothOneCorner(a: Site, c: Site, b: Site): Site {
        if (this.CacheCorners) {
            let n: number;
            let p: number;
            if (this.FindCachedCorner(a, b, c, /* out */p, /* out */n)) {
                b.PreviousBezierSegmentFitCoefficient = p;
                b.NextBezierSegmentFitCoefficient = n;
                return b;
            }
            
        }
        
        const let mult: number = 1.5;
        const let kMin: number = 0.01;
        let k: number = 0.5;
        let seg: CubicBezierSegment;
        let v: number;
        let u: number;
        if ((a.Previous == null)) {
            // this will allow to the segment to start from site "a"
            u = 2;
            v = 1;
        }
        else if ((c.Next == null)) {
            u = 1;
            v = 2;
            // this will allow to the segment to end at site "c"
        }
        else {
            v = 1;
        }
        
        u = 1;
        for (
        ; (this.ObstacleCalculator.ObstaclesIntersectICurve(seg) 
                    && (k > kMin)); 
        ) {
            seg = Curve.createBezierSeg((k * u), (k * v), a, b, c);
            b.PreviousBezierSegmentFitCoefficient = (k * u);
            b.NextBezierSegmentFitCoefficient = (k * v);
            mult;
        }
        
        k = (k * mult);
        // that was the last k
        if (((k < 0.5) 
                    && (k > kMin))) {
            // one time try a smoother seg
            k = (0.5 
                        * (k 
                        + (k * mult)));
            seg = Curve.createBezierSeg((k * u), (k * v), a, b, c);
            if (!this.ObstacleCalculator.ObstaclesIntersectICurve(seg)) {
                b.PreviousBezierSegmentFitCoefficient = (k * u);
                b.NextBezierSegmentFitCoefficient = (k * v);
            }
            
        }
        
        if (this.CacheCorners) {
            this.CacheCorner(a, b, c);
        }
        
        return b;
    }
    
     foundCachedCorners: number;
    
    FindCachedCorner(a: Site, b: Site, c: Site, /* out */prev: number, /* out */next: number): boolean {
        let corner: Corner = new Corner(a.Point, b.Point, c.Point);
        let prevNext: Tuple<number, number>;
        if (cornerTable.TryGetValue(corner, /* out */prevNext)) {
            if ((a.Point == corner.a)) {
                prev = prevNext.Item1;
                next = prevNext.Item2;
            }
            else {
                prev = prevNext.Item2;
                next = prevNext.Item1;
            }
            
            this.foundCachedCorners++;
            return true;
        }
        
        next = 0;
        prev = 0;
        return false;
    }
    
    CacheCorner(a: Site, b: Site, c: Site) {
        cornerTable[new Corner(a.Point, b.Point, c.Point)] = new Tuple<number, number>(b.PreviousBezierSegmentFitCoefficient, b.NextBezierSegmentFitCoefficient);
    }
    

    //  is set to true will cache three points defining the corner 
    //  to avoid obstacle avoidance calculation

    get CacheCorners(): boolean {
        return cacheCorners;
    }
    set CacheCorners(value: boolean)  {
        cacheCorners = value;
        if (cacheCorners) {
            cornerTable = new Dictionary<Corner, Tuple<number, number>>();
        }
        else if ((cornerTable != null)) {
            cornerTable.Clear();
        }
        
    }
    

    //  

    //  <param name="underlyingPolyline"></param>
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="Polyline")
    TryToRemoveInflectionsAndCollinearSegments(underlyingPolyline: SmoothedPolyline) {
        ValidateArg.IsNotNull(underlyingPolyline, "underlyingPolyline");
        let progress: boolean = true;
        while (progress) {
            progress = false;
            for (let s: Site = underlyingPolyline.headSite; ((s != null) 
                        && (s.Next != null)); s = s.Next) {
                if (((s.Turn * s.Next.Turn) 
                            < 0)) {
                    progress = (this.TryToRemoveInflectionEdge(/* ref */s) || progress);
                }
                
            }
            
        }
        
    }
    
    TryToRemoveInflectionEdge(/* ref */s: Site): boolean {
        if (!this.ObstacleCalculator.ObstaclesIntersectLine(s.Previous.Point, s.Next.Point)) {
            let a: Site = s.Previous;
            // forget s
            let b: Site = s.Next;
            a.Next = b;
            b.Previous = a;
            s = a;
            return true;
        }
        
        if (!this.ObstacleCalculator.ObstaclesIntersectLine(s.Previous.Point, s.Next.Next.Point)) {
            // forget about s and s.Next
            let a: Site = s.Previous;
            let b: Site = s.Next.Next;
            a.Next = b;
            b.Previous = a;
            s = a;
            return true;
        }
        
        if (!this.ObstacleCalculator.ObstaclesIntersectLine(s.Point, s.Next.Next.Point)) {
            // forget about s.Next
            let b: Site = s.Next.Next;
            s.Next = b;
            b.Previous = s;
            return true;
        }
        
        return false;
    }
    
    // internal Point TargetPoint {
    //     get {
    //         CurvePort tp = this.TargetPort as CurvePort;
    //         if (tp != null)
    //             return this.Target.BoundaryCurve[tp.Parameter];
    //         else
    //             return (this.TargetPort as FloatingPort).Location;
    //     }
    // }
    // internal Point SourcePoint {
    //     get {
    //         CurvePort sp = this.SourcePort as CurvePort;
    //         if (sp != null)
    //             return this.Source.BoundaryCurve[sp.Parameter];
    //         else
    //             return (this.SourcePort as FloatingPort).Location;
    //     }
    // }
    GetShortestPolyline(sourceVisVertex: VisibilityVertex, _targetVisVertex: VisibilityVertex): Polyline {
        this.CleanTheGraphForShortestPath();
        let pathCalc = new SingleSourceSingleTargetShortestPathOnVisibilityGraph(this.visibilityGraph, sourceVisVertex, _targetVisVertex);
        let path: IEnumerable<VisibilityVertex> = pathCalc.GetPath(this.UseEdgeLengthMultiplier);
        if ((path == null)) {
            // ShowIsPassable(_sourceVisibilityVertex, _targetVisVertex);
            return null;
        }
        
        Assert.assert(((path.first() == sourceVisVertex) 
                        && (path.last() == _targetVisVertex)));
        let ret = new Polyline();
        for (let v of path) {
            ret.addPoint(v.point);
        }
        
        return InteractiveEdgeRouter.RemoveCollinearVertices(ret);
    }
    
    private ShowIsPassable(sourceVisVertex: VisibilityVertex, targetVisVertex: VisibilityVertex) {
        let dd = new Array<DebugCurve>(this.visibilityGraph.Edges.Select(() => {  }, new DebugCurve(100, 0.5, "green", new LineSegment(e.SourcePoint, e.TargetPoint))));
        // TODO: Warning!!!, inline IF is not supported ?
        ((e.IsPassable == null) 
                    || e.IsPassable());
        "red";
        if ((sourceVisVertex != null)) {
            dd.Add(new DebugCurve(CurveFactory.CreateDiamond(3, 3, sourceVisVertex.point)));
        }
        
        if ((targetVisVertex != null)) {
            dd.Add(new DebugCurve(CurveFactory.CreateEllipse(3, 3, targetVisVertex.point)));
        }
        
        if ((this.Obstacles != null)) {
            dd.AddRange(this.Obstacles.Select(() => {  }, new DebugCurve(o)));
        }
        
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dd);
    }
    
    CleanTheGraphForShortestPath() {
        this.visibilityGraph.ClearPrevEdgesTable();
    }
    
     static RemoveCollinearVertices(ret: Polyline): Polyline {
        for (let pp: PolylinePoint = ret.startPoint.next; (pp.next != null); pp = pp.next) {
            if ((Point.getTriangleOrientation(pp.prev.point, pp.point, pp.next.point) == TriangleOrientation.Collinear)) {
                pp.prev.next = pp.next;
                pp.next.prev = pp.prev;
            }
            
        }
        
        return ret;
    }
    

    //  returns true if the nodes overlap or just positioned too close

    get OverlapsDetected(): boolean {
        return this.ObstacleCalculator.OverlapsDetected;
    }
    


    get ConeSpannerAngle(): number {
    }
    set ConeSpannerAngle(value: number)  {
    }
    
     get TightHierarchy(): RectangleNode<Polyline, Point> {
        return this.ObstacleCalculator.RootOfTightHierarchy;
    }
     set TightHierarchy(value: RectangleNode<Polyline, Point>)  {
        this.ObstacleCalculator.RootOfTightHierarchy = value;
    }
    
     get LooseHierarchy(): RectangleNode<Polyline, Point> {
        return this.ObstacleCalculator.RootOfLooseHierarchy;
    }
     set LooseHierarchy(value: RectangleNode<Polyline, Point>)  {
        this.ObstacleCalculator.RootOfLooseHierarchy = value;
    }
    
     get UseSpanner(): boolean {
    }
     set UseSpanner(value: boolean)  {
    }
    
    CalculateObstacles() {
        this.ObstacleCalculator = new InteractiveObstacleCalculator(this.Obstacles, this.TightPadding, this.LoosePadding, this.IgnoreTightPadding);
        this.ObstacleCalculator.Calculate();
    }
    
    //   int count;

    // 

    //  <param name="targetLocation"></param>
    //  <returns></returns>
    RouteEdgeToLocation(targetLocation: Point): EdgeGeometry {
        this.TargetPort = new FloatingPort((<ICurve>(null)), targetLocation);
        // otherwise route edge to a port would be called
        this.TargetTightPolyline = null;
        this.TargetLoosePolyline = null;
        let edgeGeometry = new EdgeGeometry();
        let ls = new LineSegment(this.SourcePort.Location, targetLocation);
        if (this.LineCanBeAcceptedForRouting(ls)) {
            this._polyline = new Polyline();
            this._polyline.addPoint(ls.start);
            this._polyline.addPoint(ls.end);
            edgeGeometry.smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
            edgeGeometry.curve = edgeGeometry.smoothedPolyline.createCurve();
            return edgeGeometry;
        }
        
        // can we do with just two line segments?
        if ((this.SourcePort instanceof  CurvePort)) {
            ls = new LineSegment(this.StartPointOfEdgeRouting, targetLocation);
            if ((InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.ObstacleCalculator.RootOfTightHierarchy).Count == 0)) {
                this._polyline = new Polyline();
                this._polyline.addPoint(this.SourcePort.Location);
                this._polyline.addPoint(ls.start);
                this._polyline.addPoint(ls.end);
                // RelaxPolyline();
                edgeGeometry.smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
                edgeGeometry.curve = edgeGeometry.smoothedPolyline.createCurve();
                return edgeGeometry;
            }
            
        }
        
        this.ExtendVisibilityGraphToLocation(targetLocation);
        this._polyline = this.GetShortestPolyline(this.SourceVisibilityVertex, TargetVisibilityVertex);
        this.RelaxPolyline();
        if ((this.SourcePort instanceof  CurvePort)) {
            this._polyline.PrependPoint(this.SourcePort.Location);
        }
        
        edgeGeometry.smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
        edgeGeometry.curve = edgeGeometry.smoothedPolyline.createCurve();
        return edgeGeometry;
    }
    

    //  routes the edge to the port

    //  <param name="edgeTargetPort"></param>
    //  <param name="portLoosePolyline"></param>
    //  <param name="smooth"> if true will smooth the edge avoiding the obstacles, will take more time</param>
    //  <param name="smoothedPolyline"></param>
    //  <returns></returns>
    @SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId="3#")
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="Polyline")
    RouteEdgeToPort(edgeTargetPort: Port, portLoosePolyline: Polyline, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        ValidateArg.IsNotNull(edgeTargetPort, "edgeTargetToPort");
        if (!this.ObstacleCalculator.IsEmpty()) {
            this.TargetPort = edgeTargetPort;
            this.TargetTightPolyline = InteractiveEdgeRouter.GetFirstHitPolyline(edgeTargetPort.Location, this.ObstacleCalculator.RootOfTightHierarchy);
            Assert.assert((this.targetTightPolyline != null));
            let bp = (<CurvePort>(edgeTargetPort));
            if ((bp != null)) {
                return this.RouteEdgeToBoundaryPort(portLoosePolyline, smooth, /* out */smoothedPolyline);
            }
            
            return this.RouteEdgeToFloatingPortOfNode(portLoosePolyline, smooth, /* out */smoothedPolyline);
        }
        
        if (((this.sourcePort != null) 
                    && (this.targetPort != null))) {
            smoothedPolyline = this.SmoothedPolylineFromTwoPoints(this.sourcePort.Location, this.targetPort.Location);
            return new LineSegment(this.sourcePort.Location, this.targetPort.Location);
        }
        
        smoothedPolyline = null;
        return null;
    }
    
    SmoothedPolylineFromTwoPoints(s: Point, e: Point): SmoothedPolyline {
        this._polyline = new Polyline();
        this._polyline.addPoint(s);
        this._polyline.addPoint(e);
        return SmoothedPolyline.mkFromPoints(this._polyline);
    }
    
    RouteEdgeToFloatingPortOfNode(portLoosePolyline: Polyline, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        if ((this.sourcePort instanceof  FloatingPort)) {
            return this.RouteFromFloatingPortToFloatingPort(portLoosePolyline, smooth, /* out */smoothedPolyline);
        }
        
        return this.RouteFromBoundaryPortToFloatingPort(portLoosePolyline, smooth, /* out */smoothedPolyline);
    }
    
    RouteFromBoundaryPortToFloatingPort(targetPortLoosePolyline: Polyline, smooth: boolean, /* out */polyline: SmoothedPolyline): ICurve {
        let sourcePortLocation: Point = this.SourcePort.Location;
        let targetPortLocation: Point = this.targetPort.Location;
        let ls = new LineSegment(sourcePortLocation, targetPortLocation);
        if (this.LineCanBeAcceptedForRouting(ls)) {
            polyline = this.SmoothedPolylineFromTwoPoints(ls.start, ls.end);
            return ls;
        }
        
        if (!this.targetIsInsideOfSourceTightPolyline) {
            // try a variant with two segments
            let takenOutPoint: Point = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.SourcePort.Curve, (<CurvePort>(this.SourcePort)).Parameter, this.SourceLoosePolyline);
            ls = new LineSegment(takenOutPoint, targetPortLocation);
            if (this.LineAvoidsTightHierarchy(ls, targetPortLoosePolyline)) {
                polyline = this.SmoothedPolylineFromTwoPoints(ls.start, ls.end);
                return ls;
            }
            
        }
        
        // we need to route throw the visibility graph
        this.ExtendVisibilityGraphToLocationOfTargetFloatingPort(targetPortLoosePolyline);
        this._polyline = this.GetShortestPolyline(this.SourceVisibilityVertex, TargetVisibilityVertex);
        let tmp: Polyline = this.SourceTightPolyline;
        if (!this.targetIsInsideOfSourceTightPolyline) {
            this.SourceTightPolyline = null;
        }
        
        this.TryShortcutPolyline();
        this.SourceTightPolyline = tmp;
        this.RelaxPolyline();
        this._polyline.PrependPoint(sourcePortLocation);
        return this.SmoothCornersAndReturnCurve(smooth, /* out */polyline);
    }
    
    SmoothCornersAndReturnCurve(smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
        if (smooth) {
            this.SmoothCorners(smoothedPolyline);
        }
        
        return smoothedPolyline.createCurve();
    }
    
    RouteFromFloatingPortToFloatingPort(portLoosePolyline: Polyline, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        let targetPortLocation: Point = this.TargetPort.Location;
        let ls = new LineSegment(this.StartPointOfEdgeRouting, targetPortLocation);
        if ((this.AllowedShootingStraightLines && this.LineAvoidsTightHierarchy(ls, this.SourceTightPolyline, this.targetTightPolyline))) {
            smoothedPolyline = this.SmoothedPolylineFromTwoPoints(ls.start, ls.end);
            return ls;
        }
        
        // we need to route through the visibility graph
        this.ExtendVisibilityGraphToLocationOfTargetFloatingPort(portLoosePolyline);
        this._polyline = this.GetShortestPolyline(this.SourceVisibilityVertex, TargetVisibilityVertex);
        if ((this._polyline == null)) {
            smoothedPolyline = null;
            return null;
        }
        
        if (this.UseSpanner) {
            this.TryShortcutPolyline();
        }
        
        this.RelaxPolyline();
        smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
        return this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
    }
    
    TryShortcutPolyline() {
        if (this.UseInnerPolylingShortcutting) {
            while (this.ShortcutPolylineOneTime()) {
                
            }
            
        }
        
        if (this.UsePolylineEndShortcutting) {
            this.TryShortCutThePolylineEnds();
        }
        
    }
    
    TryShortCutThePolylineEnds() {
        this.TryShortcutPolylineStart();
        this.TryShortcutPolylineEnd();
    }
    
    TryShortcutPolylineEnd() {
        let a: PolylinePoint = this._polyline.endPoint;
        let b: PolylinePoint = a.prev;
        if ((b == null)) {
            return;
        }
        
        let c: PolylinePoint = b.prev;
        if ((c == null)) {
            return;
        }
        
        let m: Point = (0.5 
                    * (b.point + c.point));
        if (this.LineAvoidsTightHierarchy(a.point, m, this._sourceTightPolyline, this.targetTightPolyline)) {
            let p = new PolylinePoint(m);
            a.prev = p;
            c.next = p;
        }
        
    }
    
    TryShortcutPolylineStart() {
        let a: PolylinePoint = this._polyline.startPoint;
        let b: PolylinePoint = a.next;
        if ((b == null)) {
            return;
        }
        
        let c: PolylinePoint = b.next;
        if ((c == null)) {
            return;
        }
        
        let m: Point = (0.5 
                    * (b.point + c.point));
        if (this.LineAvoidsTightHierarchy(a.point, m, this._sourceTightPolyline, this.targetTightPolyline)) {
            let p = new PolylinePoint(m);
            a.next = p;
            c.prev = p;
        }
        
    }
    
    ShortcutPolylineOneTime(): boolean {
        let ret: boolean = false;
        for (let pp: PolylinePoint = this._polyline.startPoint; ((pp.next != null) 
                    && (pp.next.next != null)); pp = pp.next) {
            ret = (ret | this.TryShortcutPolyPoint(pp));
        }
        
        return ret;
    }
    
    TryShortcutPolyPoint(pp: PolylinePoint): boolean {
        if (this.LineAvoidsTightHierarchy(new LineSegment(pp.point, pp.next.next.point), this.SourceTightPolyline, this.targetTightPolyline)) {
            // remove pp.Next
            pp.next = pp.next.next;
            pp.next.prev = pp;
            return true;
        }
        
        return false;
    }
    
    ExtendVisibilityGraphToLocationOfTargetFloatingPort(portLoosePolyline: Polyline) {
        if ((this.VisibilityGraph == null)) {
            this.VisibilityGraph = new this.VisibilityGraph();
        }
        
        let addedPolygons: Array<Polygon> = null;
        let targetLocation: Point = this.targetPort.Location;
        if (!this.activeRectangle.contains(targetLocation)) {
            if (this.activeRectangle.isEmpty) {
                this.activeRectangle = new Rectangle(this.SourcePort.Location, targetLocation);
            }
            else {
                this.activeRectangle.add(targetLocation);
            }
            
            addedPolygons = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
            for (let polygon of addedPolygons) {
                this.VisibilityGraph.AddHole(polygon.Polyline);
            }
            
        }
        
        if ((addedPolygons == null)) {
            if ((targetVisibilityVertex != null)) {
                this.VisibilityGraph.RemoveVertex(targetVisibilityVertex);
            }
            
            this.CalculateEdgeTargetVisibilityGraphForFloatingPort(targetLocation, portLoosePolyline);
            if ((this.SourceVisibilityVertex == null)) {
                this.CalculateSourcePortVisibilityGraph();
            }
            
        }
        else {
            this.RemovePointVisibilityGraphs();
            let visibilityGraphGenerator = new InteractiveTangentVisibilityGraphCalculator(addedPolygons, this.activePolygons, this.VisibilityGraph);
            visibilityGraphGenerator.run();
            this.activePolygons.AddRange(addedPolygons);
            this.CalculateEdgeTargetVisibilityGraphForFloatingPort(targetLocation, portLoosePolyline);
            this.CalculateSourcePortVisibilityGraph();
        }
        
    }
    
    CalculateEdgeTargetVisibilityGraphForFloatingPort(targetLocation: Point, targetLoosePoly: Polyline) {
        if (this.UseSpanner) {
            targetVisibilityVertex = this.AddTransientVisibilityEdgesForPort(targetLocation, targetLoosePoly);
        }
        else {
            PointVisibilityCalculator.CalculatePointVisibilityGraph(this.GetActivePolylinesWithException(targetLoosePoly), this.VisibilityGraph, targetLocation, VisibilityKind.Tangent, /* out */targetVisibilityVertex);
        }
        
    }
    
    AddTransientVisibilityEdgesForPort(point: Point, loosePoly: IEnumerable<Point>): VisibilityVertex {
        let v: VisibilityVertex = this.GetVertex(point);
        if ((v != null)) {
            return v;
        }
        
        v = this.visibilityGraph.AddVertexP(point);
        if ((loosePoly != null)) {
            for (let p of loosePoly) {
            }
            
        }
        
        new TollFreeVisibilityEdge(a, b);
        PointVisibilityCalculator.CalculatePointVisibilityGraph(this.GetActivePolylines(), this.VisibilityGraph, point, VisibilityKind.Tangent, /* out */v);
        Assert.assert((v != null));
        return v;
    }
    
    GetVertex(point: Point): VisibilityVertex {
        let v: VisibilityVertex = this.visibilityGraph.FindVertex(point);
        if (((v == null) 
                    && this.LookForRoundedVertices)) {
            v = this.visibilityGraph.FindVertex(ApproximateComparer.Round(point));
        }
        
        return v;
    }
    
    LookForRoundedVertices = false
    
     ObstacleCalculator: InteractiveObstacleCalculator
    
    IgnoreTightPadding=false
    
    *GetActivePolylinesWithException(targetLoosePoly: Polyline): IterableIterator<Polyline> {
      /*
return from polygon in activePolygons where polygon.Polyline != targetLoosePoly select polygon.Polyline;
      */
     for (const polygon of this.activePolygons) {
       if(polygon.Polyline != targetLoosePoly)
           yield polygon.Polyline
     }
    }
    
    RouteEdgeToBoundaryPort(portLoosePolyline: Polyline, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        this.TargetLoosePolyline = portLoosePolyline;
        if ((this.sourcePort instanceof  FloatingPort)) {
            return this.RouteFromFloatingPortToBoundaryPort(smooth, /* out */smoothedPolyline);
        }
        
        return this.RouteFromBoundaryPortToBoundaryPort(smooth, /* out */smoothedPolyline);
    }
    
    RouteFromBoundaryPortToBoundaryPort(smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        let sourcePortLocation: Point = this.SourcePort.Location;
        let curve: ICurve;
        let targetPortLocation: Point = this.targetPort.Location;
        let ls = new LineSegment(sourcePortLocation, targetPortLocation);
        if (this.LineCanBeAcceptedForRouting(ls)) {
            this._polyline = new Polyline();
            this._polyline.addPoint(ls.start);
            this._polyline.addPoint(ls.end);
            smoothedPolyline = this.SmoothedPolylineFromTwoPoints(ls.start, ls.end);
            curve = SmoothedPolyline.mkFromPoints(this._polyline).createCurve();
        }
        else {
            // try three variants with two segments
            let takenOutPoint: Point = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.targetPort.Curve, (<CurvePort>(this.targetPort)).Parameter, this.TargetLoosePolyline);
            ls = new LineSegment(sourcePortLocation, takenOutPoint);
            if ((this.InsideOfTheAllowedConeOfBoundaryPort(takenOutPoint, (<CurvePort>(this.SourcePort))) && this.LineAvoidsTightHierarchy(ls, this._sourceTightPolyline))) {
                this._polyline = new Polyline();
                this._polyline.addPoint(ls.start);
                this._polyline.addPoint(ls.end);
                this._polyline.addPoint(targetPortLocation);
                curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
            }
            else {
                ls = new LineSegment(this.StartPointOfEdgeRouting, targetPortLocation);
                if ((this.InsideOfTheAllowedConeOfBoundaryPort(this.StartPointOfEdgeRouting, (<CurvePort>(this.TargetPort))) && this.LineAvoidsTightHierarchy(ls))) {
                    this._polyline = new Polyline();
                    this._polyline.addPoint(sourcePortLocation);
                    this._polyline.addPoint(ls.start);
                    this._polyline.addPoint(ls.end);
                    curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
                }
                else {
                    //  we still can make the polyline with two segs when the port sticking segs are intersecting
                    let x: Point;
                    if (LineSegment.Intersect(sourcePortLocation, this.StartPointOfEdgeRouting, targetPortLocation, takenOutPoint, /* out */x)) {
                        this._polyline = new Polyline();
                        this._polyline.addPoint(sourcePortLocation);
                        this._polyline.addPoint(x);
                        this._polyline.addPoint(targetPortLocation);
                        curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
                    }
                    else if (ApproximateComparer.Close(this.StartPointOfEdgeRouting, takenOutPoint)) {
                        this._polyline = new Polyline();
                        this._polyline.addPoint(sourcePortLocation);
                        this._polyline.addPoint(takenOutPoint);
                        this._polyline.addPoint(targetPortLocation);
                        curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
                    }
                    else if (this.LineAvoidsTightHierarchy(new LineSegment(this.StartPointOfEdgeRouting, takenOutPoint))) {
                        // can we do three segments?
                        this._polyline = new Polyline();
                        this._polyline.addPoint(sourcePortLocation);
                        this._polyline.addPoint(this.StartPointOfEdgeRouting);
                        this._polyline.addPoint(takenOutPoint);
                        this._polyline.addPoint(targetPortLocation);
                        curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
                    }
                    else {
                        this.ExtendVisibilityGraphToTargetBoundaryPort(takenOutPoint);
                        this._polyline = this.GetShortestPolyline(this.SourceVisibilityVertex, TargetVisibilityVertex);
                        let tmpTargetTight: Polyline;
                        let tmpSourceTight: Polyline = this.HideSourceTargetTightsIfNeeded(/* out */tmpTargetTight);
                        this.TryShortcutPolyline();
                        this.RecoverSourceTargetTights(tmpSourceTight, tmpTargetTight);
                        this.RelaxPolyline();
                        this._polyline.PrependPoint(sourcePortLocation);
                        this._polyline.addPoint(targetPortLocation);
                        curve = this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
                    }
                    
                }
                
            }
            
        }
        
        return curve;
    }
    
    RecoverSourceTargetTights(tmpSourceTight: Polyline, tmpTargetTight: Polyline) {
        this.SourceTightPolyline = tmpSourceTight;
        this.TargetTightPolyline = tmpTargetTight;
    }
    
    HideSourceTargetTightsIfNeeded(/* out */tmpTargetTight: Polyline): Polyline {
        let tmpSourceTight: Polyline = this.SourceTightPolyline;
        tmpTargetTight = this.TargetTightPolyline;
        this.TargetTightPolyline = null;
        this.SourceTightPolyline = null;
        return tmpSourceTight;
    }
    
    LineAvoidsTightHierarchy(lineSegment: LineSegment): boolean {
        return (InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(lineSegment, this.ObstacleCalculator.RootOfTightHierarchy).Count == 0);
    }
    
    RouteFromFloatingPortToBoundaryPort(smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        let targetPortLocation: Point = this.targetPort.Location;
        let ls: LineSegment;
        if (this.InsideOfTheAllowedConeOfBoundaryPort(this.sourcePort.Location, (<CurvePort>(this.targetPort)))) {
            ls = new LineSegment(this.SourcePort.Location, targetPortLocation);
            if (this.LineCanBeAcceptedForRouting(ls)) {
                smoothedPolyline = this.SmoothedPolylineFromTwoPoints(ls.start, ls.end);
                return ls;
            }
            
        }
        
        let takenOutTargetPortLocation: Point = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.TargetPort.Curve, (<CurvePort>(this.TargetPort)).Parameter, this.TargetLoosePolyline);
        // can we do with just two line segments?
        ls = new LineSegment(this.SourcePort.Location, takenOutTargetPortLocation);
        if (this.LineAvoidsTightHierarchy(ls, this._sourceTightPolyline)) {
            this._polyline = new Polyline(ls.start, ls.end, targetPortLocation);
            smoothedPolyline = SmoothedPolyline.mkFromPoints(this._polyline);
            return smoothedPolyline.createCurve();
        }
        
        this.ExtendVisibilityGraphToTargetBoundaryPort(takenOutTargetPortLocation);
        this._polyline = this.GetShortestPolyline(this.SourceVisibilityVertex, TargetVisibilityVertex);
        this.RelaxPolyline();
        this._polyline.addPoint(targetPortLocation);
        return this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
    }
    
    LineAvoidsTightHierarchy(ls: LineSegment, polylineToExclude: Polyline): boolean {
        let lineIsGood: boolean = true;
        for (let ii of InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.ObstacleCalculator.RootOfTightHierarchy)) {
            if ((ii.Segment1 != polylineToExclude)) {
                lineIsGood = false;
                break;
            }
            
        }
        
        return lineIsGood;
    }
    
    LineAvoidsTightHierarchy(ls: LineSegment, polylineToExclude0: Polyline, polylineToExclude1: Polyline): boolean {
        let lineIsGood: boolean = true;
        for (let ii of InteractiveEdgeRouter.IntersectionsOfLineAndRectangleNodeOverPolyline(ls, this.ObstacleCalculator.RootOfTightHierarchy)) {
            if (!((ii.Segment1 == polylineToExclude0) 
                        || (ii.Segment1 == polylineToExclude1))) {
                lineIsGood = false;
                break;
            }
            
        }
        
        return lineIsGood;
    }
    
    LineAvoidsTightHierarchy(a: Point, b: Point, polylineToExclude0: Polyline, polylineToExclude1: Polyline): boolean {
        return this.LineAvoidsTightHierarchy(new LineSegment(a, b), polylineToExclude0, polylineToExclude1);
    }
    
    ExtendVisibilityGraphToTargetBoundaryPort(takenOutTargetPortLocation: Point) {
        let addedPolygons: Array<Polygon> = null;
        if ((this.VisibilityGraph == null)) {
            this.VisibilityGraph = new this.VisibilityGraph();
        }
        
        if ((!this.activeRectangle.contains(takenOutTargetPortLocation) 
                    || !this.activeRectangle.contains(this.TargetLoosePolyline.boundingBox))) {
            if (this.activeRectangle.isEmpty) {
                this.#if (SHARPKIT)
                this.activeRectangle = this.TargetLoosePolyline.boundingBox.clone();
                this.#else
                this.activeRectangle = this.TargetLoosePolyline.boundingBox;
                this.#endif
                this.activeRectangle.add(this.SourcePort.Location);
                this.activeRectangle.add(this.StartPointOfEdgeRouting);
                this.activeRectangle.add(takenOutTargetPortLocation);
            }
            else {
                this.activeRectangle.add(takenOutTargetPortLocation);
                this.activeRectangle.add(this.TargetLoosePolyline.boundingBox);
            }
            
            addedPolygons = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
            for (let polygon of addedPolygons) {
                this.VisibilityGraph.AddHole(polygon.Polyline);
            }
            
        }
        
        if ((addedPolygons == null)) {
            if ((targetVisibilityVertex != null)) {
                this.VisibilityGraph.RemoveVertex(targetVisibilityVertex);
            }
            
            this.CalculateEdgeTargetVisibilityGraph(takenOutTargetPortLocation);
        }
        else {
            this.RemovePointVisibilityGraphs();
            let visibilityGraphGenerator = new InteractiveTangentVisibilityGraphCalculator(addedPolygons, this.activePolygons, this.VisibilityGraph);
            visibilityGraphGenerator.run();
            this.activePolygons.AddRange(addedPolygons);
            this.CalculateEdgeTargetVisibilityGraph(takenOutTargetPortLocation);
            this.CalculateSourcePortVisibilityGraph();
        }
        
    }
    

    //  returns the hit object

    //  <param name="point"></param>
    //  <returns></returns>
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="Polyline")
    GetHitLoosePolyline(point: Point): Polyline {
        if ((this.ObstacleCalculator.IsEmpty() 
                    || (this.ObstacleCalculator.RootOfLooseHierarchy == null))) {
            return null;
        }
        
        return InteractiveEdgeRouter.GetFirstHitPolyline(point, this.ObstacleCalculator.RootOfLooseHierarchy);
    }
    
     static GetFirstHitPolyline(point: Point, rectangleNode: RectangleNode<Polyline, Point>): Polyline {
        let rectNode: RectangleNode<Polyline, Point> = InteractiveEdgeRouter.GetFirstHitRectangleNode(point, rectangleNode);
        return rectNode.UserData;
        // TODO: Warning!!!, inline IF is not supported ?
        (rectNode != null);
        null;
    }
    
    static GetFirstHitRectangleNode(point: Point, rectangleNode: RectangleNode<Polyline, Point>): RectangleNode<Polyline, Point> {
        if ((rectangleNode == null)) {
            return null;
        }
        
        return;
        HitTestBehavior.Stop;
        // TODO: Warning!!!, inline IF is not supported ?
        (Curve.PointRelativeToCurveLocation(pnt, polyline) != PointLocation.Outside);
        HitTestBehavior.Continue;
    }
    

    //  

    Clean() {
        this.TargetPort = null;
        this.SourcePort = null;
        this.SourceTightPolyline = null;
        this.SourceLoosePolyline = null;
        this.TargetLoosePolyline = null;
        this.targetTightPolyline = null;
        this.VisibilityGraph = null;
        targetVisibilityVertex = null;
        this._sourceVisibilityVertex = null;
        this.activePolygons.Clear();
        this.alreadyAddedOrExcludedPolylines.clear();
        this.activeRectangle.setToEmpty();
    }
    

    //  setting source port and the loose polyline of the port

    //  <param name="port"></param>
    //  <param name="sourceLoosePolylinePar"></param>
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="polyline")
    @SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId="Polyline")
    SetSourcePortAndSourceLoosePolyline(port: Port, sourceLoosePolylinePar: Polyline) {
        this.SourceLoosePolyline = sourceLoosePolylinePar;
        this.sourcePort = port;
        if ((this.sourcePort != null)) {
            this.SourceTightPolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.sourcePort.Location, this.ObstacleCalculator.RootOfTightHierarchy);
            if ((this.sourcePort instanceof  FloatingPort)) {
                this.alreadyAddedOrExcludedPolylines.Insert(this.SourceLoosePolyline);
                // we need to exclude the loose polyline around the source port from the tangent visibily graph
                this.StartPointOfEdgeRouting = this.SourcePort.Location;
            }
            else {
                this.StartPointOfEdgeRouting = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.SourcePort.Curve, (<CurvePort>(this.sourcePort)).Parameter, this.SourceLoosePolyline);
            }
            
        }
        
    }
    

    //  

     run() {
        this.CalculateWholeTangentVisibilityGraph();
    }
    
     CalculateWholeTangentVisibilityGraph() {
        this.VisibilityGraph = new this.VisibilityGraph();
        this.CalculateWholeVisibilityGraphOnExistingGraph();
    }
    
     CalculateWholeVisibilityGraphOnExistingGraph() {
        this.activePolygons = new Array<Polygon>(this.AllPolygons());
        for (let polylineLocal of this.ObstacleCalculator.LooseObstacles) {
            this.VisibilityGraph.AddHole(polylineLocal);
        }
        
        let visibilityGraphGenerator: AlgorithmBase;
        if (this.UseSpanner) {
            visibilityGraphGenerator = new ConeSpanner(this.ObstacleCalculator.LooseObstacles, this.VisibilityGraph);
        }
        else {
            visibilityGraphGenerator = new InteractiveTangentVisibilityGraphCalculator(new Array<Polygon>(), this.activePolygons, this.visibilityGraph);
        }
        
        visibilityGraphGenerator.Run();
    }
    


    // <param name="sourcePortLocal"></param>
    // <param name="targetPortLocal"></param>
    // <param name="smooth"></param>
    // <param name="smoothedPolyline"></param>
    // <returns></returns>
    @SuppressMessage("Microsoft.Performance", "CA1800:DoNotCastUnnecessarily")
    RouteSplineFromPortToPortWhenTheWholeGraphIsReady(sourcePortLocal: Port, targetPortLocal: Port, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        let reversed: boolean = (((sourcePortLocal instanceof  ((FloatingPort && targetPortLocal) instanceof  CurvePort)) 
                    || sourcePortLocal) instanceof  HookUpAnywhereFromInsidePort);
        if (reversed) {
            let tmp: Port = sourcePortLocal;
            sourcePortLocal = targetPortLocal;
            targetPortLocal = tmp;
        }
        
        this.sourcePort = sourcePortLocal;
        this.targetPort = targetPortLocal;
        this.FigureOutSourceTargetPolylinesAndActiveRectangle();
        let curve: ICurve = this.GetEdgeGeomByRouting(smooth, /* out */smoothedPolyline);
        if ((curve == null)) {
            return null;
        }
        
        targetVisibilityVertex = null;
        this._sourceVisibilityVertex = null;
        if (reversed) {
            curve = curve.reverse();
        }
        
        return curve;
    }
    
    GetEdgeGeomByRouting(smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline): ICurve {
        this.targetIsInsideOfSourceTightPolyline = ((this.SourceTightPolyline == null) 
                    || (Curve.PointRelativeToCurveLocation(this.targetPort.Location, this.SourceTightPolyline) == PointLocation.Inside));
        this.sourceIsInsideOfTargetTightPolyline = ((this.TargetTightPolyline == null) 
                    || (Curve.PointRelativeToCurveLocation(this.sourcePort.Location, this.TargetTightPolyline) == PointLocation.Inside));
        let curvePort = (<CurvePort>(this.sourcePort));
        let curve: ICurve;
        if ((curvePort != null)) {
            this.StartPointOfEdgeRouting = this.TakeBoundaryPortOutsideOfItsLoosePolyline(curvePort.Curve, curvePort.Parameter, this.SourceLoosePolyline);
            // TODO: Warning!!!, inline IF is not supported ?
            !this.targetIsInsideOfSourceTightPolyline;
            curvePort.Location;
            this.CalculateSourcePortVisibilityGraph();
            if ((this.targetPort instanceof  CurvePort)) {
                curve = this.RouteFromBoundaryPortToBoundaryPort(smooth, /* out */smoothedPolyline);
            }
            else {
                curve = this.RouteFromBoundaryPortToFloatingPort(this.targetLoosePolyline, smooth, /* out */smoothedPolyline);
            }
            
        }
        else if ((this.targetPort instanceof  FloatingPort)) {
            this.ExtendVisibilityGraphFromFloatingSourcePort();
            Assert.assert((this._sourceVisibilityVertex != null));
            // the edge has to be reversed to route from CurvePort to FloatingPort
            curve = this.RouteFromFloatingPortToFloatingPort(this.targetLoosePolyline, smooth, /* out */smoothedPolyline);
        }
        else {
            curve = this.RouteFromFloatingPortToAnywherePort((<HookUpAnywhereFromInsidePort>(this.targetPort)).LoosePolyline, smooth, /* out */smoothedPolyline, (<HookUpAnywhereFromInsidePort>(this.targetPort)));
        }
        
        return curve;
    }
    
    RouteFromFloatingPortToAnywherePort(targetLoosePoly: Polyline, smooth: boolean, /* out */smoothedPolyline: SmoothedPolyline, port: HookUpAnywhereFromInsidePort): ICurve {
        if (!port.Curve.boundingBox.contains(this.sourcePort.Location)) {
            smoothedPolyline = null;
            return null;
        }
        
        this._sourceVisibilityVertex = this.GetVertex(this.sourcePort.Location);
        this._polyline = this.GetShortestPolylineToMulitpleTargets(this.SourceVisibilityVertex, this.Targets(targetLoosePoly));
        if ((this._polyline == null)) {
            smoothedPolyline = null;
            return null;
        }
        
        if (this.UseSpanner) {
            this.TryShortcutPolyline();
        }
        
        this.RelaxPolyline();
        this.FixLastPolylinePointForAnywherePort(port);
        if ((port.HookSize > 0)) {
            this.BuildHook(port);
        }
        
        return this.SmoothCornersAndReturnCurve(smooth, /* out */smoothedPolyline);
    }
    
    BuildHook(port: HookUpAnywhereFromInsidePort) {
        let curve = port.Curve;
        // creating a hook
        let ellipse = new Ellipse(port.HookSize, port.HookSize, this._polyline.end);
        let intersections = Curve.getAllIntersections(curve, ellipse, true).ToArray();
        Assert.assert((intersections.Length == 2));
        if ((Point.getTriangleOrientation(intersections[0].IntersectionPoint, this._polyline.end, this._polyline.endPoint.prev.point) == TriangleOrientation.Counterclockwise)) {
            intersections.Reverse();
        }
        
        // so the [0] point is to the left of the Polyline
        let polylineTangent = ((this._polyline.end - this._polyline.endPoint.prev.point)).Normalize();
        let tan0 = curve.derivative(intersections[0].Par0).normalize();
        let prj0 = (tan0 * polylineTangent);
        if ((Math.abs(prj0) < 0.2)) {
            this.ExtendPolyline(tan0, intersections[0], polylineTangent, port);
        }
        else {
            let tan1 = curve.derivative(intersections[1].Par0).normalize();
            let prj1 = (tan1 * polylineTangent);
            if ((prj1 < prj0)) {
                this.ExtendPolyline(tan1, intersections[1], polylineTangent, port);
            }
            else {
                this.ExtendPolyline(tan0, intersections[0], polylineTangent, port);
            }
            
        }
        
    }
    
    ExtendPolyline(tangentAtIntersection: Point, x: IntersectionInfo, polylineTangent: Point, port: HookUpAnywhereFromInsidePort) {
        let normal = tangentAtIntersection.rotate((Math.PI / 2));
        if (((normal * polylineTangent) 
                    < 0)) {
            normal = (normal * -1);
        }
        
        let pointBeforeLast = (x.IntersectionPoint 
                    + (normal * port.HookSize));
        let pointAfterX: Point;
        if (!Point.lineLineIntersection(pointBeforeLast, (pointBeforeLast + tangentAtIntersection), this._polyline.end, (this._polyline.end + polylineTangent), /* out */pointAfterX)) {
            return;
        }
        
        this._polyline.addPoint(pointAfterX);
        this._polyline.addPoint(pointBeforeLast);
        this._polyline.addPoint(x.IntersectionPoint);
    }
    
    FixLastPolylinePointForAnywherePort(port: HookUpAnywhereFromInsidePort) {
        while (true) {
            let lastPointInside: PolylinePoint = this.GetLastPointInsideOfCurveOnPolyline(port.Curve);
            lastPointInside.next.next = null;
            this._polyline.endPoint = lastPointInside.next;
            let dir = (lastPointInside.next.point - lastPointInside.point);
            dir = (dir.Normalize() * port.Curve.boundingBox.diagonal);
            // make it a long vector
            let dir0 = dir.Rotate((port.AdjustmentAngle * -1));
            let dir1 = dir.Rotate(port.AdjustmentAngle);
            let rx = Curve.CurveCurveIntersectionOne(port.Curve, new LineSegment(lastPointInside.point, (lastPointInside.point + dir0)), true);
            let lx = Curve.CurveCurveIntersectionOne(port.Curve, new LineSegment(lastPointInside.point, (lastPointInside.point + dir1)), true);
            if (((rx == null) 
                        || (lx == null))) {
                return;
            }
            
            // this.ShowPolylineAndObstacles(Polyline, new LineSegment(lastPointInside.Point, lastPointInside.Point+dir0), new LineSegment(lastPointInside.Point, rerPoint+dir1), port.Curve);
            let trimmedCurve = InteractiveEdgeRouter.GetTrimmedCurveForHookingUpAnywhere(port.Curve, lastPointInside, rx, lx);
            let newLastPoint = trimmedCurve[trimmedCurve.closestParameter(lastPointInside.point)];
            if (!this.LineAvoidsTightHierarchy(new LineSegment(lastPointInside.point, newLastPoint), this.SourceTightPolyline, null)) {
                let xx = Curve.CurveCurveIntersectionOne(port.Curve, new LineSegment(lastPointInside.point, lastPointInside.next.point), false);
                if ((xx == null)) {
                    return;
                }
                
                // this.ShowPolylineAndObstacles(Polyline, port.Curve);
                this._polyline.endPoint.point = xx.IntersectionPoint;
                break;
            }
            
            this._polyline.endPoint.point = newLastPoint;
            if (((lastPointInside.prev == null) 
                        || !this.TryShortcutPolyPoint(lastPointInside.prev))) {
                break;
            }
            
        }
        
    }
    
    static GetTrimmedCurveForHookingUpAnywhere(curve: ICurve, lastPointInside: PolylinePoint, x0: IntersectionInfo, x1: IntersectionInfo): ICurve {
        let clockwise = (Point.getTriangleOrientation(x1.IntersectionPoint, x0.IntersectionPoint, lastPointInside.point) == TriangleOrientation.Clockwise);
        let rightX: number = x0.par0;
        let leftX: number = x1.par0;
        let tr1: ICurve;
        let tr0: ICurve;
        let ret: Curve;
        if (clockwise) {
            if ((rightX < leftX)) {
                return curve.trim(rightX, leftX);
            }
            
            tr0 = curve.trim(rightX, curve.parEnd);
            tr1 = curve.trim(curve.parStart, leftX);
            ret = new Curve();
            return ret.addSegs(tr0, tr1);
        }
        
        if ((leftX < rightX)) {
            return curve.trim(leftX, rightX);
        }
        
        tr0 = curve.trim(leftX, curve.parEnd);
        tr1 = curve.trim(curve.parStart, rightX);
        ret = new Curve();
        return ret.addSegs(tr0, tr1);
    }
    
    GetLastPointInsideOfCurveOnPolyline(curve: ICurve): PolylinePoint {
        for (let p = this._polyline.endPoint.prev; (p != null); p = p.prev) {
            if ((p.prev == null)) {
                return p;
            }
            
            if ((Curve.PointRelativeToCurveLocation(p.point, curve) == PointLocation.Inside)) {
                return p;
            }
            
        }
        
        throw new InvalidOperationException();
    }
    
    GetShortestPolylineToMulitpleTargets(sourceVisVertex: VisibilityVertex, targets: IEnumerable<VisibilityVertex>): Polyline {
        this.CleanTheGraphForShortestPath();
        // ShowPolylineAndObstacles(targets.Select(t=>new Ellipse(3,3,t.Point)).ToArray());
        let pathCalc = new SingleSourceMultipleTargetsShortestPathOnVisibilityGraph(sourceVisVertex, targets, this.VisibilityGraph);
        //  { dd = ShowPolylineAndObstacles };
        let path: IEnumerable<VisibilityVertex> = pathCalc.GetPath();
        if ((path == null)) {
            return null;
        }
        
        Assert.assert(((path.first() == sourceVisVertex) 
                        && targets.contains(path.last())));
        let ret = new Polyline();
        for (let v of path) {
            ret.addPoint(v.point);
        }
        
        return InteractiveEdgeRouter.RemoveCollinearVertices(ret);
    }
    
    Targets(targetLoosePoly: Polyline): IEnumerable<VisibilityVertex> {
        return new Array<VisibilityVertex>(targetLoosePoly.Select(() => {  }, this.visibilityGraph.FindVertex(p)));
    }
    
    ExtendVisibilityGraphFromFloatingSourcePort() {
        let fp = (<FloatingPort>(this.sourcePort));
        Assert.assert((fp != null));
        this.StartPointOfEdgeRouting = fp.Location;
        if (this.UseSpanner) {
            this._sourceVisibilityVertex = this.AddTransientVisibilityEdgesForPort(this.sourcePort.Location, this.SourceLoosePolyline);
        }
        else {
            PointVisibilityCalculator.CalculatePointVisibilityGraph(from, p, in, this.GetActivePolylines(), where, (p != this.SourceLoosePolyline), select, p, this.VisibilityGraph, this.StartPointOfEdgeRouting, VisibilityKind.Tangent, /* out */this._sourceVisibilityVertex);
        }
        
    }
    
    FigureOutSourceTargetPolylinesAndActiveRectangle() {
        this._sourceTightPolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.sourcePort.Location, this.ObstacleCalculator.RootOfTightHierarchy);
        this.SourceLoosePolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.sourcePort.Location, this.ObstacleCalculator.RootOfLooseHierarchy);
        this.targetTightPolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.targetPort.Location, this.ObstacleCalculator.RootOfTightHierarchy);
        this.targetLoosePolyline = InteractiveEdgeRouter.GetFirstHitPolyline(this.targetPort.Location, this.ObstacleCalculator.RootOfLooseHierarchy);
        this.activeRectangle = new Rectangle(new Point(double.NegativeInfinity, double.PositiveInfinity), new Point(double.PositiveInfinity, double.NegativeInfinity));
    }
    
    AllPolygons(): IEnumerable<Polygon> {
        for (let p of this.ObstacleCalculator.LooseObstacles) {
            yield;
        }
        
        return new Polygon(p);
    }
    


    //  <returns></returns>
    @SuppressMessage("Microsoft.Design", "CA1024:UsePropertiesWhereAppropriate")
    GetVisibilityGraph(): this.VisibilityGraph {
        return this.VisibilityGraph;
    }
    
     ShowObstaclesAndVisGraph() {
        let obs = this.ObstacleCalculator.LooseObstacles.Select(() => {  }, new DebugCurve(100, 1, "blue", o));
        let edges = this.visibilityGraph.Edges.Select(() => {  }, new DebugCurve(70, 1, (e instanceof  "red"), new LineSegment(e.SourcePoint, e.TargetPoint)));
        // TODO: Warning!!!, inline IF is not supported ?
        TransientVisibilityEdge;
        "green";
        LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(obs.Concat(edges));
    }
    
     AddActivePolygons(polygons: IEnumerable<Polygon>) {
        this.activePolygons.AddRange(polygons);
    }
    
     ClearActivePolygons() {
        this.activePolygons.Clear();
    }
  }