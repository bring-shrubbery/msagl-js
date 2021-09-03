// //
// // RelativeShape.cs
// // MSAGL RelativeShape class for Rectilinear Edge Routing.
// //
// // Copyright Microsoft Corporation.

// using System;
// using Microsoft.Msagl.Core.Geometry.Curves;

// namespace Microsoft.Msagl.Routing {

//     // A shape wrapping an ICurve delegate, providing additional information.
//     // <
//     public class RelativeShape : Shape {

//         // The curve of the shape.
//         // <
//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA2204:Literals should be spelled correctly", MessageId = "BoundaryCurve"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA2204:Literals should be spelled correctly", MessageId = "RelativeShape")]
//         public override ICurve BoundaryCurve {
//             get { return curveDelegate(); }
//             set {
//                 throw new Error(
// #if TEST_MSAGL
//                         "Cannot set BoundaryCurve directly for RelativeShape"
// #endif // TEST
//                 );
//             }
//         }

//         readonly Func < ICurve > curveDelegate;

//         // Constructor taking the ID and the curve delegate for the shape.
//         // <

//         public RelativeShape(Func < ICurve > curveDelegate)
//         {
//             this.curveDelegate = curveDelegate;
//         }
//     }
// }
