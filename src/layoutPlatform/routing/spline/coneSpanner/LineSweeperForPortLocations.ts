// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Diagnostics.CodeAnalysis;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Routing.Visibility;
// #if TEST_MSAGL
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.DebugHelpers.Persistence;
// #endif

// namespace Microsoft.Msagl.Routing.Spline.ConeSpanner {

//     // Sweeps a given direction of cones and adds discovered edges to the graph.
//     // The cones can only start at ports here.
//     // <
//     class LineSweeperForPortLocations : LineSweeperBase, IConeSweeper {
//         public Point ConeRightSideDirection {
//             get;
//             set;
//         }

//         public Point ConeLeftSideDirection {
//             get;
//             set;
//         }

//         readonly ConeSideComparer coneSideComparer;

//         readonly VisibilityGraph visibilityGraph;

//         readonly RBTree < ConeSide > rightConeSides;
//         readonly RBTree < ConeSide > leftConeSides;

//         LineSweeperForPortLocations(IEnumerable < Polyline > obstacles, Point direction, Point coneRsDir, Point coneLsDir,
//             VisibilityGraph visibilityGraph, IEnumerable < Point > portLocations)
//             : base(obstacles, direction) {
//             this.visibilityGraph = visibilityGraph;
//             ConeRightSideDirection = coneRsDir;
//             ConeLeftSideDirection = coneLsDir;
//             coneSideComparer = new ConeSideComparer(this);
//             leftConeSides = new RBTree<ConeSide>(coneSideComparer);
//             rightConeSides = new RBTree<ConeSide>(coneSideComparer);
//             PortLocations = portLocations;
//         }

//         IEnumerable < Point > PortLocations {
//             get;
//             set;
//         }

//         internal static void Sweep(IEnumerable < Polyline > obstacles,
//             Point direction, double coneAngle, VisibilityGraph visibilityGraph,
//             IEnumerable < Point > portLocations) {
//             var cs = new LineSweeperForPortLocations(obstacles, direction, direction.rotate(-coneAngle / 2),
//                 direction.rotate(coneAngle / 2), visibilityGraph, portLocations);
//             cs.Calculate();
//         }

//         void Calculate() {
//             InitQueueOfEvents();
//             foreach(Point portLocation of PortLocations)
//             EnqueueEvent(new PortLocationEvent(portLocation));
//             while (EventQueue.Count > 0)
//                 ProcessEvent(EventQueue.Dequeue());
//         }

//         void ProcessEvent(SweepEvent p) {
//             var vertexEvent = p as VertexEvent;
//             // ShowTrees(CurveFactory.CreateDiamond(3, 3, p.Site));
//             if (vertexEvent != null)
//                 ProcessVertexEvent(vertexEvent);
//             else {
//                 var rightIntersectionEvent = p as RightIntersectionEvent;
//                 if (rightIntersectionEvent != null)
//                     ProcessRightIntersectionEvent(rightIntersectionEvent);
//                 else {
//                     var leftIntersectionEvent = p as LeftIntersectionEvent;
//                     if (leftIntersectionEvent != null)
//                         ProcessLeftIntersectionEvent(leftIntersectionEvent);
//                     else {
//                         var coneClosure = p as ConeClosureEvent;
//                         if (coneClosure != null) {
//                             if (!coneClosure.ConeToClose.Removed)
//                                 RemoveCone(coneClosure.ConeToClose);
//                         } else {
//                             var portLocationEvent = p as PortLocationEvent;
//                             if (portLocationEvent != null)
//                                 ProcessPortLocationEvent(portLocationEvent);
//                             else
//                                 ProcessPointObstacleEvent((PortObstacleEvent) p);
//                         }
//                         Z = GetZ(p);
//                     }
//                 }
//             }
//             //     ShowTrees(CurveFactory.CreateEllipse(3,3,p.Site));
//         }

//         void ProcessPointObstacleEvent(PortObstacleEvent portObstacleEvent) {
//             Z = GetZ(portObstacleEvent);
//             GoOverConesSeeingVertexEvent(portObstacleEvent);
//         }

//         void CreateConeOnPortLocation(SweepEvent sweepEvent) {
//             var cone = new Cone(sweepEvent.Site, this);
//             RBNode < ConeSide > leftNode = InsertToTree(leftConeSides, cone.LeftSide = new ConeLeftSide(cone));
//             RBNode < ConeSide > rightNode = InsertToTree(rightConeSides, cone.RightSide = new ConeRightSide(cone));
//             LookForIntersectionWithConeRightSide(rightNode);
//             LookForIntersectionWithConeLeftSide(leftNode);
//         }

//         void ProcessPortLocationEvent(PortLocationEvent portEvent) {
//             Z = GetZ(portEvent);
//             GoOverConesSeeingVertexEvent(portEvent);
//             CreateConeOnPortLocation(portEvent);
//         }

//         void ProcessLeftIntersectionEvent(LeftIntersectionEvent leftIntersectionEvent) {
//             if (leftIntersectionEvent.coneLeftSide.Removed == false) {
//                 if (Math.Abs((leftIntersectionEvent.EndVertex.point - leftIntersectionEvent.Site) * SweepDirection) <
//                     GeomConstants.distanceEpsilon) {
//                     //the cone is totally covered by a horizontal segment
//                     RemoveCone(leftIntersectionEvent.coneLeftSide.Cone);
//                 } else {
//                     RemoveSegFromLeftTree(leftIntersectionEvent.coneLeftSide);
//                     Z = SweepDirection * leftIntersectionEvent.Site; //it is safe now to restore the order
//                     var leftSide = new BrokenConeSide(
//                         leftIntersectionEvent.Site,
//                         leftIntersectionEvent.EndVertex, leftIntersectionEvent.coneLeftSide);
//                     InsertToTree(leftConeSides, leftSide);
//                     leftIntersectionEvent.coneLeftSide.Cone.LeftSide = leftSide;
//                     LookForIntersectionOfObstacleSideAndLeftConeSide(leftIntersectionEvent.Site,
//                         leftIntersectionEvent.EndVertex);
//                     TryCreateConeClosureForLeftSide(leftSide);
//                 }
//             } else
//                 Z = SweepDirection * leftIntersectionEvent.Site;
//         }

//         void TryCreateConeClosureForLeftSide(BrokenConeSide leftSide) {
//             var coneRightSide = leftSide.Cone.RightSide as ConeRightSide;
//             if (coneRightSide != null)
//                 if (
//                     Point.getTriangleOrientation(coneRightSide.start, coneRightSide.start + coneRightSide.Direction,
//                         leftSide.EndVertex.point) == TriangleOrientation.Clockwise)
//                     CreateConeClosureEvent(leftSide, coneRightSide);
//         }

//         void CreateConeClosureEvent(BrokenConeSide brokenConeSide, ConeSide otherSide) {
//             Point x;
//             bool r = Point.RayIntersectsRayInteriors(brokenConeSide.start, brokenConeSide.Direction, otherSide.start,
//                 otherSide.Direction, out x);
//             Assert.assert(r);
//             EnqueueEvent(new ConeClosureEvent(x, brokenConeSide.Cone));
//         }

//         void ProcessRightIntersectionEvent(RightIntersectionEvent rightIntersectionEvent) {
//             //restore Z for the time being
//             // Z = PreviousZ;
//             if (rightIntersectionEvent.coneRightSide.Removed == false) {
//                 //it can happen that the cone side participating in the intersection is gone;
//                 //obstracted by another obstacle or because of a vertex found inside of the cone
//                 //PrintOutRightSegTree();
//                 RemoveSegFromRightTree(rightIntersectionEvent.coneRightSide);
//                 Z = SweepDirection * rightIntersectionEvent.Site;
//                 var rightSide = new BrokenConeSide(
//                     rightIntersectionEvent.Site,
//                     rightIntersectionEvent.EndVertex, rightIntersectionEvent.coneRightSide);
//                 InsertToTree(rightConeSides, rightSide);
//                 rightIntersectionEvent.coneRightSide.Cone.RightSide = rightSide;
//                 LookForIntersectionOfObstacleSideAndRightConeSide(rightIntersectionEvent.Site,
//                     rightIntersectionEvent.EndVertex);

//                 TryCreateConeClosureForRightSide(rightSide);
//             } else
//                 Z = SweepDirection * rightIntersectionEvent.Site;
//         }

//         void TryCreateConeClosureForRightSide(BrokenConeSide rightSide) {
//             var coneLeftSide = rightSide.Cone.LeftSide as ConeLeftSide;
//             if (coneLeftSide != null)
//                 if (
//                     Point.getTriangleOrientation(coneLeftSide.start, coneLeftSide.start + coneLeftSide.Direction,
//                         rightSide.EndVertex.point) == TriangleOrientation.Counterclockwise)
//                     CreateConeClosureEvent(rightSide, coneLeftSide);
//         }

//         void RemoveConesClosedBySegment(Point leftPoint, Point rightPoint) {
//             CloseConesCoveredBySegment(leftPoint, rightPoint,
//                 SweepDirection * leftPoint > SweepDirection * rightPoint
//                     ? leftConeSides
//                     : rightConeSides);
//         }

//         void CloseConesCoveredBySegment(Point leftPoint, Point rightPoint, RBTree < ConeSide > tree) {
//             RBNode < ConeSide > node = tree.FindFirst(
//                 s => Point.getTriangleOrientation(s.start, s.start + s.Direction, leftPoint) ==
//                     TriangleOrientation.Counterclockwise);

//             Point x;
//             if (node == null || !Point.IntervalIntersectsRay(leftPoint, rightPoint,
//                 node.Item.start, node.Item.Direction, out x))
//                 return;
//             var conesToRemove = new Array<Cone>();
//             do {
//                 conesToRemove.Add(node.Item.Cone);
//                 node = tree.next(node);
//             } while (node != null && Point.IntervalIntersectsRay(leftPoint, rightPoint,
//                 node.Item.start, node.Item.Direction, out x));

//             foreach(Cone cone of conesToRemove)
//             RemoveCone(cone);
//         }

//         void ProcessVertexEvent(VertexEvent vertexEvent) {
//             Z = GetZ(vertexEvent);
//             GoOverConesSeeingVertexEvent(vertexEvent);
//             AddConeAndEnqueueEvents(vertexEvent);
//         }

// #if TEST_MSAGL
//         // ReSharper disable UnusedMember.Local
//         [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         static Ellipse EllipseOnVert(SweepEvent vertexEvent) {
//             // ReSharper restore UnusedMember.Local
//             return new Ellipse(2, 2, vertexEvent.Site);
//         }

//         // ReSharper disable UnusedMember.Local
//         [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         static Ellipse EllipseOnPolylinePoint(PolylinePoint pp) {
//             // ReSharper restore UnusedMember.Local
//             return new Ellipse(2, 2, pp.point);
//         }

// #endif

// #if TEST_MSAGL
//         // ReSharper disable UnusedMember.Local
//         [SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId = "System.Diagnostics.Debug.WriteLine(System.String)"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         void CheckConsistency() {
//             // ReSharper restore UnusedMember.Local
//             foreach(var s of rightConeSides) {
//                 coneSideComparer.SetOperand(s);
//             }
//             foreach(var s of leftConeSides) {
//                 coneSideComparer.SetOperand(s);
//                 if (!rightConeSides.Contains(s.Cone.RightSide)) {
//                     PrintOutRightSegTree();
//                     PrintOutLeftSegTree();
//                 }
//             }
//         }

//         // ReSharper disable UnusedMember.Local
//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         void ShowTrees(params ICurve[] curves) {
//             // ReSharper restore UnusedMember.Local
//             var l = Obstacles.Select(c => new DebugCurve(100, 1, "blue", c));
//             l = l.Concat(rightConeSides.Select(s => new DebugCurve(200, 1, "brown", ExtendSegmentToZ(s))));
//             l = l.Concat(leftConeSides.Select(s => new DebugCurve(200, 1, "gree", ExtendSegmentToZ(s))));
//             l = l.Concat(curves.Select(c => new DebugCurve("red", c)));
//             l =
//                 l.Concat(
//                     visibilityGraph.Edges.Select(e => new LineSegment(e.SourcePoint, e.TargetPoint)).Select(
//                         c => new DebugCurve("marine", c)));
//             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
//         }

//         void ShowLeftTree(params ICurve[] curves) {
//             var l = Obstacles.Select(c => new DebugCurve(c));
//             l = l.Concat(leftConeSides.Select(s => new DebugCurve("brown", ExtendSegmentToZ(s))));
//             l = l.Concat(curves.Select(c => new DebugCurve("red", c)));
//             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);

//         }
//         void ShowRightTree(params ICurve[] curves) {
//             var l = Obstacles.Select(c => new DebugCurve(c));
//             l = l.Concat(rightConeSides.Select(s => new DebugCurve("brown", ExtendSegmentToZ(s))));
//             l = l.Concat(curves.Select(c => new DebugCurve("red", c)));
//             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
//         }

//         // ReSharper disable UnusedMember.Global
//         internal void Show(params ICurve[] curves) {
//             // ReSharper restore UnusedMember.Global
//             var l = Obstacles.Select(c => new DebugCurve(100, 1, "black", c));

//             l = l.Concat(curves.Select(c => new DebugCurve(200, 1, "red", c)));
//             //            foreach (var s of rightConeSides){
//             //                l.Add(ExtendSegmentToZ(s));
//             //                if (s is BrokenConeSide)
//             //                    l.Add(Diamond(s.start));
//             //                l.Add(ExtendSegmentToZ(s.Cone.LeftSide));
//             //            }

//             l =
//                 l.Concat(
//                     visibilityGraph.Edges.Select(edge => new LineSegment(edge.SourcePoint, edge.TargetPoint)).Select(
//                         c => new DebugCurve(100, 1, "blue", c)));

//             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);

//         }

//         ICurve ExtendSegmentToZ(ConeSide segment) {
//             double den = segment.Direction * SweepDirection;
//             Assert.assert(Math.Abs(den) > GeomConstants.distanceEpsilon);
//             double t = (Z - segment.start * SweepDirection) / den;

//             return new LineSegment(segment.start, segment.start + segment.Direction * t);
//         }

//         // ReSharper disable UnusedMember.Global
//         internal ICurve ExtendSegmentToZPlus1(ConeSide segment) {
//             // ReSharper restore UnusedMember.Global
//             double den = segment.Direction * SweepDirection;
//             Assert.assert(Math.Abs(den) > GeomConstants.distanceEpsilon);
//             double t = (Z + 1 - segment.start * SweepDirection) / den;

//             return new LineSegment(segment.start, segment.start + segment.Direction * t);
//         }
// #endif

//         void AddConeAndEnqueueEvents(VertexEvent vertexEvent) {
//             var leftVertexEvent = vertexEvent as LeftVertexEvent;
//             if (leftVertexEvent != null) {
//                 PolylinePoint nextPoint = vertexEvent.Vertex.NextOnPolyline;
//                 CloseConesAtLeftVertex(leftVertexEvent, nextPoint);
//             } else {
//                 var rightVertexEvent = vertexEvent as RightVertexEvent;
//                 if (rightVertexEvent != null) {
//                     PolylinePoint nextPoint = vertexEvent.Vertex.PrevOnPolyline;
//                     CloseConesAtRightVertex(rightVertexEvent, nextPoint);
//                 } else {
//                     CloseConesAtLeftVertex(vertexEvent, vertexEvent.Vertex.NextOnPolyline);
//                     CloseConesAtRightVertex(vertexEvent, vertexEvent.Vertex.PrevOnPolyline);
//                 }
//             }
//         }

//         void CloseConesAtRightVertex(VertexEvent rightVertexEvent,
//             PolylinePoint nextVertex) {
//             Point prevSite = rightVertexEvent.Vertex.NextOnPolyline.point;
//             double prevZ = prevSite * SweepDirection;
//             if (prevZ <= Z && Z - prevZ < GeomConstants.distanceEpsilon)
//                 RemoveConesClosedBySegment(prevSite, rightVertexEvent.Vertex.point);

//             Point site = rightVertexEvent.Site;
//             Point coneLp = site + ConeLeftSideDirection;
//             Point coneRp = site + ConeRightSideDirection;
//             Point nextSite = nextVertex.point;
//             //SugiyamaLayoutSettings.Show(new LineSegment(site, coneLP), new LineSegment(site, coneRP), new LineSegment(site, nextSite));
//             //try to remove the right side
//             if ((site - prevSite) * SweepDirection > GeomConstants.distanceEpsilon)
//                 RemoveRightSide(new RightObstacleSide(rightVertexEvent.Vertex.NextOnPolyline));
//             if (GetZ(nextSite) + GeomConstants.distanceEpsilon < GetZ(rightVertexEvent))
//                 return;
//             if (!Point.PointToTheRightOfLineOrOnLine(nextSite, site, coneLp)) {
//                 //if (angle <= -coneAngle / 2) {
//                 //   CreateConeOnVertex(rightVertexEvent);
//                 if (Point.PointToTheLeftOfLineOrOnLine(nextSite + DirectionPerp, nextSite, site))
//                     EnqueueEvent(new RightVertexEvent(nextVertex));
//                 //  TryEnqueueRighVertexEvent(nextVertex);
//             } else if (Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneRp)) {
//                 //if (angle < coneAngle / 2) {
//                 CaseToTheLeftOfLineOrOnLineConeRp(rightVertexEvent, nextVertex);
//             } else {
//                 if ((nextSite - site) * SweepDirection > GeomConstants.distanceEpsilon) {
//                     LookForIntersectionOfObstacleSideAndLeftConeSide(rightVertexEvent.Site, nextVertex);
//                     InsertRightSide(new RightObstacleSide(rightVertexEvent.Vertex));
//                 }
//                 EnqueueEvent(new RightVertexEvent(nextVertex));
//             }
//         }

//         void CaseToTheLeftOfLineOrOnLineConeRp(VertexEvent rightVertexEvent, PolylinePoint nextVertex) {
//             EnqueueEvent(new RightVertexEvent(nextVertex));
//             //the obstacle side is inside of the cone
//             //we need to create an obstacle left side segment instead of the left cone side
//             //                var cone = new Cone(rightVertexEvent.Vertex.point, this);
//             //                var obstacleSideSeg = new BrokenConeSide(cone.Apex, nextVertex, new ConeLeftSide(cone));
//             //                cone.LeftSide = obstacleSideSeg;
//             //                cone.RightSide = new ConeRightSide(cone);
//             //                var rnode = InsertToTree(rightConeSides, cone.RightSide);
//             //                LookForIntersectionWithConeRightSide(rnode);
//             RBNode < ConeSide > lnode =
//             leftConeSides.FindFirst(side => PointIsToTheLeftOfSegment(rightVertexEvent.Site, side));
//             FixConeLeftSideIntersections(rightVertexEvent.Vertex, nextVertex, lnode);
//             if ((nextVertex.point - rightVertexEvent.Site) * SweepDirection > GeomConstants.distanceEpsilon)
//                 InsertRightSide(new RightObstacleSide(rightVertexEvent.Vertex));
//         }

//         void LookForIntersectionOfObstacleSideAndRightConeSide(Point obstacleSideStart,
//             PolylinePoint obstacleSideVertex) {
//             RBNode < ConeSide > node = GetLastNodeToTheLeftOfPointInRightSegmentTree(obstacleSideStart);

//             if (node != null) {
//                 var coneRightSide = node.Item as ConeRightSide;
//                 if (coneRightSide != null) {
//                     Point intersection;
//                     if (Point.IntervalIntersectsRay(obstacleSideStart, obstacleSideVertex.point,
//                         coneRightSide.start, ConeRightSideDirection, out intersection) &&
//                         SegmentIsNotHorizontal(intersection, obstacleSideVertex.point)) {
//                         EnqueueEvent(CreateRightIntersectionEvent(coneRightSide, intersection, obstacleSideVertex));
//                     }
//                 }
//             }
//         }

//         [SuppressMessage("Microsoft.Performance", "CA1822:MarkMembersAsStatic")]
//         RightIntersectionEvent CreateRightIntersectionEvent(ConeRightSide coneRightSide, Point intersection,
//             PolylinePoint obstacleSideVertex) {
//             Assert.assert(Math.Abs((obstacleSideVertex.point - intersection) * SweepDirection) >
//                 GeomConstants.distanceEpsilon);
//             return new RightIntersectionEvent(coneRightSide,
//                 intersection, obstacleSideVertex);
//         }

//         RBNode < ConeSide > GetLastNodeToTheLeftOfPointInRightSegmentTree(Point obstacleSideStart) {
//             return rightConeSides.FindLast(
//                 s => PointIsToTheRightOfSegment(obstacleSideStart, s));
//         }

//         void LookForIntersectionOfObstacleSideAndLeftConeSide(Point obstacleSideStart,
//             PolylinePoint obstacleSideVertex) {
//             RBNode < ConeSide > node = GetFirstNodeToTheRightOfPoint(obstacleSideStart);
//             //          ShowLeftTree(Box(obstacleSideStart));
//             if (node == null) return;
//             var coneLeftSide = node.Item as ConeLeftSide;
//             if (coneLeftSide == null) return;
//             Point intersection;
//             if (Point.IntervalIntersectsRay(obstacleSideStart, obstacleSideVertex.point, coneLeftSide.start,
//                 ConeLeftSideDirection, out intersection)) {
//                 EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, intersection, obstacleSideVertex));
//             }
//         }

//         RBNode < ConeSide > GetFirstNodeToTheRightOfPoint(Point p) {
//             return leftConeSides.FindFirst(s => PointIsToTheLeftOfSegment(p, s));
//         }

// #if TEST_MSAGL
//         // ReSharper disable UnusedMember.Local
//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         static ICurve Box(Point p) {
//             // ReSharper restore UnusedMember.Local
//             return CurveFactory.CreateRectangle(2, 2, p);
//         }
//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId = "System.Diagnostics.Debug.WriteLine(System.String)")]
//         void PrintOutRightSegTree() {
//             System.Diagnostics.Debug.WriteLine("right segment tree");
//             foreach(var t of rightConeSides)
//             System.Diagnostics.Debug.WriteLine(t);
//             System.Diagnostics.Debug.WriteLine("end of right segments");
//         }
// #endif

//         static bool PointIsToTheLeftOfSegment(Point p, ConeSide seg) {
//             return (Point.getTriangleOrientation(seg.start, seg.start + seg.Direction, p) ==
//                 TriangleOrientation.Counterclockwise);
//         }

//         static bool PointIsToTheRightOfSegment(Point p, ConeSide seg) {
//             return (Point.getTriangleOrientation(seg.start, seg.start + seg.Direction, p) ==
//                 TriangleOrientation.Clockwise);
//         }

//         void FixConeLeftSideIntersections(PolylinePoint obstSideStart, PolylinePoint obstSideEnd,
//             RBNode < ConeSide > rbNode) {
//             if (rbNode != null) {
//                 Point intersection;
//                 var seg = rbNode.Item as ConeLeftSide;
//                 if (seg != null &&
//                     Point.IntervalIntersectsRay(obstSideStart.point, obstSideEnd.point, seg.start, seg.Direction,
//                         out intersection)) {
//                     EnqueueEvent(new LeftIntersectionEvent(seg, intersection, obstSideEnd));
//                 }
//             }
//         }

//         RBNode < ConeSide > InsertToTree(RBTree < ConeSide > tree, ConeSide coneSide) {
//             Assert.assert(coneSide.Direction * SweepDirection > GeomConstants.distanceEpsilon);
//             coneSideComparer.SetOperand(coneSide);
//             return tree.Insert(coneSide);
//         }

//         void CloseConesAtLeftVertex(VertexEvent leftVertexEvent, PolylinePoint nextVertex) {
//             //close segments first
//             Point prevSite = leftVertexEvent.Vertex.PrevOnPolyline.point;
//             double prevZ = prevSite * SweepDirection;
//             if (prevZ <= Z && Z - prevZ < GeomConstants.distanceEpsilon) {
//                 //Show(
//                 //    new Ellipse(1, 1, prevSite),
//                 //    CurveFactory.CreateBox(2, 2, leftVertexEvent.Vertex.point));

//                 RemoveConesClosedBySegment(leftVertexEvent.Vertex.point, prevSite);
//             }

//             Point site = leftVertexEvent.Site;
//             Point coneLp = site + ConeLeftSideDirection;
//             Point coneRp = site + ConeRightSideDirection;
//             Point nextSite = nextVertex.point;
//             // SugiyamaLayoutSettings.Show(new LineSegment(site, coneLP), new LineSegment(site, coneRP), new LineSegment(site, nextSite));

//             if ((site - prevSite) * SweepDirection > GeomConstants.distanceEpsilon)
//                 RemoveLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex.PrevOnPolyline));

//             if (Point.PointToTheRightOfLineOrOnLine(nextSite, site, site + DirectionPerp)) {
//                 //if (angle > Math.PI / 2)
//                 //   CreateConeOnVertex(leftVertexEvent); //it is the last left vertex on this obstacle
//             } else if (!Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneRp)) {
//                 //if (angle >= coneAngle / 2) {
//                 // CreateConeOnVertex(leftVertexEvent);
//                 EnqueueEvent(new LeftVertexEvent(nextVertex));
//                 //we schedule LeftVertexEvent for a vertex with horizontal segment to the left on the top of the obstace
//             } else if (!Point.PointToTheLeftOfLineOrOnLine(nextSite, site, coneLp)) {
//                 //if (angle >= -coneAngle / 2) {
//                 //we cannot completely obscure the cone here
//                 EnqueueEvent(new LeftVertexEvent(nextVertex));
//                 //the obstacle side is inside of the cone
//                 //we need to create an obstacle right side segment instead of the cone side
//                 //                var cone = new Cone(leftVertexEvent.Vertex.point, this);
//                 //                var rightSide = new BrokenConeSide(leftVertexEvent.Vertex.point, nextVertex,
//                 //                                                        new ConeRightSide(cone));
//                 //                cone.RightSide = rightSide;
//                 //                cone.LeftSide = new ConeLeftSide(cone);
//                 //                LookForIntersectionWithConeLeftSide(InsertToTree(leftConeSides, cone.LeftSide));
//                 RBNode < ConeSide > rbNode = rightConeSides.FindLast(s => PointIsToTheRightOfSegment(site, s));
//                 FixConeRightSideIntersections(leftVertexEvent.Vertex, nextVertex, rbNode);
//                 if ((nextVertex.point - leftVertexEvent.Site) * SweepDirection > GeomConstants.distanceEpsilon)
//                     InsertLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex));
//             } else {
//                 EnqueueEvent(new LeftVertexEvent(nextVertex));
//                 if ((nextVertex.point - leftVertexEvent.Site) * SweepDirection > GeomConstants.distanceEpsilon) {
//                     //if( angle >- Pi/2
//                     // Assert.assert(angle > -Math.PI / 2);
//                     LookForIntersectionOfObstacleSideAndRightConeSide(leftVertexEvent.Site, nextVertex);
//                     InsertLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex));
//                 }
//             }
//         }

//         void RemoveCone(Cone cone) {
//             Assert.assert(cone.Removed == false);
//             cone.Removed = true;
//             RemoveSegFromLeftTree(cone.LeftSide);
//             RemoveSegFromRightTree(cone.RightSide);
//         }

//         void RemoveSegFromRightTree(ConeSide coneSide) {
//             //   ShowRightTree();
//             Assert.assert(coneSide.Removed == false);
//             coneSideComparer.SetOperand(coneSide);
//             RBNode < ConeSide > b = rightConeSides.Remove(coneSide);
//             coneSide.Removed = true;
//             if (b == null) {
//                 double tmpZ = Z;
//                 Z = Math.Max(GetZ(coneSide.start), Z - 0.01);
//                 //we need to return to the past a little bit when the order was still correc
//                 coneSideComparer.SetOperand(coneSide);
// #if TEST_MSAGL
//                 b =
// #endif
//                 rightConeSides.Remove(coneSide);
//                 Z = tmpZ;

// #if TEST_MSAGL
//                 if (b == null) {
//                     PrintOutRightSegTree();
//                     ShowRightTree(CurveFactory.CreateDiamond(3, 4, coneSide.start));
//                     GeometryGraph gg = CreateGraphFromObstacles(Obstacles);
//                     GeometryGraphWriter.Write(gg, "c:\\tmp\\bug1");
//                 }
// #endif
//             }
//             Assert.assert(b != null);
//         }

//         void RemoveSegFromLeftTree(ConeSide coneSide) {
//             Assert.assert(coneSide.Removed == false);
//             coneSide.Removed = true;
//             coneSideComparer.SetOperand(coneSide);
//             RBNode < ConeSide > b = leftConeSides.Remove(coneSide);

//             if (b == null) {
//                 double tmpZ = Z;
//                 Z = Math.Max(GetZ(coneSide.start), Z - 0.01);
//                 coneSideComparer.SetOperand(coneSide);

// #if TEST_MSAGL
//                 b =
// #endif
//                 leftConeSides.Remove(coneSide);
//                 Z = tmpZ;
// #if TEST_MSAGL
//                 if (b == null) {
//                     PrintOutLeftSegTree();
//                     ShowLeftTree(new Ellipse(2, 2, coneSide.start));
//                 }
// #endif
//             }

//             Assert.assert(b != null);
//         }

//         //
//         // <

//         void FixConeRightSideIntersections(PolylinePoint obstSideStartVertex, PolylinePoint obstSideEndVertex,
//             RBNode < ConeSide > rbNode) {
//             if (rbNode != null) {
//                 Point intersection;
//                 var seg = rbNode.Item as ConeRightSide;
//                 if (seg != null &&
//                     Point.IntervalIntersectsRay(obstSideStartVertex.point, obstSideEndVertex.point, seg.start,
//                         seg.Direction,
//                         out intersection)) {
//                     EnqueueEvent(CreateRightIntersectionEvent(seg, intersection, obstSideEndVertex));
//                 }
//             }
//         }

//         void LookForIntersectionWithConeLeftSide(RBNode < ConeSide > leftNode) {
//             //Show(new Ellipse(1, 1, leftNode.item.start));

//             var coneLeftSide = leftNode.Item as ConeLeftSide;
//             if (coneLeftSide != null) {
//                 //leftNode = leftSegmentTree.TreePredecessor(leftNode);
//                 //if (leftNode != null) {
//                 //    var seg = leftNode.item as ObstacleSideSegment;
//                 //    if (seg != null)
//                 //        TryIntersectionOfConeLeftSideAndObstacleConeSide(coneLeftSide, seg);
//                 //}

//                 RightObstacleSide rightObstacleSide = FindFirstObstacleSideToTheLeftOfPoint(coneLeftSide.start);
//                 if (rightObstacleSide != null)
//                     TryIntersectionOfConeLeftSideAndObstacleSide(coneLeftSide, rightObstacleSide);
//             } else {
//                 var seg = (BrokenConeSide) leftNode.Item;
//                 leftNode = leftConeSides.next(leftNode);
//                 if (leftNode != null) {
//                     coneLeftSide = leftNode.Item as ConeLeftSide;
//                     if (coneLeftSide != null)
//                         TryIntersectionOfConeLeftSideAndObstacleConeSide(coneLeftSide, seg);
//                 }
//             }
//         }

//         void LookForIntersectionWithConeRightSide(RBNode < ConeSide > rightNode) {
//             //Show(new Ellipse(10, 5, rightNode.item.start));
//             var coneRightSide = rightNode.Item as ConeRightSide;
//             if (coneRightSide != null) {
//                 //rightNode = rightSegmentTree.TreeSuccessor(rightNode);
//                 //if (rightNode != null) {
//                 //    var seg = rightNode.item as ObstacleSideSegment;
//                 //    if (seg != null)
//                 //        TryIntersectionOfConeRightSideAndObstacleConeSide(coneRightSide, seg);
//                 //}

//                 LeftObstacleSide leftObstacleSide = FindFirstObstacleSideToToTheRightOfPoint(coneRightSide.start);
//                 if (leftObstacleSide != null)
//                     TryIntersectionOfConeRightSideAndObstacleSide(coneRightSide, leftObstacleSide);
//             } else {
//                 var seg = (BrokenConeSide) rightNode.Item;
//                 rightNode = rightConeSides.Previous(rightNode);
//                 if (rightNode != null) {
//                     coneRightSide = rightNode.Item as ConeRightSide;
//                     if (coneRightSide != null)
//                         TryIntersectionOfConeRightSideAndObstacleConeSide(coneRightSide, seg);
//                 }
//             }
//         }

//         void TryIntersectionOfConeRightSideAndObstacleConeSide(ConeRightSide coneRightSide,
//             BrokenConeSide seg) {
//             Point x;
//             if (Point.IntervalIntersectsRay(seg.start, seg.End, coneRightSide.start,
//                 coneRightSide.Direction, out x)) {
//                 EnqueueEvent(CreateRightIntersectionEvent(coneRightSide, x, seg.EndVertex));
//                 //Show(CurveFactory.CreateDiamond(3, 3, x));
//             }
//         }

//         void TryIntersectionOfConeRightSideAndObstacleSide(ConeRightSide coneRightSide, ObstacleSide side) {
//             Point x;
//             if (Point.IntervalIntersectsRay(side.start, side.End, coneRightSide.start,
//                 coneRightSide.Direction, out x)) {
//                 EnqueueEvent(CreateRightIntersectionEvent(coneRightSide, x, side.EndVertex));
//                 //Show(CurveFactory.CreateDiamond(3, 3, x));
//             }
//         }

//         void TryIntersectionOfConeLeftSideAndObstacleConeSide(ConeLeftSide coneLeftSide, BrokenConeSide seg) {
//             Point x;
//             if (Point.IntervalIntersectsRay(seg.start, seg.End, coneLeftSide.start, coneLeftSide.Direction, out x)) {
//                 EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, x, seg.EndVertex));
//                 //Show(CurveFactory.CreateDiamond(3, 3, x));
//             }
//         }

//         void TryIntersectionOfConeLeftSideAndObstacleSide(ConeLeftSide coneLeftSide, ObstacleSide side) {
//             Point x;
//             if (Point.IntervalIntersectsRay(side.start, side.End, coneLeftSide.start, coneLeftSide.Direction, out x)) {
//                 EnqueueEvent(new LeftIntersectionEvent(coneLeftSide, x, side.EndVertex));
//                 //    Show(CurveFactory.CreateDiamond(3, 3, x));
//             }
//         }

//         //        static int count;
//         void GoOverConesSeeingVertexEvent(SweepEvent vertexEvent) {
//             RBNode < ConeSide > rbNode = FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(vertexEvent);

//             if (rbNode == null) return;
//             ConeSide coneRightSide = rbNode.Item;
//             Cone cone = coneRightSide.Cone;
//             ConeSide leftConeSide = cone.LeftSide;
//             if (VertexIsToTheLeftOfSegment(vertexEvent, leftConeSide)) return;
//             var visibleCones = new Array < Cone > { cone };
//             coneSideComparer.SetOperand(leftConeSide);
//             rbNode = leftConeSides.Find(leftConeSide);

//             if (rbNode == null) {
//                 double tmpZ = Z;

//                 Z = Math.Max(GetZ(leftConeSide.start), PreviousZ);
//                 //we need to return to the past when the order was still correct
//                 coneSideComparer.SetOperand(leftConeSide);
//                 rbNode = leftConeSides.Find(leftConeSide);
//                 Z = tmpZ;

// #if TEST_MSAGL
//                 if (rbNode == null) {
//                     //GeometryGraph gg = CreateGraphFromObstacles();
//                     //gg.Save("c:\\tmp\\bug");

//                     PrintOutLeftSegTree();
//                     System.Diagnostics.Debug.WriteLine(leftConeSide);
//                     ShowLeftTree(new Ellipse(3, 3, vertexEvent.Site));
//                     ShowRightTree(new Ellipse(3, 3, vertexEvent.Site));
//                 }
// #endif
//             }

//             rbNode = leftConeSides.next(rbNode);
//             while (rbNode != null && !VertexIsToTheLeftOfSegment(vertexEvent, rbNode.Item)) {
//                 visibleCones.Add(rbNode.Item.Cone);
//                 rbNode = leftConeSides.next(rbNode);
//             }

//             //Show(new Ellipse(1, 1, vertexEvent.Site));

//             foreach(Cone c of visibleCones) {
//                 addEdge(c.Apex, vertexEvent.Site);
//                 RemoveCone(c);
//             }
//         }

//         void addEdge(Point a, Point b) {
//             Assert.assert(PortLocations.Contains(a));
//             /*********************
//             A complication arises when we have overlaps. Loose obstacles become large enough to contain several
//             ports. We need to avoid a situation when a port has degree more than one.
//             To avoid this situation we redirect to b every edge incoming into a.
//             Notice that we create a new graph for each AddDiriction call, so all this edges point roughly to the
//             direction of the sweep and the above procedure just alignes the edges better.
//             In the resulting graph, which contains the sum of the graphs passed to AddDirection, of course
//             a port can have an incoming and outcoming edge at the same time
//             *******************/

//             VisibilityEdge ab = visibilityGraph.addEdge(a, b);
//             VisibilityVertex av = ab.Source;
//             Assert.assert(av.point == a && ab.TargetPoint == b);
//             //all edges adjacent to a which are different from ab
//             VisibilityEdge[] edgesToFix =
//                 av.InEdges.Where(e => e != ab).Concat(av.OutEdges.Where(e => e != ab)).ToArray();
//             foreach(VisibilityEdge edge of edgesToFix) {
//                 Point c = (edge.Target == av ? edge.Source : edge.Target).point;
//                 VisibilityGraph.RemoveEdge(edge);
//                 visibilityGraph.addEdge(c, b);
//             }
//         }

// #if TEST_MSAGL
//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1305:SpecifyIFormatProvider", MessageId = "System.Int32.ToString")]
//         static GeometryGraph CreateGraphFromObstacles(IEnumerable < Polyline > obstacles) {
//             var gg = new GeometryGraph();
//             foreach(var ob of obstacles) {
//                 gg.Nodes.Add(new Node(ob.ToCurve()));
//             }
//             return gg;
//         }

//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId = "System.Diagnostics.Debug.WriteLine(System.String)")]
//         void PrintOutLeftSegTree() {
//             System.Diagnostics.Debug.WriteLine("Left cone segments");
//             foreach(var t of leftConeSides)
//             System.Diagnostics.Debug.WriteLine(t);
//             System.Diagnostics.Debug.WriteLine("end of left cone segments");
//         }
// #endif

//         static bool VertexIsToTheLeftOfSegment(SweepEvent vertexEvent, ConeSide seg) {
//             return (Point.getTriangleOrientation(seg.start, seg.start + seg.Direction,
//                 vertexEvent.Site) == TriangleOrientation.Counterclockwise);
//         }

//         static bool VertexIsToTheRightOfSegment(SweepEvent vertexEvent, ConeSide seg) {
//             return (Point.getTriangleOrientation(seg.start, seg.start + seg.Direction,
//                 vertexEvent.Site) == TriangleOrientation.Clockwise);
//         }

//         RBNode < ConeSide > FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(SweepEvent vertexEvent) {
//             return rightConeSides.FindFirst(
//                 s => !VertexIsToTheRightOfSegment(vertexEvent, s)
//             );
//         }

//         void EnqueueEvent(RightVertexEvent vertexEvent) {
//             if (SweepDirection * (vertexEvent.Site - vertexEvent.Vertex.PrevOnPolyline.point) >
//                 ApproximateComparer.Tolerance)
//                 return;
//             //otherwise we enqueue the vertex twice; once as a LeftVertexEvent and once as a RightVertexEvent
//             base.EnqueueEvent(vertexEvent);
//         }
//     }
// }
