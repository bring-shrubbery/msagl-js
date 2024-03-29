// using System.Collections.Generic;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     internal class CdtThreader {
//         readonly Point start;
//         readonly Point end;
//         int positiveSign;
//         int negativeSign;
//         CdtEdge currentPiercedEdge;
//         internal CdtEdge CurrentPiercedEdge { get { return currentPiercedEdge; } }
//     CdtTriangle currentTriangle;
//     internal CdtTriangle CurrentTriangle { get { return currentTriangle; } }

//     internal CdtThreader(CdtTriangle startTriangle, Point start, Point end) {
//         Assert.assert(PointLocationForTriangle(start, startTriangle) != PointLocation.Outside);
//         currentTriangle = startTriangle;
//         this.start = start;
//         this.end = end;
//     }

// #if TEST_MSAGL || DEVTRACE
//     internal Array < CdtTriangle > Triangles() {
//         while (MoveNext())
//             yield return CurrentTriangle;
//     }
// #endif

//     internal CdtEdge FindFirstPiercedEdge() {
//         Assert.assert(PointLocationForTriangle(start, currentTriangle) != PointLocation.Outside);
//         Assert.assert(PointLocationForTriangle(end, currentTriangle) == PointLocation.Outside);

//         var sign0 = GetHyperplaneSign(currentTriangle.Sites.getItem(0));
//         var sign1 = GetHyperplaneSign(currentTriangle.Sites.getItem(1));
//         if (sign0 != sign1) {
//             if (Point.getTriangleOrientation(end, currentTriangle.Sites.getItem(0].point, currentTriangle.Sites[1).point) == TriangleOrientation.Clockwise) {
//                 positiveSign = sign0;
//                 negativeSign = sign1;
//                 return currentTriangle.Edges[0];
//             }
//         }
//         var sign2 = GetHyperplaneSign(currentTriangle.Sites.getItem(2));
//         if (sign1 != sign2) {
//             if (Point.getTriangleOrientation(end, currentTriangle.Sites.getItem(1].point, currentTriangle.Sites[2).point) == TriangleOrientation.Clockwise) {
//                 positiveSign = sign1;
//                 negativeSign = sign2;
//                 return currentTriangle.Edges[1];
//             }
//         }

//         positiveSign = sign2;
//         negativeSign = sign0;
//         /*
//         if (positiveSign <= negativeSign) {
//             //if (cdt != null) {
//             //    Stream stream = File.Open(@"c:/tmp/triangles", FileMode.Create);
//             //    BinaryFormatter bformatter = new BinaryFormatter();

//             //    bformatter.Serialize(stream,  cdt.GetTriangles().ToArray());
//             //    bformatter.Serialize(stream, start);
//             //    bformatter.Serialize(stream, end);
//             //    stream.Close();

//             //}

//            var  l = new Array<DebugCurve>();
//             l.Add(new DebugCurve(0.05, "red", new LineSegment(start, end)));
//             var piercedEdge = currentTriangle.Edges[2];
//             l.Add(new DebugCurve(0.05, "blue", new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point)));
//             l.Add(new DebugCurve(new Ellipse(3, 3, end)));

//             var ii = currentTriangle.Edges.Index(piercedEdge);
//             for (int j = ii + 1; j <= ii + 2; j++)
//                 l.Add(new DebugCurve(0.05, "brown", new LineSegment(currentTriangle.Edges[j].upperSite.point, currentTriangle.Edges[j].lowerSite.point)));
//             LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
//         }*/
//         Assert.assert(positiveSign > negativeSign);
//         return currentTriangle.Edges[2];
//     }

//     internal static PointLocation PointLocationForTriangle(Point p, CdtTriangle triangle) {
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

//     internal void FindNextPierced() {
//         Assert.assert(negativeSign < positiveSign);
//         /*Array<DebugCurve> l = null;
//         if (db) {
//             l = new Array<DebugCurve>();
//             l.Add(new DebugCurve(0.05, "red", new LineSegment(start, end)));
//             l.Add(new DebugCurve(0.05, "blue", new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point)));
//             l.Add(new DebugCurve(new Ellipse(3, 3, end)));

//             var ii = currentTriangle.Edges.Index(piercedEdge);
//             for (int j = ii + 1; j <= ii + 2; j++)
//                 l.Add(new DebugCurve(0.05, "brown", new LineSegment(currentTriangle.Edges[j].upperSite.point, currentTriangle.Edges[j].lowerSite.point)));
//         }*/
//         currentTriangle = currentPiercedEdge.GetOtherTriangle(currentTriangle);
//         //            ShowDebug(null,currentPiercedEdge,currentTriangle);
//         /* if (db) {
//              for (int j = 0; j <= 2; j++) {
//                  var piercedEdge = currentTriangle.Edges[j];
//                  if (piercedEdge == piercedEdge) continue;
//                  l.Add(new DebugCurve(0.05, new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point)));
//              }

//              LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l.ToArray());
//          }*/
//         if (currentTriangle == null) {
//             currentPiercedEdge = null;
//             return;
//         }
//         var i = currentTriangle.Edges.Index(currentPiercedEdge);
//         int j; //pierced index
//         var oppositeSite = currentTriangle.Sites.getItem(i + 2);
//         var oppositeSiteSign = GetHyperplaneSign(oppositeSite);
//         if (negativeSign == 0) {
//             Assert.assert(positiveSign == 1);
//             if (oppositeSiteSign == -1 || oppositeSiteSign == 0) {
//                 negativeSign = oppositeSiteSign;
//                 j = i + 1;
//             }
//             else {
//                 j = i + 2;
//             }
//         }
//         else if (positiveSign == 0) {
//             Assert.assert(negativeSign == -1);
//             if (oppositeSiteSign == 1 || oppositeSiteSign == 0) {
//                 positiveSign = oppositeSiteSign;
//                 j = i + 2;
//             }
//             else {
//                 j = i + 1;
//             }
//         }
//         else if (oppositeSiteSign != positiveSign) {
//             negativeSign = oppositeSiteSign;
//             j = i + 1;
//         }
//         else {
//             Assert.assert(negativeSign != oppositeSiteSign);
//             positiveSign = oppositeSiteSign;
//             j = i + 2;
//         }

//         currentPiercedEdge =
//             Point.SignedDoubledTriangleArea(end, currentTriangle.Sites.getItem(j].point, currentTriangle.Sites[j + 1).point) <
//                 - GeomConstants.distanceEpsilon
//                 ? currentTriangle.Edges[j]
//                 : null;

//         //            ShowDebug(null,currentPiercedEdge, currentTriangle);

//     }

//     //        void ShowDebug(Array<CdtTriangle> cdtTriangles, CdtEdge cdtEdge, CdtTriangle cdtTriangle) {
//     //            var l = new Array<DebugCurve> { new DebugCurve(10,"red",new LineSegment(start,end)) };
//     //            if(cdtEdge!=null)
//     //                l.Add(new DebugCurve(100,3,"navy", new LineSegment(cdtEdge.upperSite.point,cdtEdge.lowerSite.point)));
//     //            AddTriangleToListOfDebugCurves(l,cdtTriangle,100,2,"brown");
//     //            LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
//     //
//     //        }
//     //        static void AddTriangleToListOfDebugCurves(Array<DebugCurve> debugCurves,CdtTriangle triangle,byte transparency,double width,string color) {
//     //            foreach(var cdtEdge of triangle.Edges) {
//     //                debugCurves.Add(new DebugCurve(transparency,width,color,new LineSegment(cdtEdge.upperSite.point,cdtEdge.lowerSite.point)));
//     //            }
//     //        }

//     internal int GetHyperplaneSign(CdtSite cdtSite) {
//         var area = Point.SignedDoubledTriangleArea(start, cdtSite.point, end);
//         if (area > GeomConstants.distanceEpsilon) return 1;
//         if (area < -GeomConstants.distanceEpsilon) return -1;
//         return 0;
//     }

//     internal bool MoveNext() {
//         if (currentPiercedEdge == null)
//             currentPiercedEdge = FindFirstPiercedEdge();
//         else
//             FindNextPierced();
//         return currentPiercedEdge != null;
//     }
// }
// }
