﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.Core.Routing;
// #if TEST_MSAGL && TEST_MSAGL
// using Microsoft.Msagl.DebugHelpers;
// #endif
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     internal class FlipCollapser {
//         readonly MetroGraphData metroGraphData;
//         readonly BundlingSettings bundlingSettings;
//         readonly Cdt cdt;

//         internal FlipCollapser(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, Cdt cdt) {
//             this.metroGraphData = metroGraphData;
//             this.bundlingSettings = bundlingSettings;
//             this.cdt = cdt;
//         }

//         //        void ShowFlip(Polyline a, Polyline b) {
//         //            var l = new Array<DebugCurve>();
//         //
//         //            l.AddRange(
//         //                Cdt.GetTriangles().Select(
//         //                    t => new DebugCurve(100, 1, "green", new Polyline(t.Sites.Select(v => v.point)) {Closed = true})));
//         //            l.AddRange(new[] {
//         //                                 new DebugCurve(120, 1, "red", a),
//         //                                 new DebugCurve(120, 1, "blue", b)
//         //                             });
//         //            LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
//         //        }

//         /*
//                 Array<CdtEdge> GetCdtEdgesCrossedBySegmentStartingFromSiteAtStart(CdtSiteFeature f, PolylinePoint pp, out CdtFeature nextFeature) {
//                     Assert.assert(f.Prev == null);
//                     var ret = new Array<CdtEdge>();
//                     var site = f.Site;
//                     foreach (var t of site.Triangles) {
//                         var si = t.Sites.Index(site);
//                         if (Point.PointIsInsideCone(pp.point, site.point, t.Sites.getItem(si + 1].point, t.Sites[si + 2).point)) {
//                             if (Point.getTriangleOrientation(pp.point, t.Sites.getItem(si + 1].point, t.Sites[si + 2).point) ==
//                                 TriangleOrientation.Collinear) {//pp belongs to the edge [si+1]
//                                 ret.Add(t.Edges[si + 1]);
//                                 if (Point.getTriangleOrientation(site.point, t.Sites.getItem(si + 1).point, pp.point) ==
//                                     TriangleOrientation.Collinear)
//                                     nextFeature = new CdtSiteFeature(t.Sites.getItem(si + 1), f) {Prev = f};
//                                 else if (Point.getTriangleOrientation(site.point, t.Sites.getItem(si + 2).point, pp.point) ==
//                                          TriangleOrientation.Collinear)
//                                     nextFeature = new CdtSiteFeature(t.Sites.getItem(si + 2), f) {Prev = f};
//                                 else
//                                     nextFeature = new CdtEdgeFeature(t.Edges[si + 1], pp.point, f) {Prev = f};
//                             }
//                         }
//                     }
//                 }
//         */

//         /*
//                 Set<CdtEdge> GetCdtEdgesCrossedByPath0(Array<PolylinePoint> polyPoints) {
//                     PolylinePoint prevPolyPoint = null, prevPrevPolyPoint=null;
//                     var ret = new Set<CdtEdge>();
//                     foreach (var polylinePoint of polyPoints) {
//                         if (prevPolyPoint!=null)
//                             ret.InsertRange(GetCdtEdgesCrossedBySegment(prevPrevPolyPoint, prevPolyPoint, polylinePoint));

//                         prevPrevPolyPoint = prevPolyPoint;
//                         prevPolyPoint = polylinePoint;
//                     }
//         //            var l = new Array<DebugCurve>();
//         //
//         //            l.AddRange(
//         //                Cdt.GetTriangles().Select(
//         //                    t => new DebugCurve(100, 1, "green", new Polyline(t.Sites.Select(v => v.point)) {Closed = true})));
//         //            l.Add(new DebugCurve(150,2,"blue",new Polyline(polyPoints)));
//         //          l.AddRange(ret.Select(e=>new DebugCurve(200,2,"brown", new LineSegment(e.upperSite.point,e.lowerSite.point))));
//         //            LayoutAlgorithmSettings.ShowDebugCurves(l.ToArray());
//         //
//                     return ret;
//                 }
//         */

//         /*
//                 Array<CdtEdge> GetCdtEdgesCrossedBySegment(PolylinePoint prevA, PolylinePoint a, PolylinePoint b) {
//                     var pp = new PointPair(a.point, b.point);
//                     Array<CdtEdge> intersections;
//                     if (segsToCdtEdges.TryGetValue(pp, out intersections))
//                         return intersections;
//                     return segsToCdtEdges[pp] = Cdt.GetCdtEdgesCrossedBySegment(prevA, a, b);
//                 }
//         */

//         internal static PointPair OrderedPair(PolylinePoint pp) {
//             return OrderedPair(pp, pp.next);
//         }

//         static PointPair OrderedPair(PolylinePoint p0, PolylinePoint p1) {
//             return new PointPair(p0.point, p1.point);
//         }
//     }
// }
