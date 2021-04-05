// using System;
// using System.Collections.Generic;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core;

// namespace Microsoft.Msagl.Routing.Visibility {
//     internal class ActiveEdgeComparerWithRay : IComparer < PolylinePoint > {
//         Point pivot;

//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         internal Point Pivot {
//         get { return pivot; }
//         set { pivot = value; }
//     }
//     Point pointOnTheRay;

//     internal Point IntersectionOfTheRayAndInsertedEdge {
//         get { return pointOnTheRay; }
//         set { pointOnTheRay = value; }
//     }

//     int IComparer<PolylinePoint>.Compare(PolylinePoint x, PolylinePoint y) {
//         ValidateArg.IsNotNull(x, "x");
//         ValidateArg.IsNotNull(y, "y");
//         Assert.assert(IntersectionPointBelongsToTheInsertedEdge(x));

//         switch(Point.getTriangleOrientation(IntersectionOfTheRayAndInsertedEdge, y.point, y.NextOnPolyline.point)) {
//                 case TriangleOrientation.Counterclockwise:
//         return -1;
//                 default:
//         return 1;
//     }
// }

// [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         private bool IntersectionPointBelongsToTheInsertedEdge(PolylinePoint x) {
//     Point a = x.point - IntersectionOfTheRayAndInsertedEdge;
//     Point b = x.NextOnPolyline.point - IntersectionOfTheRayAndInsertedEdge;
//     return Math.Abs(a.x * b.y - b.x * a.y) < GeomConstants.distanceEpsilon;
// }

// [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2201:DoNotRaiseReservedExceptionTypes")]
// Point IntersectEdgeWithRay(Point source, Point target, Point ray) {
//     //let x(t-s)+s is on the ray, then for some y we x(t-s)+s=y*ray+pivot, or x(t-s)-y*ray=pivot-s
//     double x, y;
//     bool result = LinearSystem2.Solve(target.x - source.x, -ray.x, Pivot.x - source.x, target.y - source.y, -ray.y, Pivot.y - source.y, out x, out y);
//     if (!(-ApproximateComparer.Tolerance <= x && x <= 1 + ApproximateComparer.Tolerance))
//         throw new Exception();
//     if (!result)
//         throw new Error();

//     return Pivot + y * ray;
// }

// internal Point IntersectEdgeWithRay(PolylinePoint side, Point ray){
//     return IntersectEdgeWithRay(side.point, side.NextOnPolyline.point, ray);
// }

// [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// internal ActiveEdgeComparerWithRay(Point pivot, Point pointOnTheRay) {
//     this.pivot = pivot;
//     this.pointOnTheRay = pointOnTheRay;
// }

// internal ActiveEdgeComparerWithRay() { }
//     }
// }
