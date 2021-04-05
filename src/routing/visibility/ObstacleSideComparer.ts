// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core;

// namespace Microsoft.Msagl.Routing.Visibility {
//     internal class ObstacleSideComparer : IComparer < SegmentBase > {

//         readonly LineSweeperBase lineSweeper;

//         internal ObstacleSideComparer(LineSweeperBase lineSweeper) {
//             this.lineSweeper = lineSweeper;
//         }

//         // <summary>
//         // the intersection of the sweepline and the active segment
//         // </summary>
//         Point x;

//         public int Compare(SegmentBase a, SegmentBase b) {
//             ValidateArg.IsNotNull(b, "b");
//             var orient = Point.getTriangleOrientation(b.start, b.End, x);
//             switch (orient) {
//                 case TriangleOrientation.Collinear:
//                     return 0;
//                 case TriangleOrientation.Clockwise:
//                     return 1;
//                 default:
//                     return -1;
//             }
//         }

//         internal void SetOperand(SegmentBase side) {
//         x = IntersectionOfSideAndSweepLine(side);
//     }

//     internal Point IntersectionOfSideAndSweepLine(SegmentBase obstacleSide) {
//         var den = obstacleSide.Direction * lineSweeper.SweepDirection;
//         Assert.assert(Math.Abs(den) > GeomConstants.distanceEpsilon);
//         var t = (lineSweeper.Z - obstacleSide.start * lineSweeper.SweepDirection) / den;
//         return obstacleSide.start + t * obstacleSide.Direction;
//     }

// }
// }
