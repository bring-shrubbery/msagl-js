// // using Microsoft.Msagl.Core.Geometry;
// // using Microsoft.Msagl.Core.Geometry.Curves;

// // namespace Microsoft.Msagl.Routing.Spline.ConeSpanner {

// //     // represents a cone side that is broken by the obstacle
// //     // <
// //     internal class BrokenConeSide: ConeSide {

// //         // point where it starts
// //         // <
// //         internal Point start;

// //         internal override Point Start {
// //             get { return start; }
// //         }

// //         // it is the side of the cone that intersects the obstacle side
// //         // <
// //         internal ConeSide ConeSide { get; set; }

// //         internal PolylinePoint EndVertex { get; set; }

// //         internal Point End {
// //             get { return EndVertex.point; }
// //         }

// //         internal BrokenConeSide(Point start, PolylinePoint end, ConeSide coneSide) {
// //             this.start = start;
// //             EndVertex = end;
// //             ConeSide = coneSide;
// //         }

// //         internal override Point Direction {
// //             get { return End - Start; }
// //         }

// //         public override string ToString() {
// //             return "BrokenConeSide: " + Start + "," + End;
// //         }
// //     }
// // }
