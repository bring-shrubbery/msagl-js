// using System.Diagnostics;

// namespace Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation {
//     internal class CdtFrontElement {
//         //The LeftSite should coincide with the leftmost end of the Edge, and the edge should not be vertical

//         internal CdtSite LeftSite;
//         internal CdtEdge Edge;
//         internal CdtSite RightSite;

//         internal double X {
//         get { return LeftSite.point.X; }
//     }

//     internal CdtFrontElement(CdtSite leftSite, CdtEdge edge) {
//         Assert.assert(edge.upperSite.point.X != edge.lowerSite.point.X &&
//             edge.upperSite.point.X < edge.lowerSite.point.X && leftSite == edge.upperSite ||
//             edge.upperSite.point.X > edge.lowerSite.point.X && leftSite == edge.lowerSite);
//         RightSite = edge.upperSite == leftSite ? edge.lowerSite : edge.upperSite;
//         LeftSite = leftSite;
//         Edge = edge;
//     }
// }
// }
