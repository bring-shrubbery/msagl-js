import { InvalidOperationException } from "linq-to-typescript";
import { Point, TriangleOrientation } from "../../math/geometry/point";
import { Rectangle } from "../../math/geometry/rectangle";
import { Assert } from "../../utils/assert";
import { CdtEdge } from "./CdtEdge";
import { CdtSite } from "./CdtSite";
import { ThreeArray } from "./ThreeArray";

//  a trianlge oriented counterclockwise
export class CdtTriangle {

    // <summary>
    //  the edges
    // </summary>
    public Edges: ThreeArray<CdtEdge> = new ThreeArray<CdtEdge>();

    // <summary>
    //  the sites
    // </summary>
    public Sites: ThreeArray<CdtSite> = new ThreeArray<CdtSite>();

    constructor(a: CdtSite, b: CdtSite, c: CdtSite, createEdgeDelegate: Func<CdtSite, CdtSite, CdtEdge>) {
        let orientation = Point.GetTriangleOrientationWithNoEpsilon(a.Point, b.Point, c.Point);
        switch (orientation) {
            case TriangleOrientation.Counterclockwise:
                this.FillCcwTriangle(a, b, c, createEdgeDelegate);
                break;
            case TriangleOrientation.Clockwise:
                this.FillCcwTriangle(a, c, b, createEdgeDelegate);
                break;
            default:
                throw new InvalidOperationException();
                break;
        }

    }

    constructor(pi: CdtSite, edge: CdtEdge, createEdgeDelegate: Func<CdtSite, CdtSite, CdtEdge>) {
        switch (Point.GetTriangleOrientationWithNoEpsilon(edge.upperSite.Point, edge.lowerSite.Point, pi.Point)) {
            case TriangleOrientation.Counterclockwise:
                edge.CcwTriangle = this;
                this.Sites[0] = edge.upperSite;
                this.Sites[1] = edge.lowerSite;
                break;
            case TriangleOrientation.Clockwise:
                edge.CwTriangle = this;
                this.Sites[0] = edge.lowerSite;
                this.Sites[1] = edge.upperSite;
                break;
            default:
                throw new InvalidOperationException();
                break;
        }

        this.Edges[0] = edge;
        this.Sites[2] = pi;
        this.CreateEdge(1, createEdgeDelegate);
        this.CreateEdge(2, createEdgeDelegate);
    }

    // 
    constructor(aLeft: CdtSite, aRight: CdtSite, bRight: CdtSite, a: CdtEdge, b: CdtEdge, createEdgeDelegate: Func<CdtSite, CdtSite, CdtEdge>) {
        //  Assert.assert(Point.GetTriangleOrientation(aLeft.Point, aRight.Point, bRight.Point) == TriangleOrientation.Counterclockwise);
        this.Sites[0] = aLeft;
        this.Sites[1] = aRight;
        this.Sites[2] = bRight;
        this.Edges[0] = a;
        this.Edges[1] = b;
        this.BindEdgeToTriangle(aLeft, a);
        this.BindEdgeToTriangle(aRight, b);
        this.CreateEdge(2, createEdgeDelegate);
    }

    //  <summary>
    //  in the trianlge, which is always oriented counterclockwise, the edge starts at site 
    //  </summary>
    //  <param name="site"></param>
    //  <param name="edge"></param>
    BindEdgeToTriangle(site: CdtSite, edge: CdtEdge) {
        if ((site == edge.upperSite)) {
            edge.CcwTriangle = this;
        }
        else {
            edge.CwTriangle = this;
        }

    }

    //  <summary>
    //  here a,b,c comprise a ccw triangle
    //  </summary>
    //  <param name="a"></param>
    //  <param name="b"></param>
    //  <param name="c"></param>
    //  <param name="createEdgeDelegate"></param>
    FillCcwTriangle(a: CdtSite, b: CdtSite, c: CdtSite, createEdgeDelegate: Func<CdtSite, CdtSite, CdtEdge>) {
        this.Sites[0] = a;
        this.Sites[1] = b;
        this.Sites[2] = c;
        for (let i: number = 0; (i < 3); i++) {
            this.CreateEdge(i, createEdgeDelegate);
        }

    }

    CreateEdge(i: number, createEdgeDelegate: Func<CdtSite, CdtSite, CdtEdge>) {
        let a = this.Sites[i];
        let b = this.Sites[(i + 1)];
        let edge;
        this.BindEdgeToTriangle(a, edge);
    }

    Contains(cdtSite: CdtSite): boolean {
        return this.Sites.Contains(cdtSite);
    }

    OppositeEdge(pi: CdtSite): CdtEdge {
        let index = this.Sites.Index(pi);
        Assert.assert((index != -1));
        return this.Edges[(index + 1)];
    }

    //  #if TEST_MSAGL&&TEST_MSAGL
    //          // <summary>
    //          // Returns a <see cref="T:System.String"/> that represents the current <see cref="T:System.Object"/>.
    //          // </summary>
    //          // <returns>
    //          // A <see cref="T:System.String"/> that represents the current <see cref="T:System.Object"/>.
    //          // </returns>
    //          // <filterpriority>2</filterpriority>
    //          public override string ToString() {
    //              return String.Format("({0},{1},{2}", Sites[0], Sites[1], Sites[2]);
    //          }
    //  #endif
    OppositeSite(cdtEdge: CdtEdge): CdtSite {
        let i = this.Edges.Index(cdtEdge);
        return this.Sites[(i + 2)];
    }

    BoundingBox(): Rectangle {
        let rect: Rectangle = new Rectangle(this.Sites[0].Point, this.Sites[1].Point);
        rect.Add(this.Sites[2].Point);
        return rect;
    }
}