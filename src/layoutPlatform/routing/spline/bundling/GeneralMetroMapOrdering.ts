// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.DebugHelpers;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // greedy bundle map ordering based on path comparison
//     // <
//     public class GeneralMetroMapOrdering : IMetroMapOrderingAlgorithm {

//         // bundle lines
//         // <
//         readonly Array < Metroline > Metrolines;
//         Map < PointPair, PointPairOrder > bundles;

//         // Initialize bundle graph and build the ordering
//         // <
//         internal GeneralMetroMapOrdering(Array < Metroline > Metrolines) {
//             this.Metrolines = Metrolines;

//             BuildOrder();
//         }

//         // Get the ordering of lines on station u with respect to the edge (u->v)
//         // <
// #if SHARPKIT //http://code.google.com/p/sharpkit/issues/detail?id=203
//         //SharpKit/Colin - Interface implementations
//         public IEnumerable < Metroline > GetOrder(Station u, Station v) {
// #else
//             IEnumerable < Metroline > IMetroMapOrderingAlgorithm.GetOrder(Station u, Station v) {
// #endif
//                 var pointPair = new PointPair(u.Position, v.Position);
//                 var orderedMetrolineListForUv = bundles[pointPair].Metrolines;
//                 if (u.Position == pointPair.First) {
//                     foreach(var Metroline of orderedMetrolineListForUv) {
//                         yield return Metroline;
//                     }
//                 }
//                 else {
//                     for (int i = orderedMetrolineListForUv.Count - 1; i >= 0; i--)
//                     yield return orderedMetrolineListForUv[i];
//                 }
//             }

//         // Get the index of line on the edge (u->v) and node u
//         // <
// #if SHARPKIT //http://code.google.com/p/sharpkit/issues/detail?id=203
//         //SharpKit/Colin - Interface implementations
//         public int GetLineIndexInOrder(Station u, Station v, Metroline Metroline) {
// #else
//                 int IMetroMapOrderingAlgorithm.GetLineIndexInOrder(Station u, Station v, Metroline Metroline) {
// #endif
//                     var edge = new PointPair(u.Position, v.Position);
//                     var reversed = u.Position != edge.First;
//                     var d = bundles[edge].LineIndexInOrder;
//                     return !reversed ? d[Metroline] : d.Count - 1 - d[Metroline];
//                 }

//                 // Do the main job
//                 // <
//                 void BuildOrder() {
//                     bundles = new Map<PointPair, PointPairOrder>();

//                     //initialization
//                     foreach(var Metroline of Metrolines) {
//                         for (var p = Metroline.Polyline.startPoint; p.next != null; p = p.next) {
//                             var e = new PointPair(p.point, p.next.point);
//                             PointPairOrder li;
//                             if (!bundles.TryGetValue(e, out li))
//                                 bundles[e] = li = new PointPairOrder();
//                             li.Add(Metroline);
//                         }
//                     }

//                     foreach(var edge of bundles)
//                     BuildOrder(edge.Key, edge.Value);
//                 }

//                 // Build order for edge (u->v)
//                 // <
//                 void BuildOrder(PointPair pair, PointPairOrder order) {
//                     if (order.orderFixed) return;
//                     order.Metrolines.Sort((line0, line1) => CompareLines(line0, line1, pair.First, pair.Second));

//                     //save order
//                     order.orderFixed = true;
//                     order.LineIndexInOrder = new Map<Metroline, int>();
//                     for (int i = 0; i < order.Metrolines.Count; i++)
//                     order.LineIndexInOrder[order.Metrolines[i]] = i;
//                 }

//                 // Compare two lines on station u with respect to edge (u->v)
//                 // <
//                 int CompareLines(Metroline ml0, Metroline ml1, Point u, Point v) {
//                     PolylinePoint polylinePoint0;
//                     Func < PolylinePoint, PolylinePoint > next0;
//                     Func < PolylinePoint, PolylinePoint > prev0;
//                     FindStationOnLine(u, v, ml0, out polylinePoint0, out next0, out prev0);
//                     PolylinePoint polylinePoint1;
//                     Func < PolylinePoint, PolylinePoint > next1;
//                     Func < PolylinePoint, PolylinePoint > prev1;
//                     FindStationOnLine(u, v, ml1, out polylinePoint1, out next1, out prev1);

//                     //go backward
//                     var p0 = polylinePoint0;
//                     var p1 = polylinePoint1;
//                     PolylinePoint p00, p11 = null;

//                     while ((p00 = prev0(p0)) != null && (p11 = prev1(p1)) != null && p00.point == p11.point) {
//                         var edge = new PointPair(p00.point, p0.point);
//                         if (bundles[edge].orderFixed) {
//                             return CompareOnFixedOrder(edge, ml0, ml1, p00.point != edge.First);
//                         }
//                         p0 = p00;
//                         p1 = p11;
//                     }

//                     if (p00 != null && p11 != null) {   //we have a backward fork
//                         var forkBase = p0.point;
//                         return IsLeft(next0(p0).point - forkBase,
//                             p00.point - forkBase,
//                             p11.point - forkBase);
//                     }

//                     //go forward
//                     p0 = polylinePoint0;
//                     p1 = polylinePoint1;
//                     while ((p00 = next0(p0)) != null && (p11 = next1(p1)) != null && p00.point == p11.point) {
//                         var edge = new PointPair(p00.point, p0.point);

//                         if (bundles[edge].orderFixed)
//                             return CompareOnFixedOrder(edge, ml0, ml1, p0.point != edge.First);
//                         p0 = p00;
//                         p1 = p11;
//                     }

//                     if (p00 != null && p11 != null) {//compare forward fork
//                         var forkBase = p0.point;
//                         return -IsLeft(prev0(p0).point - forkBase,
//                             p00.point - forkBase,
//                             p11.point - forkBase);
//                     }

//                     //these are multiple edges
//                     return ml0.Index.CompareTo(ml1.Index);
//                 }

//                 int CompareOnFixedOrder(PointPair edge, Metroline ml0, Metroline ml1, bool reverse) {
//                     var mlToIndex = bundles[edge].LineIndexInOrder;
//                     int r = reverse ? -1 : 1;
//                     return r * mlToIndex[ml0].CompareTo(mlToIndex[ml1]);
//                 }

//                 // Reimplement it in more efficient way!!! (cache indexes)
//                 // <
//                 void FindStationOnLine(Point u, Point v, Metroline Metroline, out PolylinePoint polyPoint, out Func < PolylinePoint, PolylinePoint > next,
//                     out Func < PolylinePoint, PolylinePoint > prev) {

//                     for (var p = Metroline.Polyline.startPoint; p.next != null; p = p.next) {
//                         if (p.point == u && p.next.point == v) {
//                             next = Next;
//                             prev = Prev;
//                             polyPoint = p;
//                             return;
//                         }

//                         if (p.point == v && p.next.point == u) {
//                             prev = Next;
//                             next = Prev;
//                             polyPoint = p.next;
//                             return;
//                         }
//                     }
//                     throw new Error();
//                 }

//         static PolylinePoint Next(PolylinePoint p) {
//                     return p.next;
//                 }
//         static PolylinePoint Prev(PolylinePoint p) {
//                     return p.Prev;
//                 }

//         // Compare polar angles of v1 and v2 with respect to v0
//         // (v1 lyes to the left of v2 ?)
//         // <
//         // <returns>
//         //  -1  if v1 lyes to the left of v2
//         //   1  if v1 lyes to the right of v2
//         //   0  if v1 and v2 are collinear (and codirectinal)

//         static int IsLeft(Point v0, Point v1, Point v2) {
//                     return Point.GetOrientationOf3Vectors(v0, v1, v2);
//                 }
//             }

//         }
