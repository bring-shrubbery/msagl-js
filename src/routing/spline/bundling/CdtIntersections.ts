﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Routing;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Check intersections between edges and obstacles using triangulation (faster than kd-tree)
//     // <
//     internal class CdtIntersections {
//         readonly MetroGraphData metroGraphData;
//         readonly BundlingSettings bundlingSettings;

//         internal bool ComputeForcesForBundles = false;

//         public CdtIntersections(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             this.metroGraphData = metroGraphData;
//             this.bundlingSettings = bundlingSettings;
//         }

//         // returns false iff the edge overlap an obstacle
//         // otherwise it calulates distances to the closest obstacles
//         // <
//         internal bool BundleAvoidsObstacles(Station v, Station u, Point vPosition, Point uPosition, double upperBound,
//             out Array<Tuple<Point, Point>> closestDist) {

//         closestDist = new Array<Tuple<Point, Point>>();
//         //return true;

//         Set < Polyline > obstaclesToIgnore = metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(v, u);
//         Map < Polyline, Tuple < Point, Point >> closeObstacles = FindCloseObstaclesForBundle(u.CdtTriangle, uPosition, vPosition, obstaclesToIgnore, upperBound);
//         if (closeObstacles == null) return false;

//         //Polyline bundle = Intersections.Create4gon(vPosition, uPosition, upperBound, upperBound);

//         foreach(var item of closeObstacles) {
//             Tuple < Point, Point > dist = item.Value;

//             //TODO: get rif od this call!
//             //if (!Intersections.ClosedPolylinesIntersect(bundle, obstacle)) continue;
//             //if (!Curve.ClosedCurveInteriorsIntersect(bundle, obstacle)) continue;

//             closestDist.Add(dist);
//         }

//         return true;
//     }

//     // returns null iff the edge overlap an obstacle
//     // <
//     Map < Polyline, Tuple < Point, Point >> FindCloseObstaclesForBundle(CdtTriangle startTriangle, Point start,
//         Point end, Set < Polyline > obstaclesToIgnore,
//         double upperBound) {
//         var obstacles = new Map<Polyline, Tuple<Point, Point>>();
//         Array < CdtTriangle > list;
//         if (!ThreadLineSegmentThroughTriangles(startTriangle, start, end, obstaclesToIgnore, out list))
//             return null;

//         if (!ComputeForcesForBundles && !bundlingSettings.HighestQuality)
//             return obstacles;

//         var checkedSites = new HashSet<CdtSite>();

//         foreach(var t of list) {
//             foreach(var s of t.Sites) {
//                 if (!checkedSites.Add(s)) continue;

//                 var poly = (Polyline) s.Owner;
//                 if (obstaclesToIgnore.Contains(poly)) continue;

//                 PolylinePoint pp = FindPolylinePoint(poly, s.point);
//                 double par11, par12, par21, par22;
//                 double d12 = LineSegment.MinDistBetweenLineSegments(pp.point, pp.NextOnPolyline.point, start, end,
//                     out par11, out par12);
//                 double d22 = LineSegment.MinDistBetweenLineSegments(pp.point, pp.PrevOnPolyline.point, start, end,
//                     out par21, out par22);
//                 Point r1, r2;
//                 double dist;
//                 if (d12 < d22) {
//                     dist = d12;
//                     if (dist > upperBound) continue;
//                     r1 = pp.point + (pp.NextOnPolyline.point - pp.point) * par11;
//                     r2 = start + (end - start) * par12;
//                 }
//                 else {
//                     dist = d22;
//                     if (dist > upperBound) continue;
//                     r1 = pp.point + (pp.PrevOnPolyline.point - pp.point) * par21;
//                     r2 = start + (end - start) * par22;
//                 }
//                 //if (dist > upperBound) continue;

//                 Tuple < Point, Point > currentValue;
//                 if (!obstacles.TryGetValue(poly, out currentValue))
//                     obstacles.Add(poly, new Tuple<Point, Point>(r1, r2));
//             }
//         }

//         return obstacles;
//     }

//     // returns false iff the edge overlap an obstacle
//     // <
//     bool ThreadLineSegmentThroughTriangles(CdtTriangle currentTriangle, Point start, Point end, Set < Polyline > obstaclesToIgnore,
//         out Array < CdtTriangle > triangles) {
//         Assert.assert(Cdt.PointIsInsideOfTriangle(start, currentTriangle));
//         triangles = new Array<CdtTriangle>();

//         if (Cdt.PointIsInsideOfTriangle(end, currentTriangle)) {
//             triangles.Add(currentTriangle);
//             return true;
//         }

//         var threader = new CdtThreader(currentTriangle, start, end);
//         triangles.Add(currentTriangle);

//         while (threader.MoveNext()) {
//             triangles.Add(threader.CurrentTriangle);
//             var piercedEdge = threader.CurrentPiercedEdge;
//             if (piercedEdge.Constrained) {
//                 Assert.assert(piercedEdge.lowerSite.Owner == piercedEdge.upperSite.Owner);
//                 var poly = (Polyline) piercedEdge.lowerSite.Owner;
//                 if (!obstaclesToIgnore.Contains(poly)) return false;
//             }
//         }
//         if (threader.CurrentTriangle != null)
//             triangles.Add(threader.CurrentTriangle);
//         //
//         //            int positiveSign, negativeSign;
//         //            CdtEdge piercedEdge = FindFirstPiercedEdge(currentTriangle, start, end, out negativeSign, out positiveSign,  null);
//         //
//         //            Assert.assert(positiveSign > negativeSign);
//         //
//         //            Assert.assert(piercedEdge != null);
//         //
//         //            do {
//         //                triangles.Add(currentTriangle);
//         //                if (piercedEdge.Constrained) {
//         //                    Assert.assert(piercedEdge.lowerSite.Owner == piercedEdge.upperSite.Owner);
//         //                    Polyline poly = (Polyline)piercedEdge.lowerSite.Owner;
//         //                    if (!obstaclesToIgnore.Contains(poly)) return false;
//         //                }
//         //            }
//         //            while (FindNextPierced(start, end, ref currentTriangle, ref piercedEdge, ref negativeSign, ref positiveSign));
//         //            if (currentTriangle != null)
//         //                triangles.Add(currentTriangle);

//         return true;
//     }

//     internal static PointLocation PointLocationInsideTriangle(Point p, CdtTriangle triangle) {
//         bool seenBoundary = false;
//         for (int i = 0; i < 3; i++) {
//             var area = Point.SignedDoubledTriangleArea(p, triangle.Sites.getItem(i).point, triangle.Sites.getItem(i + 1).point);
//             if (area < -GeomConstants.distanceEpsilon)
//                 return PointLocation.Outside;
//             if (area < GeomConstants.distanceEpsilon)
//                 seenBoundary = true;
//         }

//         return seenBoundary ? PointLocation.Boundary : PointLocation.Inside;
//     }

//         static PolylinePoint FindPolylinePoint(Polyline poly, Point point) {
//         foreach(var ppp of poly.PolylinePoints)
//         if (ppp.point == point)
//             return ppp;

//         throw new NotSupportedException();
//     }

//     // checks if an edge intersects obstacles
//     // otherwise it calulates distances to the closest obstacles
//     // <
//     internal bool EdgeIsLegal(Station v, Station u, Point vPosition, Point uPosition) {
//         Array < CdtTriangle > list;
//         Set < Polyline > obstaclesToIgnore = metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(v, u);
//         return ThreadLineSegmentThroughTriangles(v.CdtTriangle, vPosition, uPosition, obstaclesToIgnore, out list);
//     }

//     // checks if an edge intersects obstacles
//     // otherwise it calulates distances to the closest obstacles
//     // <
//     internal bool EdgeIsLegal(Station v, Station u, Point vPosition, Point uPosition, Set < Polyline > obstaclesToIgnore) {
//         var start = v.Position;

//         CdtTriangle currentTriangle = v.CdtTriangle;
//         Assert.assert(Cdt.PointIsInsideOfTriangle(start, currentTriangle));

//         Point end = u.Position;
//         if (Cdt.PointIsInsideOfTriangle(end, currentTriangle)) {
//             return true;
//         }

//         var threader = new CdtThreader(currentTriangle, start, end);

//         while (threader.MoveNext()) {
//             var piercedEdge = threader.CurrentPiercedEdge;
//             if (piercedEdge.Constrained) {
//                 Assert.assert(piercedEdge.lowerSite.Owner == piercedEdge.upperSite.Owner);
//                 var poly = (Polyline)piercedEdge.lowerSite.Owner;
//                 if (!obstaclesToIgnore.Contains(poly)) return false;
//             }
//         }
//         return true;
//     }

// }
// }
