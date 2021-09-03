// using System;
// using System.Collections.Generic;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // holds the data of a path
//     // <
// #if SHARPKIT //http://code.google.com/p/sharpkit/issues/detail?id=203
//     //SharpKit/Colin - Interface implementations
//     // FP: this needs to be public because it is referenced by interfaces elsewhere. It's not public in the .NET version because that version can use explicitly-defined interfaces.
//     public class Metroline {
//         #else
//         internal class Metroline {
//         #endif
//         internal double Width;
//         internal double Length { get; set; }

//     internal double IdealLength { get; set; }

//     internal Polyline Polyline { get; set; }
//         public int Index { get; set; }

//     internal Metroline(Polyline polyline, double width, Func < Tuple < Polyline, Polyline >> sourceAndTargetLoosePolys, int index) {
//         Width = width;
//         Polyline = polyline;
//         this.sourceAndTargetLoosePolylines = sourceAndTargetLoosePolys;
//     }

//     internal void UpdateLengths() {
//         var l = 0.0;
//         for (var p = Polyline.startPoint; p.next != null; p = p.next) {
//             l += (p.next.point - p.point).length;
//         }
//         Length = l;
//         IdealLength = (Polyline.End - Polyline.start).length;
//     }

//     internal Func < Tuple < Polyline, Polyline >> sourceAndTargetLoosePolylines;
// }
// }
