// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// #if TEST_MSAGL && TEST_MSAGL
// using Microsoft.Msagl.DebugHelpers;
// #endif

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     internal class FlipSwitcher {
//         readonly MetroGraphData metroGraphData;

//         Map<Polyline, EdgeGeometry> polylineToEdgeGeom = new Map<Polyline, EdgeGeometry>();
//         Map<Point, Set<PolylinePoint>> pathsThroughPoints = new Map<Point, Set<PolylinePoint>>();
//     Set < Point > interestingPoints = new Set<Point>();
//     int numberOfReducedCrossings;

//     IEnumerable < Polyline > Polylines {
//         get { return polylineToEdgeGeom.Keys; }
//     }

//     internal FlipSwitcher(MetroGraphData metroGraphData) {
//         this.metroGraphData = metroGraphData;
//     }

//     internal void Run() {
//         //TimeMeasurer.DebugOutput("switching flips...");
//         Init();
//         SwitchFlips();
//     }

//     void Init() {
//         foreach(EdgeGeometry e of metroGraphData.Edges)
//         polylineToEdgeGeom[(Polyline)e.Curve] = e;

//         foreach(Polyline poly of Polylines)
//         RegisterPolylinePointInPathsThrough(poly.PolylinePoints);
//     }

//     void RegisterPolylinePointInPathsThrough(IEnumerable < PolylinePoint > points) {
//         foreach(var pp of points)
//         RegisterPolylinePointInPathsThrough(pp);
//     }

//     void RegisterPolylinePointInPathsThrough(PolylinePoint pp) {
//         CollectionUtilities.AddToMap(pathsThroughPoints, pp.point, pp);
//     }

//     void UnregisterPolylinePointInPathsThrough(IEnumerable < PolylinePoint > points) {
//         foreach(var pp of points)
//         UnregisterPolylinePointInPathsThrough(pp);
//     }

//     void UnregisterPolylinePointInPathsThrough(PolylinePoint pp) {
//         CollectionUtilities.RemoveFromMap(pathsThroughPoints, pp.point, pp);
//     }

//     void SwitchFlips() {
//         var queued = new Set<Polyline>(Polylines);
//         var queue = new Queue<Polyline>();
//         foreach(Polyline e of Polylines)
//         queue.Enqueue(e);
//         while (queue.Count > 0) {
//             Polyline initialPolyline = queue.Dequeue();
//             queued.Remove(initialPolyline);
//             Polyline changedPolyline = ProcessPolyline(initialPolyline);
//             if (changedPolyline != null) {
//                 //we changed both polylines
//                 if (!queued.Contains(initialPolyline)) {
//                     queued.Insert(initialPolyline);
//                     queue.Enqueue(initialPolyline);
//                 }
//                 if (!queued.Contains(changedPolyline)) {
//                     queued.Insert(changedPolyline);
//                     queue.Enqueue(changedPolyline);
//                 }
//             }
//         }
//     }

//     Polyline ProcessPolyline(Polyline polyline) {
//         var departed = new Map<Polyline, PolylinePoint>();
//         for (PolylinePoint pp = polyline.startPoint.next; pp != null; pp = pp.next) {
//             FillDepartedPolylinePoints(pp, departed);

//             //find returning
//             foreach(PolylinePoint polyPoint of pathsThroughPoints[pp.point]) {
//                 if (departed.ContainsKey(polyPoint.Polyline)) {
//                     if (ProcessFlip(polyline, polyPoint.Polyline, departed[polyPoint.Polyline].point, pp.point))
//                         return polyPoint.Polyline;
//                     departed.Remove(polyPoint.Polyline);
//                 }
//             }
//         }

//         return null;
//     }

//     void FillDepartedPolylinePoints(PolylinePoint pp, Map < Polyline, PolylinePoint > departed) {
//         Point prevPoint = pp.Prev.point;
//         foreach(PolylinePoint polyPoint of pathsThroughPoints[prevPoint]) {
//             if (!IsNeighbor(polyPoint, pp)) {
//                 Assert.assert(!departed.ContainsKey(polyPoint.Polyline));
//                 departed[polyPoint.Polyline] = polyPoint;
//             }
//         }
//     }

//     bool ProcessFlip(Polyline polylineA, Polyline polylineB, Point flipStart, Point flipEnd) {
//         //temporary switching polylines of the same width only
//         //need to check capacities here
//         if (polylineToEdgeGeom[polylineA].LineWidth != polylineToEdgeGeom[polylineB].LineWidth) return false;
//         PolylinePoint aFirst, aLast, bFirst, bLast;
//         bool forwardOrderA, forwardOrderB;
//         FindPointsOnPolyline(polylineA, flipStart, flipEnd, out aFirst, out aLast, out forwardOrderA);
//         FindPointsOnPolyline(polylineB, flipStart, flipEnd, out bFirst, out bLast, out forwardOrderB);
//         Assert.assert(PolylinePointsAreInForwardOrder(aFirst, aLast) == forwardOrderA);
//         Assert.assert(PolylinePointsAreInForwardOrder(bFirst, bLast) == forwardOrderB);

//         //0 - the end
//         //1 - not intersect
//         //2 - intersect
//         int rel1 = FindRelationOnFirstPoint(aFirst, bFirst, forwardOrderA, forwardOrderB);
//         int rel2 = FindRelationOnLastPoint(aLast, bLast, forwardOrderA, forwardOrderB);

//         //no intersection on both sides
//         if (rel1 != 2 && rel2 != 2) return false;
//         //can't swap to reduce crossings
//         if (rel1 == 1 || rel2 == 1) return false;

//         //unregister
//         UnregisterPolylinePointInPathsThrough(polylineA.PolylinePoints);
//         UnregisterPolylinePointInPathsThrough(polylineB.PolylinePoints);

//         //switching
//         Swap(aFirst, bFirst, aLast, bLast, forwardOrderA, forwardOrderB);

//         //register back
//         RegisterPolylinePointInPathsThrough(polylineA.PolylinePoints);
//         RegisterPolylinePointInPathsThrough(polylineB.PolylinePoints);

//         RegisterInterestingPoint(aFirst.point);
//         RegisterInterestingPoint(aLast.point);
//         numberOfReducedCrossings++;

//         /*dc = new Array<DebugCurve>();
//         Polyline pl = new Polyline(polylineA);
//         pl.Shift(new Point(1, 0));
//         dc.Add(new DebugCurve("blue", pl));
//         dc.Add(new DebugCurve("red", polylineB));
//         LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dc);*/

//         return true;
//     }

//     void FindPointsOnPolyline(Polyline polyline, Point first, Point last,
//         out PolylinePoint ppFirst, out PolylinePoint ppLast, out bool forwardOrder) {
//         ppFirst = ppLast = null;
//         forwardOrder = false;
//         for (PolylinePoint pp = polyline.startPoint; pp != null; pp = pp.next) {
//             if (pp.point == first) ppFirst = pp;
//             if (pp.point == last) ppLast = pp;
//             if (ppFirst != null && ppLast == null) forwardOrder = true;
//             if (ppFirst == null && ppLast != null) forwardOrder = false;
//         }
//         Assert.assert(ppFirst != null && ppLast != null);
//     }

//     bool PolylinePointsAreInForwardOrder(PolylinePoint u, PolylinePoint v) {
//         Assert.assert(u.Polyline == v.Polyline);
//         for (PolylinePoint p = u; p != null; p = p.next)
//         if (p == v) return true;
//         return false;
//     }

//     PolylinePoint Next(PolylinePoint p, bool forwardOrder) {
//         return forwardOrder ? p.next : p.Prev;
//     }

//     PolylinePoint Prev(PolylinePoint p, bool forwardOrder) {
//         return forwardOrder ? p.Prev : p.next;
//     }

//     int FindRelationOnFirstPoint(PolylinePoint aFirst, PolylinePoint bFirst, bool forwardOrderA, bool forwardOrderB) {
//         Assert.assert(aFirst.point == bFirst.point);

//         PolylinePoint a0 = aFirst;
//         PolylinePoint b0 = bFirst;
//         while (true) {
//             PolylinePoint prevA = Prev(aFirst, forwardOrderA);
//             PolylinePoint prevB = Prev(bFirst, forwardOrderB);

//             if (prevA == null || prevB == null) {
//                 Assert.assert(prevA == null && prevB == null);
//                 return 0;
//             }

//             if (prevA.point != prevB.point) break;

//             aFirst = prevA;
//             bFirst = prevB;
//         }

//         return PolylinesIntersect(a0, b0, aFirst, bFirst, forwardOrderA, forwardOrderB);
//     }

//     int FindRelationOnLastPoint(PolylinePoint aLast, PolylinePoint bLast, bool forwardOrderA, bool forwardOrderB) {
//         Assert.assert(aLast.point == bLast.point);

//         PolylinePoint a0 = aLast;
//         PolylinePoint b0 = bLast;
//         while (true) {
//             PolylinePoint nextA = Next(aLast, forwardOrderA);
//             PolylinePoint nextB = Next(bLast, forwardOrderB);

//             if (nextA == null || nextB == null) {
//                 Assert.assert(nextA == null && nextB == null);
//                 return 0;
//             }

//             if (nextA.point != nextB.point) break;

//             aLast = nextA;
//             bLast = nextB;
//         }

//         while (Next(aLast, forwardOrderA).point == Prev(bLast, forwardOrderB).point) {
//             aLast = Next(aLast, forwardOrderA);
//             bLast = Prev(bLast, forwardOrderB);
//         }

//         return PolylinesIntersect(aLast, bLast, a0, b0, forwardOrderA, forwardOrderB);
//     }

//     int PolylinesIntersect(PolylinePoint a0, PolylinePoint b0, PolylinePoint a1, PolylinePoint b1, bool forwardOrderA, bool forwardOrderB) {
//         PolylinePoint a0p = Prev(a0, forwardOrderA);
//         PolylinePoint a0n = Next(a0, forwardOrderA);
//         PolylinePoint a1n = Next(a1, forwardOrderA);
//         PolylinePoint a1p = Prev(a1, forwardOrderA);
//         PolylinePoint b0n = Next(b0, forwardOrderB);
//         PolylinePoint b1p = Prev(b1, forwardOrderB);

//         if (a0.point == a1.point) {
//             Point bs = a0.point;
//             int left0 = Point.GetOrientationOf3Vectors(a1p.point - bs, b1p.point - bs, a0n.point - bs);
//             int left1 = Point.GetOrientationOf3Vectors(a1p.point - bs, b0n.point - bs, a0n.point - bs);
//             /*
//             if (left0 == 0 || left1 ==0) {
//                 Array<DebugCurve> dc = new Array<DebugCurve>();
//                 Polyline pl = new Polyline(a0.Polyline);
//                 Point sh = new Point(3, 0);
//                 pl.Shift(sh);
//                 dc.Add(new DebugCurve(100,1,"blue", a0.Polyline));
//                 dc.Add(new DebugCurve(100,1,"black", b0.Polyline));

//                 dc.Add(new DebugCurve("blue", CurveFactory.CreateCircle(3, bs)));

//                 dc.Add(new DebugCurve(100,0.5, "blue", new LineSegment(a0p.point, bs)));
//                 dc.Add(new DebugCurve("red", CurveFactory.CreateCircle(5, b0.point)));
//                 dc.Add(new DebugCurve("red", CurveFactory.CreateCircle(10, b1.point)));
//                 LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dc);
//             } */
//             Assert.assert(left0 != 0 && left1 != 0);
//             return left0 == left1 ? 1 : 2;
//         }
//         else {
//             int left0 = Point.GetOrientationOf3Vectors(a0p.point - a0.point, a0n.point - a0.point, b0n.point - a0.point);
//             int left1 = Point.GetOrientationOf3Vectors(a1n.point - a1.point, b1p.point - a1.point, a1p.point - a1.point);
//             Assert.assert(left0 != 0 && left1 != 0);
//             return left0 == left1 ? 1 : 2;
//         }
//     }

//     void Swap(PolylinePoint aFirst, PolylinePoint bFirst, PolylinePoint aLast, PolylinePoint bLast, bool forwardOrderA, bool forwardOrderB) {
//         Array < PolylinePoint > intermediateAPoints = GetRangeOnPolyline(Next(aFirst, forwardOrderA), aLast, forwardOrderA);
//         Array < PolylinePoint > intermediateBPoints = GetRangeOnPolyline(Next(bFirst, forwardOrderB), bLast, forwardOrderB);

//         //changing a
//         ChangePolylineSegment(aFirst, aLast, forwardOrderA, intermediateBPoints);

//         //changing b
//         ChangePolylineSegment(bFirst, bLast, forwardOrderB, intermediateAPoints);

//         //resulting polylines might have cycles
//         PathFixer.RemoveSelfCyclesFromPolyline(aFirst.Polyline);
//         Assert.assert(PolylineIsOK(aFirst.Polyline));

//         PathFixer.RemoveSelfCyclesFromPolyline(bFirst.Polyline);
//         Assert.assert(PolylineIsOK(bFirst.Polyline));
//     }

//     void ChangePolylineSegment(PolylinePoint aFirst, PolylinePoint aLast, bool forwardOrderA, Array < PolylinePoint > intermediateBPoints) {
//         PolylinePoint curA = aFirst;
//         foreach(PolylinePoint b of intermediateBPoints) {
//             var newp = new PolylinePoint(b.point) { Polyline = curA.Polyline };
//             if (forwardOrderA) {
//                 newp.Prev = curA;
//                 curA.next = newp;
//             }
//             else {
//                 newp.next = curA;
//                 curA.Prev = newp;
//             }
//             curA = newp;
//         }
//         if (forwardOrderA) {
//             curA.next = aLast;
//             aLast.Prev = curA;
//         }
//         else {
//             curA.Prev = aLast;
//             aLast.next = curA;
//         }
//     }

//     Array < PolylinePoint > GetRangeOnPolyline(PolylinePoint start, PolylinePoint end, bool forwardOrder) {
//         Array < PolylinePoint > res = new Array<PolylinePoint>();
//         for (PolylinePoint pp = start; pp != end; pp = Next(pp, forwardOrder))
//         res.Add(pp);

//         return res;
//     }

//     bool IsNeighbor(PolylinePoint a, PolylinePoint b) {
//         return a.Prev != null && a.Prev.point == b.point || a.next != null && a.next.point == b.point;
//     }

//     void RegisterInterestingPoint(Point p) {
//         if (!interestingPoints.Contains(p))
//             interestingPoints.Insert(p);
//     }

//     internal Set < Point > GetChangedHubs() {
//         return interestingPoints;
//     }

//     internal int NumberOfReducedCrossings() {
//         return numberOfReducedCrossings;
//     }

//     bool PolylineIsOK(Polyline poly) {
//         HashSet < Point > pointsToPP = new HashSet<Point>();
//         for (var pp = poly.startPoint; pp != null; pp = pp.next) {
//             if (pp == poly.startPoint) {
//                 if (pp.Prev != null) return false;
//             }
//             else {
//                 if (pp.Prev.next != pp) return false;
//             }
//             if (pp == poly.endPoint) {
//                 if (pp.next != null) return false;
//             }
//             else {
//                 if (pp.next.Prev != pp) return false;
//             }

//             if (pointsToPP.Contains(pp.point)) return false;
//             pointsToPP.Add(pp.point);
//         }

//         if (poly.startPoint.Prev != null) return false;
//         if (poly.endPoint.next != null) return false;
//         return true;
//     }
// }
// }
