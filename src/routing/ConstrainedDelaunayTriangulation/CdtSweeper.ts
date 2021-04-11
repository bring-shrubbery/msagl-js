import { from, IEnumerable } from "linq-to-typescript";
import { Stack } from "stack-typescript";
import { DebugCurve } from "../../math/geometry/debugCurve";
import { Ellipse } from "../../math/geometry/ellipse";
import { GeomConstants } from "../../math/geometry/geomConstants";
import { ICurve } from "../../math/geometry/icurve";
import { LineSegment } from "../../math/geometry/lineSegment";
import { Point, TriangleOrientation } from "../../math/geometry/point";
import { SvgDebugWriter } from "../../math/geometry/svgDebugWriter";
import { RBNode } from "../../structs/RBTree/rbNode";
import { RBTree } from "../../structs/RBTree/rbTree";
import { Algorithm } from "../../utils/algorithm";
import { Assert } from "../../utils/assert";
import { Cdt } from "./Cdt";
import { CdtEdge } from "./CdtEdge";
import { CdtFrontElement } from "./CdtFrontElement";
import { CdtSite } from "./CdtSite";
import { CdtTriangle } from "./CdtTriangle";
import { EdgeInserter } from "./EdgeInserter";
import { PerimeterEdge } from "./PerimeterEdge";

// this class builds the triangulation by a sweep with a horizontal line
export class CdtSweeper extends Algorithm {
    front: RBTree<CdtFrontElement>;

    triangles: Set<CdtTriangle> = new Set<CdtTriangle>();

    listOfSites: Array<CdtSite>;

    p_2: CdtSite;

    createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge

    p_1: CdtSite;

    constructor(listOfSites: Array<CdtSite>, p_1: CdtSite, p_2: CdtSite, createEdgeDelegate: (a: CdtSite, b: CdtSite) => CdtEdge) {
        super(null);
        this.listOfSites = this.listOfSites;
        if ((this.listOfSites.length == 0)) {
            return;
        }

        let firstTriangle = new CdtTriangle(this.p_1, this.p_2, this.listOfSites[0], this.createEdgeDelegate);
        this.triangles.add(firstTriangle);
        this.front.insert(new CdtFrontElement(this.p_1, firstTriangle.Edges[2]));
        this.front.insert(new CdtFrontElement(this.listOfSites[0], firstTriangle.Edges[1]));
        this.p_1 = this.p_1;
        this.p_2 = this.p_2;
        this.createEdgeDelegate = this.createEdgeDelegate;
        // ShowFront();
    }

    run() {
        if ((this.listOfSites.length == 0)) {
            return;
        }

        for (let i = 1; (i < this.listOfSites.length); i++) {
            this.ProcessSite(this.listOfSites[i]);
        }

        this.FinalizeTriangulation();
        //  #if TEST_MSAGL && TEST_MSAGL
        //              //TestTriangles();
        //              //ShowFront(triangles,null,null,null);
        //  #endif
    }

    FinalizeTriangulation() {
        let list = this.CreateDoubleLinkedListOfPerimeter();
        this.MakePerimeterConvex(list);
        this.RemoveP1AndP2Triangles();
    }

    MakePerimeterConvex(firstPerimeterEdge: PerimeterEdge) {
        firstPerimeterEdge = CdtSweeper.FindPivot(firstPerimeterEdge);
        let firstSite = firstPerimeterEdge.Start;
        let a = firstPerimeterEdge;
        let b: PerimeterEdge;
        for (
            ; (a.End != firstSite);
        ) {
            b = a.Next;
            if ((Point.getTriangleOrientationWithNoEpsilon(a.Start.point, a.End.point, b.End.point) == TriangleOrientation.Counterclockwise)) {
                a = this.ShortcutTwoListElements(a);
                while ((a.Start != firstSite)) {
                    let c = a.Prev;
                    if ((Point.getTriangleOrientationWithNoEpsilon(c.Start.point, c.End.point, a.End.point) == TriangleOrientation.Counterclockwise)) {
                        a = this.ShortcutTwoListElements(c);
                    }
                    else {
                        break;
                    }

                }

            }
            else {
                a = b;
            }

        }

    }

    static FindPivot(firstPerimeterEdge: PerimeterEdge): PerimeterEdge {
        let pivot = firstPerimeterEdge;
        let e = firstPerimeterEdge;
        for (
            ; (e != firstPerimeterEdge);
        ) {
            e = e.Next;
            if (((e.Start.point.x < pivot.Start.point.x)
                || ((e.Start.point.x == pivot.Start.point.x)
                    && (e.Start.point.y < pivot.Start.point.y)))) {
                pivot = e;
            }

        }

        return pivot;
    }

    CreateDoubleLinkedListOfPerimeter(): PerimeterEdge {
        let firstEdge = from(this.front.allNodes()).first().Edge;
        let edge = firstEdge;
        let listStart: PerimeterEdge = null;
        let pe: PerimeterEdge;
        let prevPe: PerimeterEdge = null;
        do {
            pe = CdtSweeper.CreatePerimeterElementFromEdge(edge);
            edge = CdtSweeper.FindNextEdgeOnPerimeter(edge);
            if ((prevPe != null)) {
                pe.Prev = prevPe;
                prevPe.Next = pe;
            }
            else {
                listStart = pe;
            }

            prevPe = pe;
        } while (edge != firstEdge)

        listStart.Prev = pe;
        pe.Next = listStart;
        return listStart;
    }

    static FindNextEdgeOnPerimeter(e: CdtEdge): CdtEdge {
        let t;
        e.CcwTriangle;
        e = t.Edges[(t.Edges.Index(e) + 2)];
        while (((e.CwTriangle != null)
            && (e.CcwTriangle != null))) {
            t = e.GetOtherTriangle_c(t);
            e = t.Edges[(t.Edges.Index(e) + 2)];
        }

        return e;
    }

    static CreatePerimeterElementFromEdge(edge: CdtEdge): PerimeterEdge {
        let pe = new PerimeterEdge(edge);
        if ((edge.CwTriangle != null)) {
            pe.Start = edge.upperSite;
            pe.End = edge.lowerSite;
        }
        else {
            pe.End = edge.upperSite;
            pe.Start = edge.lowerSite;
        }

        return pe;
    }

    RemoveP1AndP2Triangles() {
        let trianglesToRemove = new Set<CdtTriangle>();
        for (let t of this.triangles) {
            if ((t.Sites.has(this.p_1) || t.Sites.has(this.p_2))) {
                trianglesToRemove.add(t);
            }

        }

        for (let t of trianglesToRemove) {
            CdtSweeper.RemoveTriangleWithEdges(this.triangles, t);
        }

    }

    static RemoveTriangleWithEdges(cdtTriangles: Set<CdtTriangle>, t: CdtTriangle) {
        cdtTriangles.delete(t);
        for (const e of t.Edges) {
            if (e.CwTriangle == t) {
                e.CwTriangle = null;
            }
            else {
                e.CcwTriangle = null;
            }

            if (((e.CwTriangle == null)
                && (e.CcwTriangle == null))) {
                removeFromArray(e.upperSite.Edges, e);
            }
        }
    }

    static RemoveTriangleButLeaveEdges(cdtTriangles: Set<CdtTriangle>, t: CdtTriangle) {
        cdtTriangles.delete(t);
        for (let e of t.Edges) {
            if ((e.CwTriangle == t)) {
                e.CwTriangle = null;
            }
            else {
                e.CcwTriangle = null;
            }
        }
    }

    ProcessSite(site: CdtSite) {
        this.PointEvent(site);
        // ShowFrontWithSite(site);
        for (let i: number = 0; (i < site.Edges.length); i++) {
            let edge = site.Edges[i];
            if (edge.Constrained) {
                this.EdgeEvent(edge);
            }

        }

        //  TestThatFrontIsConnected();
    }

    //  #if TEST_MSAGL && TEST_MSAGL
    //  void TestThatFrontIsConnected() {
    //      CdtFrontElement p = null;
    //      foreach(var cdtFrontElement of front) {
    //          if (p != null)
    //              Assert.assert(p.RightSite == cdtFrontElement.LeftSite);
    //          p = cdtFrontElement;
    //      }
    //  }
    //  #endif
    EdgeEvent(edge: CdtEdge) {
        Assert.assert(edge.Constrained);
        if (CdtSweeper.EdgeIsProcessed(edge)) {
            return;
        }

        let edgeInserter = new EdgeInserter(edge, this.triangles, this.front, this.createEdgeDelegate);
        edgeInserter.Run();
    }

    static EdgeIsProcessed(edge: CdtEdge): boolean {
        return ((edge.CwTriangle != null)
            || (edge.CcwTriangle != null));
    }

    ShowFrontWithSite(site: CdtSite, redCurves: ICurve[]) {
        let ls = new Array<DebugCurve>();
        if ((site.Edges != null)) {
            for (let e of site.Edges) {
                ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.001, "pink", LineSegment.mkPP(e.upperSite.point, e.lowerSite.point)));
            }

        }

        ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.01, "brown", Ellipse.mkFullEllipseNNP(0.5, 0.5, site.point)));
        for (let t of this.triangles) {
            for (let i: number = 0; (i < 3); i++) {
                let e = t.Edges[i];
                ls.push(DebugCurve.mkDebugCurveTWCI(e.Constrained ? 150 : 50,
                    e.Constrained ? 0.002 : 0.001, e.Constrained ? "pink" : "navy", LineSegment.mkPP(e.upperSite.point, e.lowerSite.point)));
                // TODO: Warning!!!, inline IF is not supported ?
                e.Constrained;
                (<number>(50));
                // TODO: Warning!!!, inline IF is not supported ?
                e.Constrained;
                0.001;
                // TODO: Warning!!!, inline IF is not supported ?
                e.Constrained;
                "navy";
            }

        }

        for (let c of redCurves) {
            ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.005, "red", c));
        }

        for (let frontElement of this.front) {
            ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.005, "green", LineSegment.mkPP(frontElement.Edge.upperSite.point, frontElement.Edge.lowerSite.point)));
        }

        SvgDebugWriter.dumpDebugCurves("/tmp/curvers.svg", ls);
    }

    ShowFront() {
        CdtSweeper.ShowFront([...this.triangles.values()], this.front, null, null);
    }

    static ShowFront(cdtTriangles: CdtTriangle[],
        cdtFrontElements: RBTree<CdtFrontElement>,
        redCurves: IEnumerable<ICurve>, blueCurves: IEnumerable<ICurve>) {
        let ls: Array<DebugCurve> = new Array<DebugCurve>();
        if ((redCurves != null)) {
            for (let c of redCurves) {
                ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.5, "red", c));
            }

        }

        if ((blueCurves != null)) {
            for (let c of blueCurves) {
                ls.push(DebugCurve.mkDebugCurveTWCI(100, 2, "blue", c));
            }

        }

        if ((cdtFrontElements != null)) {
            for (let frontElement of cdtFrontElements) {
                ls.push(DebugCurve.mkDebugCurveTWCI(100, 0.001, "green", LineSegment.mkPP(frontElement.Edge.upperSite.point, frontElement.Edge.lowerSite.point)));
            }

        }

        for (let t of cdtTriangles) {
            for (let i: number = 0; (i < 3); i++) {
                let e = t.Edges[i];
                ls.push(CdtSweeper.GetDebugCurveOfCdtEdge(e));
            }

        }

        SvgDebugWriter.dumpDebugCurves('/tmp/t.svg', ls);
    }

    static GetDebugCurveOfCdtEdge(e: CdtEdge): DebugCurve {
        if (((e.CcwTriangle == null)
            || (e.CwTriangle == null))) {
            return DebugCurve.mkDebugCurveTWCI(255, 4, "brown", LineSegment.mkPP(e.upperSite.point, e.lowerSite.point));
        }

        // TODO: Warning!!!, inline IF is not supported ?
        e.Constrained;
        "blue";
        return DebugCurve.mkDebugCurveTWCI(100, 0.002, "pink", LineSegment.mkPP(e.upperSite.point, e.lowerSite.point));
        // TODO: Warning!!!, inline IF is not supported ?
        e.Constrained;
        0.001;
        // TODO: Warning!!!, inline IF is not supported ?
        e.Constrained;
        "navy";
    }


    //         int count;
    //          bool db { get { return count == 147; } }
    PointEvent(pi: CdtSite) {
        let hittedFrontElementNode: RBNode<CdtFrontElement>;
        this.ProjectToFront(pi, /* out */hittedFrontElementNode);
        let rightSite: CdtSite;
        let leftSite: CdtSite = this.MiddleCase(pi, hittedFrontElementNode, /* out */rightSite);
        // TODO: Warning!!!, inline IF is not supported ?
        (hittedFrontElementNode.item.x
            + (ApproximateComparer.DistanceEpsilon < pi.point.x));
        this.LeftCase(pi, hittedFrontElementNode, /* out */rightSite);
        let piNode = this.InsertSiteIntoFront(leftSite, pi, rightSite);
        this.TriangulateEmptySpaceToTheRight(piNode);
        piNode = CdtSweeper.FindNodeInFrontBySite(this.front, leftSite);
        this.TriangulateEmptySpaceToTheLeft(piNode);
    }

    //  #if TEST_MSAGL && TEST_MSAGL
    //  void TestTriangles() {
    //      var usedSites = new Set<CdtSite>();
    //      foreach(var t of triangles)
    //      usedSites.InsertRange(t.Sites);
    //      foreach(var triangle of triangles) {
    //          TestTriangle(triangle, usedSites);
    //      }
    //  }
    //  void TestTriangle(CdtTriangle triangle, Set < CdtSite > usedSites) {
    //      var tsites = triangle.Sites;
    //      foreach(var site of usedSites) {
    //          if (!tsites.Contains(site)) {
    //              if (!SeparatedByConstrainedEdge(triangle, site) && InCircle(site, tsites[0], tsites[1], tsites[2])) {
    //                  Array < ICurve > redCurves=new Array<ICurve>();
    //                  redCurves.push(new Ellipse(2, 2, site.point));
    //                  Array < ICurve > blueCurves = new Array<ICurve>();
    //                  blueCurves.push(Circumcircle(tsites[0].point, tsites[1].point, tsites[2].point));
    //                  ShowFront(triangles, front, redCurves, blueCurves);
    //              }
    //          }
    //      }
    //  }
    //          static bool SeparatedByConstrainedEdge(CdtTriangle triangle, CdtSite site) {
    //      for (int i = 0; i < 3; i++)
    //      if (SeparatedByEdge(triangle, i, site))
    //          return true;
    //      return false;
    //  }
    //          static bool SeparatedByEdge(CdtTriangle triangle, int i, CdtSite site) {
    //      var e = triangle.Edges[i];
    //      var s = triangle.Sites[i + 2];
    //      var a0 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(s.point, e.upperSite.point, e.lowerSite.point));
    //      var a1 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(site.point, e.upperSite.point, e.lowerSite.point));
    //      return a0 * a1 <= 0;
    //  }
    //  #endif
    LeftCase(pi: CdtSite, hittedFrontElementNode: RBNode<CdtFrontElement>, /* out */rightSite: CdtSite): CdtSite {
        // left case
        //                 if(db)ShowFrontWithSite(pi, LineSegment.mkPP(pi.point, hittedFrontElementNode.Item.Edge.upperSite.point), LineSegment.mkPP(pi.point, hittedFrontElementNode.Item.Edge.lowerSite.point));
        Assert.assert(Point.closeD(pi.point.x, hittedFrontElementNode.item.x));
        let hittedFrontElement = hittedFrontElementNode.item;
        this.InsertAndLegalizeTriangle(pi, hittedFrontElement);
        let prevToHitted = this.front.previous(hittedFrontElementNode);
        let leftSite = prevToHitted.item.LeftSite;
        rightSite = hittedFrontElementNode.item.RightSite;
        //                 if(db)ShowFrontWithSite(pi, LineSegment.mkPP(pi.point, leftSite.point), LineSegment.mkPP(pi.point, prevToHitted.Item.RightSite.point));
        this.InsertAndLegalizeTriangle(pi, prevToHitted.Item);
        this.front.deleteNodeInternal(prevToHitted);
        let d = this.front.remove(hittedFrontElement);
        Assert.assert((d != null));
        return leftSite;
    }

    MiddleCase(pi: CdtSite, hittedFrontElementNode: RBNode<CdtFrontElement>, /* out */rightSite: CdtSite): CdtSite {
        //             if(db)
        //                 ShowFrontWithSite(pi, LineSegment.mkPP(pi.point, hittedFrontElementNode.Item.Edge.upperSite.point), LineSegment.mkPP(pi.point, hittedFrontElementNode.Item.Edge.lowerSite.point));
        let leftSite = hittedFrontElementNode.item.LeftSite;
        rightSite = hittedFrontElementNode.item.RightSite;
        this.InsertAndLegalizeTriangle(pi, hittedFrontElementNode.item);
        this.front.deleteNodeInternal(hittedFrontElementNode);
        return leftSite;
    }

    TriangulateEmptySpaceToTheLeft(leftLegNode: RBNode<CdtFrontElement>) {
        let peakSite = leftLegNode.item.RightSite;
        let previousNode = this.front.previous(leftLegNode);
        while ((previousNode != null)) {
            let prevElement = previousNode.Item;
            let rp = prevElement.LeftSite;
            let r = prevElement.RightSite;
            if ((((r.point - peakSite.point)
                * (rp.point - r.point))
                < 0)) {
                // see figures 9(a) and 9(b) of the paper
                leftLegNode = this.ShortcutTwoFrontElements(previousNode, leftLegNode);
                previousNode = this.front.previous(leftLegNode);
            }
            else {
                this.TryTriangulateBasinToTheLeft(leftLegNode);
                break;
            }

        }

    }

    ShortcutTwoListElements(a: PerimeterEdge): PerimeterEdge {
        let b = a.Next;
        Assert.assert((a.End == b.Start));
        let t = new CdtTriangle(a.Start, a.End, b.End, a.Edge, b.Edge, this.createEdgeDelegate);
        this.triangles.add(t);
        let newEdge = t.Edges[2];
        Assert.assert((newEdge.IsAdjacent(a.Start) && newEdge.IsAdjacent(b.End)));
        this.LegalizeEdge(a.Start, t.OppositeEdge(a.Start));
        newEdge.CwTriangle;
        this.LegalizeEdge(b.End, t.OppositeEdge(b.End));
        let c = new PerimeterEdge(newEdge);
        a.Prev.Next = c;
        c.Prev = a.Prev;
        c.Next = b.Next;
        b.Next.Prev = c;
        return c;
    }

    //  aNode is to the left of bNode, and they are consecutive
    ShortcutTwoFrontElements(aNode: RBNode<CdtFrontElement>, bNode: RBNode<CdtFrontElement>): RBNode<CdtFrontElement> {
        let aElem = aNode.item;
        let bElem = bNode.item;
        Assert.assert((aElem.RightSite == bElem.LeftSite));
        let t: CdtTriangle = new CdtTriangle(aElem.LeftSite, aElem.RightSite, bElem.RightSite, aElem.Edge, bElem.Edge, this.createEdgeDelegate);
        this.triangles.add(t);
        this.front.deleteNodeInternal(aNode);
        // now bNode might b not valid anymore
        this.front.remove(bElem);
        let newEdge = t.Edges[2];
        Assert.assert((newEdge.IsAdjacent(aElem.LeftSite) && newEdge.IsAdjacent(bElem.RightSite)));
        this.LegalizeEdge(aElem.LeftSite, t.OppositeEdge(aElem.LeftSite));
        newEdge.CwTriangle;
        this.LegalizeEdge(bElem.RightSite, t.OppositeEdge(bElem.RightSite));
        return this.front.insert(new CdtFrontElement(aElem.LeftSite, newEdge));
    }

    TryTriangulateBasinToTheLeft(leftLegNode: RBNode<CdtFrontElement>) {
        if (!CdtSweeper.DropsSharpEnoughToTheLeft(leftLegNode.item)) {
            return;
        }

        // ShowFrontWithSite(leftLegNode.Item.LeftSite);
        let stack = new Stack<CdtSite>();
        stack.push(leftLegNode.item.LeftSite);
        while (true) {
            let site = stack.pop();
            leftLegNode = CdtSweeper.FindNodeInFrontBySite(this.front, site);
            let prev = this.front.previous(leftLegNode);
            if ((prev == null)) {
                return;
            }

            if ((Point.getTriangleOrientationWithNoEpsilon(prev.Item.LeftSite.point, leftLegNode.item.LeftSite.point, leftLegNode.item.RightSite.point) == TriangleOrientation.Counterclockwise)) {
                stack.push(prev.Item.LeftSite);
                this.ShortcutTwoFrontElements(prev, leftLegNode);
                //       ShowFrontWithSite(site);
            }
            else if ((leftLegNode.item.LeftSite.point.y > leftLegNode.item.RightSite.point.y)) {
                stack.push(prev.Item.LeftSite);
            }
            else {
                if ((prev.Item.LeftSite.point.y <= prev.Item.RightSite.point.y)) {
                    return;
                }

                stack.push(prev.Item.LeftSite);
            }

        }

    }

    static DropsSharpEnoughToTheLeft(frontElement: CdtFrontElement): boolean {
        let edge = frontElement.Edge;
        if ((frontElement.RightSite != edge.upperSite)) {
            return false;
        }

        let d = (edge.lowerSite.point - edge.upperSite.point);
        Assert.assert(((d.x < 0)
            && (d.y <= 0)));
        return (d.x >= (0.5 * d.y));
    }

    InsertSiteIntoFront(leftSite: CdtSite, pi: CdtSite, rightSite: CdtSite): RBNode<CdtFrontElement> {
        let rightEdge: CdtEdge = null;
        let leftEdge: CdtEdge = null;
        for (let edge of pi.Edges) {
            if (((leftEdge == null)
                && (edge.lowerSite == leftSite))) {
                leftEdge = edge;
            }

            if (((rightEdge == null)
                && (edge.lowerSite == rightSite))) {
                rightEdge = edge;
            }

            if (((leftEdge != null)
                && (rightEdge != null))) {
                break;
            }

        }

        Assert.assert(((leftEdge != null)
            && (rightEdge != null)));
        this.front.insert(new CdtFrontElement(leftSite, leftEdge));
        return this.front.insert(new CdtFrontElement(pi, rightEdge));
    }

    TriangulateEmptySpaceToTheRight(piNode: RBNode<CdtFrontElement>) {
        let piSite = piNode.item.LeftSite;
        let piPoint = piSite.point;
        let piNext = this.front.next(piNode);
        while ((piNext != null)) {
            let frontElem = piNext.Item;
            let r = frontElem.LeftSite;
            let rp = frontElem.RightSite;
            if ((((r.point - piPoint)
                * (rp.point - r.point))
                < 0)) {
                // see figures 9(a) and 9(b) of the paper
                piNode = this.ShortcutTwoFrontElements(piNode, piNext);
                piNext = this.front.next(piNode);
            }
            else {
                this.TryTriangulateBasinToTheRight(piNode);
                break;
            }

        }

    }

    TryTriangulateBasinToTheRight(piNode: RBNode<CdtFrontElement>) {
        if (!CdtSweeper.DropsSharpEnoughToTheRight(piNode.item)) {
            return;
        }

        //  ShowFrontWithSite(piNode.Item.LeftSite);
        let stack = new Stack<CdtSite>();
        stack.push(piNode.item.LeftSite);
        while (true) {
            let site = stack.pop();
            piNode = CdtSweeper.FindNodeInFrontBySite(this.front, site);
            let next = this.front.next(piNode);
            if ((next == null)) {
                return;
            }

            if ((Point.getTriangleOrientationWithNoEpsilon(piNode.item.LeftSite.point, piNode.item.RightSite.point, next.Item.RightSite.point) == TriangleOrientation.Counterclockwise)) {
                this.ShortcutTwoFrontElements(piNode, next);
                stack.push(site);
            }
            else if ((piNode.item.LeftSite.point.y > piNode.item.RightSite.point.y)) {
                stack.push(piNode.item.RightSite);
            }
            else {
                if ((next.Item.LeftSite.point.y >= next.Item.RightSite.point.y)) {
                    return;
                }

                stack.push(piNode.item.RightSite);
            }

        }

    }

    static DropsSharpEnoughToTheRight(frontElement: CdtFrontElement): boolean {
        let edge = frontElement.Edge;
        if ((frontElement.LeftSite != edge.upperSite)) {
            return false;
        }

        let d = (edge.lowerSite.point - edge.upperSite.point);
        Assert.assert(((d.x > 0)
            && (d.y <= 0)));
        return (d.x
            <= ((0.5 * d.y)
                * -1));
    }

    static FindNodeInFrontBySite(cdtFrontElements: RBTree<CdtFrontElement>, piSite: CdtSite): RBNode<CdtFrontElement> {
        return cdtFrontElements.findLast(() => { }, (x.LeftSite.point.x <= piSite.point.x));
    }

    InsertAndLegalizeTriangle(pi: CdtSite, frontElement: CdtFrontElement) {
        if ((Point.getTriangleOrientationWithNoEpsilon(pi.point, frontElement.LeftSite.point, frontElement.RightSite.point) != TriangleOrientation.Collinear)) {
            let tr = new CdtTriangle(pi, frontElement.Edge, this.createEdgeDelegate);
            this.triangles.add(tr);
            this.LegalizeEdge(pi, tr.Edges[0]);
        }
        else {
            // we need to split the triangle below the element of to two triangles and legalize the old edges
            // we also delete, that is forget, the frontElement.Edge
            let e = frontElement.Edge;
            e.upperSite.Edges.Remove(e);
            let t;
            e.CwTriangle;
            let oppositeSite = t.OppositeSite(e);
            CdtSweeper.RemoveTriangleButLeaveEdges(this.triangles, t);
            t = new CdtTriangle(frontElement.LeftSite, oppositeSite, pi, this.createEdgeDelegate);
            let t1 = new CdtTriangle(frontElement.RightSite, oppositeSite, pi, this.createEdgeDelegate);
            this.triangles.add(t);
            this.triangles.add(t1);
            this.LegalizeEdge(pi, t.OppositeEdge(pi));
            this.LegalizeEdge(pi, t1.OppositeEdge(pi));
        }

    }

    LegalizeEdge(pi: CdtSite, edge: CdtEdge) {
        Assert.assert(((pi != edge.upperSite)
            && (pi != edge.lowerSite)));
        if ((edge.Constrained
            || ((edge.CcwTriangle == null)
                || (edge.CwTriangle == null)))) {
            return;
        }

        if (edge.CcwTriangle.Contains(pi)) {
            this.LegalizeEdgeForOtherCwTriangle(pi, edge);
        }
        else {
            this.LegalizeEdgeForOtherCcwTriangle(pi, edge);
        }

    }

    LegalizeEdgeForOtherCcwTriangle(pi: CdtSite, edge: CdtEdge) {
        let i = edge.CcwTriangle.Edges.index(edge);
        if (this.IsIllegal(pi, edge.lowerSite, edge.CcwTriangle.Sites[(i + 2)], edge.upperSite)) {
            let e: CdtEdge = Flip(pi, edge);
            this.LegalizeEdge(pi, e.CwTriangle.OppositeEdge(pi));
            this.LegalizeEdge(pi, e.CcwTriangle.OppositeEdge(pi));
        }

    }

    //  #if TEST_MSAGL && TEST_MSAGL
    //  Array < DebugCurve > ShowIllegalEdge(CdtEdge edge, CdtSite pi, int i) {
    //      Array < DebugCurve > ls = new Array<DebugCurve>();
    //      ls.push(DebugCurve.mkDebugCurveTWCI(new Ellipse(2, 2, pi.point)));
    //      for (int j = 0; j < 3; j++) {
    //          var ee = edge.CcwTriangle.Edges[j];
    //          ls.push(DebugCurve.mkDebugCurveTWCI(j == i ? "red" : "blue", LineSegment.mkPP(ee.upperSite.point, ee.lowerSite.point)));
    //      }
    //      ls.push(DebugCurve.mkDebugCurveTWCI(100, 1, "black", Circumcircle(edge.CcwTriangle.Sites[0].point, edge.CcwTriangle.Sites[1].point, edge.CcwTriangle.Sites[2].point)));
    //      LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(ls);
    //      return ls;
    //  }
    //          static Ellipse Circumcircle(Point a, Point b, Point c) {
    //      var mab = 0.5 * (a + b);
    //      var mbc = 0.5 * (c + b);
    //      Point center;
    //      Point.LineLineIntersection(mab, mab + (b - a).Rotate(Math.PI / 2), mbc, mbc + (b - c).Rotate(Math.PI / 2), out center);
    //      var r = (center - a).Length;
    //      return new Ellipse(r, r, center);
    //  }
    //  #endif
    //  Testing that d of inside of the circumcircle of (a,b,c).
    //  The good explanation of this test is of
    //  "Guibas, Stolfi,"Primitives for the Manipulation of General Subdivisions and the Computation of Voronoi Diagrams
    //
    static InCircle(d: CdtSite, a: CdtSite, b: CdtSite, c: CdtSite): boolean {
        Assert.assert((Point.getTriangleOrientationWithNoEpsilon(a.point, b.point, c.point) == TriangleOrientation.Counterclockwise));
        let axdx = (a.point.x - d.point.x);
        let aydy = (a.point.y - d.point.y);
        let bxdx = (b.point.x - d.point.x);
        let bydy = (b.point.y - d.point.y);
        let cxdx = (c.point.x - d.point.x);
        let cydy = (c.point.y - d.point.y);
        let t0 = ((axdx * axdx)
            + (aydy * aydy));
        let t1 = ((bxdx * bxdx)
            + (bydy * bydy));
        let t2 = ((cxdx * cxdx)
            + (cydy * cydy));
        return axdx * (bydy * t2 - cydy * t1) - bxdx * (aydy * t2 - cydy * t0) + cxdx * (aydy * t1 - bydy * t0)
            > GeomConstants.tolerance;
    }

    ProjectToFront(site: CdtSite) {
        return this.front.findLast(s => s.x <= site.point.x)
    }

}
function removeFromArray<T>(arr: T[], item: T) {
    const i = arr.findIndex(e => item == e)
    if (i > 0) arr.splice(i, 1)
}
