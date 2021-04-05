/*
Following "Sweep-line algorithm for constrained Delaunay triangulation", by Domiter and Zalik
*/
//triangulates the space between point, line segment and polygons of the Delaunay fashion
import { from, IEnumerable } from 'linq-to-typescript';
import { CreateRectangleNodeOnEnumeration, mkRectangleNode, RectangleNode } from '../../core/geometry/RTree/RectangleNode';
import { GeomConstants } from '../../math/geometry/geomConstants';
import { Point } from '../../math/geometry/point';
import { Polyline } from '../../math/geometry/polyline';
import { Rectangle } from '../../math/geometry/rectangle';
import { Assert } from '../../utils/assert';
import { PointMap } from '../../utils/PointMap';
import { Algorithm } from './../../utils/algorithm'
import { CdtEdge } from './CdtEdge';
import { CdtSite } from './CdtSite';
import { CdtTriangle } from './CdtTriangle';

export class Cdt extends Algorithm {

    isolatedSitesWithObject: IEnumerable<[Point, Object]>;

    isolatedSites: IEnumerable<Point>;

    obstacles: IEnumerable<Polyline>;

    isolatedSegments: Array<SymmetricSegment>;

    P1: CdtSite;

    P2: CdtSite;

    sweeper: CdtSweeper;

    PointsToSites: PointMap<CdtSite> = new PointMap<CdtSite>();

    allInputSites: Array<CdtSite>;

    // constructor
    // <param name="isolatedSites"></param>
    // <param name="obstacles"></param>
    // <param name="isolatedSegments"></param>
    constructor(isolatedSites: IEnumerable<Point>, obstacles: IEnumerable<Polyline>, isolatedSegments: Array<SymmetricSegment>) {
        super(null);
        this.isolatedSites = isolatedSites;
        this.obstacles = obstacles;
        this.isolatedSegments = isolatedSegments;
    }

    //  constructor
    //  <param name="isolatedSites"></param>
    static constructor_(isolatedSitesWithObj: IEnumerable<[Point, Object]>) {
        const r = new Cdt(null, null, null);
        r.isolatedSitesWithObject = isolatedSitesWithObj;
        return r;
    }

    FillAllInputSites() {
        // for now suppose that the data is correct: no isolatedSites coincide with obstacles or isolatedSegments, obstacles are mutually disjoint, etc
        if ((this.isolatedSitesWithObject != null)) {
            for (let tuple of this.isolatedSitesWithObject) {
                this.AddSite(tuple[0], tuple[1]);
            }

        }

        if ((this.isolatedSites != null)) {
            for (let isolatedSite of this.isolatedSites) {
                this.AddSite(isolatedSite, null);
            }

        }

        if ((this.obstacles != null)) {
            for (let poly of this.obstacles) {
                this.AddPolylineToAllInputSites(poly);
            }

        }

        if ((this.isolatedSegments != null)) {
            for (let isolatedSegment of this.isolatedSegments) {
                this.AddConstrainedEdge(isolatedSegment.A, isolatedSegment.B, null);
            }

        }

        this.AddP1AndP2();
        this.allInputSites = [...this.PointsToSites.values()]
    }

    AddSite(point: Point, relatedObject: Object): CdtSite {
        let site: CdtSite;
        if (site = this.PointsToSites.getP(point)) {
            site.Owner = relatedObject;
            // set the owner anyway
            return site;
        }

        site = new CdtSite(point);
        this.PointsToSites.setP(point, new CdtSite(point))
        return site;
    }

    AddP1AndP2() {
        const box = Rectangle.mkEmpty();
        for (const site of this.PointsToSites.keys()) {
            box.add(site);
        }

        const delx = (box.width / 3);
        const dely = (box.height / 3);
        this.P1 = new CdtSite(box.leftBottom.add(new Point((delx * -1), (dely * -1))));
        this.P2 = new CdtSite(box.rightBottom.add(new Point(delx, (dely * -1))));
    }

    AddPolylineToAllInputSites(poly: Polyline) {
        for (let pp = poly.startPoint; (pp.next != null); pp = pp.next) {
            this.AddConstrainedEdge(pp.point, pp.next.point, poly);
        }

        if (poly.closed) {
            this.AddConstrainedEdge(poly.endPoint.point, poly.startPoint.point, poly);
        }

    }

    AddConstrainedEdge(a: Point, b: Point, poly: Polyline) {
        const ab = Cdt.AbovePP(a, b);
        Assert.assert((ab != 0));
        let upperPoint: CdtSite;
        let lowerPoint: CdtSite;
        if ((ab > 0)) {
            // a is above b
            upperPoint = this.AddSite(a, poly);
            lowerPoint = this.AddSite(b, poly);
        }
        else {
            Assert.assert((ab < 0));
            upperPoint = this.AddSite(b, poly);
            lowerPoint = this.AddSite(a, poly);
        }

        const edge = Cdt.CreateEdgeOnOrderedCouple(upperPoint, lowerPoint);
        edge.Constrained = true;
    }

    static GetOrCreateEdge(a: CdtSite, b: CdtSite): CdtEdge {
        if ((Cdt.AboveCC(a, b) == 1)) {
            const e = a.EdgeBetweenUpperSiteAndLowerSite(b);
            if ((e != null)) {
                return e;
            }

            return Cdt.CreateEdgeOnOrderedCouple(a, b);
        }
        else {
            const e = b.EdgeBetweenUpperSiteAndLowerSite(a);
            if ((e != null)) {
                return e;
            }

            return Cdt.CreateEdgeOnOrderedCouple(b, a);
        }

    }

    static CreateEdgeOnOrderedCouple(upperPoint: CdtSite, lowerPoint: CdtSite): CdtEdge {
        Assert.assert((Cdt.AboveCC(upperPoint, lowerPoint) == 1));
        return new CdtEdge(upperPoint, lowerPoint);
    }

    // <returns></returns>
    public GetTriangles(): Set<CdtTriangle> {
        return this.sweeper.Triangles;
    }

    //  Executes the actual algorithm.
    run() {
        this.Initialization();
        this.SweepAndFinalize();
    }

    SweepAndFinalize() {
        this.sweeper = new CdtSweeper(this.allInputSites, this.P1, this.P2, Cdt.GetOrCreateEdge);
        this.sweeper.Run();
    }

    Initialization() {
        this.FillAllInputSites();
        this.allInputSites.sort(Cdt.OnComparison);
    }

    static OnComparison(a: CdtSite, b: CdtSite): number {
        return Cdt.AboveCC(a, b);
    }

    //  compare first y then -x coordinates
    //  <param name="a"></param>
    //  <param name="b"></param>
    //  <returns>1 if a is above b, 0 if points are the same and -1 if a is below b</returns>
    public static AbovePP(a: Point, b: Point): number {
        let del = a.y - b.y
        if ((del > 0)) {
            return 1;
        }

        if ((del < 0)) {
            return -1;
        }

        del = (a.x - b.x);
        // for a horizontal edge return the point with the smaller X
        return del > 0 ? -1 : (del < 0 ? 1 : 0);
    }

    //  compare first y then -x coordinates
    //  <param name="a"></param>
    //  <param name="b"></param>
    //  <returns>1 if a is above b, 0 if points are the same and -1 if a is below b</returns>
    static AboveCC(a: CdtSite, b: CdtSite): number {
        return Cdt.AbovePP(a.point, b.point);
    }

    RestoreEdgeCapacities() {
        for (const site of this.allInputSites) {
            for (const e of site.Edges) {
                if (!e.Constrained) {
                    e.ResidualCapacity = e.Capacity;
                }

            }

        }

    }

    public SetInEdges() {
        for (const site of this.PointsToSites.values()) {
            for (const e of site.Edges) {
                const oSite = e.lowerSite;
                Assert.assert((oSite != site));
                oSite.AddInEdge(e);
            }

        }

    }

    public FindSite(point: Point): CdtSite {
        return this.PointsToSites.getP(point)
    }

    static PointIsInsideOfTriangle(point: Point, t: CdtTriangle): boolean {
        for (let i = 0; (i < 3); i++) {
            const a = t.Sites[i].point;
            const b = t.Sites[(i + 1)].point;
            if ((Point.signedDoubledTriangleArea(point, a, b)
                < (GeomConstants.distanceEpsilon * -1))) {
                return false;
            }

        }

        return true;
    }

    cdtTree: RectangleNode<CdtTriangle, Point> = null;

    GetCdtTree(): RectangleNode<CdtTriangle, Point> {
        if (this.cdtTree == null) {
            this.cdtTree = CreateRectangleNodeOnEnumeration(from(this.GetTriangles().values()).
                select((t) => mkRectangleNode<CdtTriangle, Point>(t, t.BoundingBox())));
        }

        return this.cdtTree;
    }
}
