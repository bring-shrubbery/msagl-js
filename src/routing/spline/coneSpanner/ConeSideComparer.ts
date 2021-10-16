// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;

// namespace Microsoft.Msagl.Routing.Spline.ConeSpanner {
//     internal class ConeSideComparer : IComparer < ConeSide > {
//         Point x;
//         internal void SetOperand(ConeSide activeElement) {
//         x = IntersectionOfSegmentAndSweepLine((activeElement));
//     }
//         readonly IConeSweeper coneSweeper;

//     internal ConeSideComparer(IConeSweeper coneSweeper) {
//         this.coneSweeper = coneSweeper;
//     }

//         public int Compare(ConeSide a, ConeSide b) {
//         var aObst = a as BrokenConeSide;
//         var bObst = b as BrokenConeSide;
//         if (aObst != null) {
//             return bObst != null ? CompareBrokenSides(aObst, bObst) : CompareObstacleSideAndConeSide(b);
//         } else {
//             //a is ConeSide
//             return bObst != null ? CompareConeSideAndObstacleSide(a, bObst) : CompareNotIntersectingSegs(a, b);
//         }
//     }

//         static int CompareNotIntersectingSegs(ConeSide a, ConeSide b) {
//         var signedArea = Point.getTriangleOrientation(a.start, b.start, b.start + b.Direction);

//         switch (signedArea) {
//             case TriangleOrientation.Counterclockwise:
//                 return -1;
//             case TriangleOrientation.Clockwise:
//                 return 1;
//             default:
//                 return 0;
//         }
//     }

//     int CompareObstacleSideAndConeSide(ConeSide coneSide) {
//         var orientation = Point.getTriangleOrientation(x, coneSide.start,
//             coneSide.start + coneSide.Direction);
//         if (orientation == TriangleOrientation.Counterclockwise)
//             return -1;
//         if (orientation == TriangleOrientation.Clockwise)
//             return 1;

//         //we have the case where x belongs to the cone side

//         return coneSide is ConeLeftSide ? -1 : 1;
//     }

//     int CompareConeSideAndObstacleSide(ConeSide coneSide, BrokenConeSide brokenConeSide) {
//         var orientation = Point.getTriangleOrientation(x, brokenConeSide.start, brokenConeSide.End);
//         if (orientation == TriangleOrientation.Counterclockwise)
//             return -1;
//         if (orientation == TriangleOrientation.Clockwise)
//             return 1;

//         //we have the case where x belongs to the cone side

//         //      lineSweeper.Show(CurveFactory.CreateDiamond(5,5, brokenConeSide.EndVertex.point));

//         return coneSide is ConeLeftSide ? 1 : -1;
//     }

//     internal Point IntersectionOfSegmentAndSweepLine(ConeSide obstacleSide) {
//         var den = obstacleSide.Direction * coneSweeper.SweepDirection;
//         Assert.assert(Math.Abs(den) > 0);
//         var t = (coneSweeper.Z - obstacleSide.start * coneSweeper.SweepDirection) / den;
//         return obstacleSide.start + t * obstacleSide.Direction;
//     }

//     int CompareBrokenSides(BrokenConeSide aObst, BrokenConeSide bObst) {
//         if (aObst.EndVertex == bObst.EndVertex)
//             return CompareNotIntersectingSegs(aObst.ConeSide, bObst.ConeSide);

//         if (Point.getTriangleOrientation(x, bObst.start, bObst.EndVertex.point) ==
//             TriangleOrientation.Counterclockwise)
//             return -1;
//         return 1;
//     }
// }
// }
