import { Point, TriangleOrientation } from '../../math/geometry/point'
import { Rectangle } from '../../math/geometry/rectangle'
import { Assert } from '../../utils/assert'
import { CdtEdge } from './CdtEdge'
import { CdtSite } from './CdtSite'
import { ThreeArray } from './ThreeArray'

//  a trianlge oriented counterclockwise
export class CdtTriangle {
  //  the edges
  public Edges: ThreeArray<CdtEdge> = new ThreeArray<CdtEdge>()

  //  the sites
  public Sites: ThreeArray<CdtSite> = new ThreeArray<CdtSite>()

  constructor(
    a: CdtSite,
    b: CdtSite,
    c: CdtSite,
    createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge,
  ) {
    const orientation = Point.getTriangleOrientationWithNoEpsilon(
      a.point,
      b.point,
      c.point,
    )
    switch (orientation) {
      case TriangleOrientation.Counterclockwise:
        this.FillCcwTriangle(a, b, c, createEdgeDelegate)
        break
      case TriangleOrientation.Clockwise:
        this.FillCcwTriangle(a, c, b, createEdgeDelegate)
        break
      default:
        throw new Error()
        break
    }
  }

  static constructor_t(
    pi: CdtSite,
    edge: CdtEdge,
    createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge,
  ) {
    let tri: CdtTriangle
    switch (
    Point.getTriangleOrientationWithNoEpsilon(
      edge.upperSite.point,
      edge.lowerSite.point,
      pi.point,
    )
    ) {
      case TriangleOrientation.Counterclockwise:
        tri = new CdtTriangle(edge.upperSite, edge.lowerSite, pi, createEdgeDelegate)
        break
      case TriangleOrientation.Clockwise:
        tri = new CdtTriangle(edge.lowerSite, edge.upperSite, pi, createEdgeDelegate)
        break
      default:
        throw new Error()
    }
    edge.CcwTriangle = tri

    tri.Edges[0] = edge
    tri.CreateEdge(1, createEdgeDelegate)
    tri.CreateEdge(2, createEdgeDelegate)
    return tri
  }

  //
  static constructor_55(
    aLeft: CdtSite,
    aRight: CdtSite,
    bRight: CdtSite,
    a: CdtEdge,
    b: CdtEdge,
    createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge,
  ) {
    Assert.assert(Point.getTriangleOrientation(aLeft.point, aRight.point, bRight.point) == TriangleOrientation.Counterclockwise);
    const tri = new CdtTriangle(aLeft, aRight, bRight, createEdgeDelegate)
    tri.Edges[0] = a
    tri.Edges[1] = b
    tri.BindEdgeToTriangle(aLeft, a)
    tri.BindEdgeToTriangle(aRight, b)
    tri.CreateEdge(2, createEdgeDelegate)
    return tri
  }

  //  in the trianlge, which is always oriented counterclockwise, the edge starts at site
  BindEdgeToTriangle(site: CdtSite, edge: CdtEdge) {
    if (site == edge.upperSite) {
      edge.CcwTriangle = this
    } else {
      edge.CwTriangle = this
    }
  }

  //  here a,b,c comprise a ccw triangle
  FillCcwTriangle(
    a: CdtSite,
    b: CdtSite,
    c: CdtSite,
    createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge,
  ) {
    this.Sites[0] = a
    this.Sites[1] = b
    this.Sites[2] = c
    for (let i = 0; i < 3; i++) {
      this.CreateEdge(i, createEdgeDelegate)
    }
  }

  CreateEdge(i: number, createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge) {
    const a = this.Sites[i]
    const b = this.Sites[i + 1]
    const edge = this.Edges[i] = createEdgeDelegate(a, b);
    this.BindEdgeToTriangle(a, edge);
  }

  Contains(cdtSite: CdtSite): boolean {
    return this.Sites.has(cdtSite)
  }

  OppositeEdge(pi: CdtSite): CdtEdge {
    const index = this.Sites.index(pi)
    Assert.assert(index != -1)
    return this.Edges[index + 1]
  }

  //  #if TEST_MSAGL&&TEST_MSAGL
  //          // Returns a <see cref="T:System.String"/> that represents the current <see cref="T:System.Object"/>.
  //          // A <see cref="T:System.String"/> that represents the current <see cref="T:System.Object"/>.
  //          // <filterpriority>2</filterpriority>
  //          public override string ToString() {
  //              return String.Format("({0},{1},{2}", Sites[0], Sites[1], Sites[2]);
  //          }
  //  #endif
  OppositeSite(cdtEdge: CdtEdge): CdtSite {
    const i = this.Edges.index(cdtEdge)
    return this.Sites[i + 2]
  }

  BoundingBox(): Rectangle {
    const rect: Rectangle = Rectangle.mkPP(
      this.Sites[0].point,
      this.Sites[1].point,
    )
    rect.add(this.Sites[2].point)
    return rect
  }
}
