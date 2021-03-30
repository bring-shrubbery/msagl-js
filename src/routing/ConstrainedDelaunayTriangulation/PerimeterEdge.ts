using System.Diagnostics;

namespace Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation {
    // <summary>
    // 
    // </summary>
    internal class PerimeterEdge {
        internal CdtSite Start;
        internal CdtSite End;
        internal PerimeterEdge Prev, Next;
        internal CdtEdge Edge;

        internal PerimeterEdge(CdtEdge edge) {
            Assert.assert(edge.CcwTriangle == null || edge.CwTriangle == null);
            Edge = edge;
        }
    }
}