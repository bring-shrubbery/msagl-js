// using System;
// using System.Collections.Generic;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     internal class PathFixer {
//         MetroGraphData metroGraphData;
//         Func<Metroline, Point, bool> polylineAcceptsPoint;
//         Set<Point> foundCrossings = new Set<Point>();
//         Set<Point> crossingsThatShouldBecomeHubs = new Set<Point>();
//         Set<Point> pointsToDelete;

//         public PathFixer(MetroGraphData metroGraphData, Func<Metroline, Point, bool> polylineAcceptsPoint) {
//         this.metroGraphData = metroGraphData;
//         this.polylineAcceptsPoint = polylineAcceptsPoint;
//     }

//     IEnumerable < PolylinePoint > Vertices() {
//         return metroGraphData.Edges.Select(e => (Polyline)e.Curve).SelectMany(p => p.PolylinePoints);
//     }

//     IEnumerable < Polyline > Polylines { get { return metroGraphData.Edges.Select(e => (Polyline)e.Curve); } }

//     IEnumerable < PointPair > Edges() {
//         var set = new Set<PointPair>();
//         foreach(var poly of Polylines)
//         for (var pp = poly.startPoint; pp.next != null; pp = pp.next)
//             set.Insert(FlipCollapser.OrderedPair(pp));
//         return set;
//     }

//     internal bool Run() {
//         if (metroGraphData.Edges.Count() == 0) return false;

//         var splittingPoints = new Dictionary<PointPair, List<Point>>();
//         var treeOfVertices = new RTree<Point, P>();
//         foreach(var vertex of Vertices()) {
//             var r = new Rectangle(vertex.point);
//             r.Pad(ApproximateComparer.IntersectionEpsilon);
//             treeOfVertices.Add(r, vertex.point);
//         }

//         var treeOfEdges = RectangleNode<PointPair, Point>.CreateRectangleNodeOnData(Edges(), e => new Rectangle(e.First, e.Second));
//         RectangleNodeUtils.CrossRectangleNodes<PointPair>(treeOfEdges, treeOfEdges, (a, b) => IntersectTwoEdges(a, b, splittingPoints, treeOfVertices));

//         SortInsertedPoints(splittingPoints);
//         bool pointsInserted = InsertPointsIntoPolylines(splittingPoints);

//         bool progress = FixPaths();

//         bool pointsRemoved = RemoveUnimportantCrossings();

//         return progress || pointsInserted || pointsRemoved;
//     }

//     bool FixPaths() {
//         bool progress = false;
//         if (RemoveSelfCycles()) progress = true;
//         //if (CollapseCycles()) progress = true;
//         if (ReduceEdgeCrossings()) progress = true;
//         return progress;
//     }

//     void SortInsertedPoints(Dictionary < PointPair, List < Point >> splittingPoints) {
//         foreach(var pair of splittingPoints)
//         SortInsideSegment(pair.Key, pair.Value);
//     }

//     void SortInsideSegment(PointPair edge, List < Point > list) {
//         Assert.assert(list.Count > 0, "an edge should not be present with an empty list");
//         list.Sort((a, b) => (a - edge.First).Length.CompareTo((b - edge.First).Length));
//     }

//     bool InsertPointsIntoPolylines(Dictionary < PointPair, List < Point >> splittingPoints) {
//         bool inserted = false;
//         foreach(var metroline of metroGraphData.Metrolines) {
//             if (InsertPointsIntoPolyline(metroline, splittingPoints))
//                 inserted = true;
//         }
//         return inserted;
//     }

//     bool InsertPointsIntoPolyline(Metroline metroline, Dictionary < PointPair, List < Point >> splittingPoints) {
//         bool inserted = false;
//         for (var pp = metroline.Polyline.startPoint; pp.next != null; pp = pp.next)
//             if (InsertPointsOnPolypoint(pp, splittingPoints, metroline)) inserted = true;
//         return inserted;
//     }

//     bool InsertPointsOnPolypoint(PolylinePoint pp, Dictionary < PointPair, List < Point >> splittingPoints, Metroline metroline) {
//         var pointPair = FlipCollapser.OrderedPair(pp);
//         var reversed = pp.point != pointPair.First;
//         List < Point > list;
//         if (!splittingPoints.TryGetValue(pointPair, out list))
//             return false;

//         var endPolyPoint = pp.next;
//         var poly = pp.Polyline;
//         if (reversed)
//             for (int i = list.Count - 1; i >= 0; i--) {
//             if (polylineAcceptsPoint != null && !polylineAcceptsPoint(metroline, list[i])) continue;
//             var p = new PolylinePoint(list[i]) { Prev = pp, Polyline = poly };
//             pp.next = p;
//             pp = p;
//         }
//             else
//         for (int i = 0; i < list.Count; i++) {
//             if (polylineAcceptsPoint != null && !polylineAcceptsPoint(metroline, list[i])) continue;
//             var p = new PolylinePoint(list[i]) { Prev = pp, Polyline = poly };
//             pp.next = p;
//             pp = p;
//         }
//         pp.next = endPolyPoint;
//         endPolyPoint.Prev = pp;
//         return true;
//     }

//     bool RemoveSelfCycles() {
//         bool progress = false;
//         foreach(var poly of Polylines)
//         if (RemoveSelfCyclesFromPolyline(poly)) progress = true;
//         return progress;
//     }

//     //returns removed points
//     internal static bool RemoveSelfCyclesFromPolyline(Polyline poly) {
//         bool progress = false;
//         Dictionary < Point, PolylinePoint > pointsToPp = new Dictionary<Point, PolylinePoint>();
//         for (var pp = poly.startPoint; pp != null; pp = pp.next) {
//             var point = pp.point;
//             PolylinePoint previous;

//             if (pointsToPp.TryGetValue(point, out previous)) {//we have a cycle
//                 for (var px = previous.next; px != pp.next; px = px.next) {
//                     pointsToPp.Remove(px.point);
//                 }
//                 previous.next = pp.next;
//                 pp.next.Prev = previous;
//                 progress = true;
//             }
//             else
//                 pointsToPp[pp.point] = pp;
//         }
//         return progress;
//     }

//     //bool CollapseCycles() {
//     //    var cycleCollapser = new FlipCollapser(metroGraphData, bundlingSettings, cdt);
//     //    cycleCollapser.Run();
//     //    crossingsThatShouldBecomeHubs.InsertRange(cycleCollapser.GetChangedCrossing());
//     //    //TimeMeasurer.DebugOutput("#crossingsThatShouldBecomeHubs = " + crossingsThatShouldBecomeHubs.Count);
//     //    return false;
//     //}

//     bool ReduceEdgeCrossings() {
//         var cycleCollapser = new FlipSwitcher(metroGraphData);
//         cycleCollapser.Run();
//         crossingsThatShouldBecomeHubs.InsertRange(cycleCollapser.GetChangedHubs());
//         //TimeMeasurer.DebugOutput("#reduced crossings = " + cycleCollapser.NumberOfReducedCrossings());
//         return cycleCollapser.NumberOfReducedCrossings() > 0;
//     }

//     bool RemoveUnimportantCrossings() {
//         bool removed = false;
//         pointsToDelete = foundCrossings - crossingsThatShouldBecomeHubs;
//         foreach(var polyline of Polylines)
//         if (RemoveUnimportantCrossingsFromPolyline(polyline)) removed = true;
//         return removed;
//     }

//     bool RemoveUnimportantCrossingsFromPolyline(Polyline polyline) {
//         bool removed = false;
//         for (var p = polyline.startPoint.next; p != null && p.next != null; p = p.next)
//             if (pointsToDelete.Contains(p.point) && Point.getTriangleOrientation(p.Prev.point, p.point, p.next.point) == TriangleOrientation.Collinear) {
//                 //forget p
//                 var pp = p.Prev;
//                 var pn = p.next;
//                 pp.next = pn;
//                 pn.Prev = pp;
//                 p = pp;
//                 removed = true;
//             }
//         return removed;
//     }

//     void IntersectTwoEdges(PointPair a, PointPair b, Dictionary < PointPair, List < Point >> splittingPoints, RTree < Point > tree) {
//         Point x;
//         if (LineSegment.Intersect(a.First, a.Second, b.First, b.Second, out x)) {
//             Point vertex = FindExistingVertexOrCreateNew(tree, x);
//             if (AddVertexToSplittingList(a, splittingPoints, vertex) |
//                 AddVertexToSplittingList(b, splittingPoints, vertex))
//                 foundCrossings.Insert(vertex);
//         }
//     }

//     Point FindExistingVertexOrCreateNew(RTree < Point > tree, Point x) {
//         var p = tree.RootNode.FirstHitNode(x);
//         if (p != null)
//             return p.UserData;

//         var rect = new Rectangle(x);
//         rect.Pad(ApproximateComparer.IntersectionEpsilon);
//         tree.Add(rect, x);
//         return x;
//     }

//     bool AddVertexToSplittingList(PointPair a, Dictionary < PointPair, List < Point >> splittingPoints, Point intersectionPoint) {
// #if TEST_MSAGL && TEST_MSAGL
//         double t;
//         Assert.assert(Point.DistToLineSegment(intersectionPoint, a.First, a.Second, out t) < ApproximateComparer.IntersectionEpsilon);
// #endif
//         if (!ApproximateComparer.CloseIntersections(intersectionPoint, a.First) &&
//             !ApproximateComparer.CloseIntersections(intersectionPoint, a.Second)) {
//             List < Point > list;
//             if (!splittingPoints.TryGetValue(a, out list))
//                 splittingPoints[a] = list = new List<Point>();
//             if (!list.Contains(intersectionPoint)) {
//                 list.Add(intersectionPoint);
//                 return true;
//             }
//         }
//         return false;
//     }
// }
// }
