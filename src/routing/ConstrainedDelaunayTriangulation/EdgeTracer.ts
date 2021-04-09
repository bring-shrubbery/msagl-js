import { Point } from "../../math/geometry/point";
import { RBNode } from "../../structs/RBTree/rbNode";
import { RBTree } from "../../structs/RBTree/rbTree";
import { Assert } from "../../utils/assert";
import { CdtEdge } from "./CdtEdge";
import { CdtFrontElement } from "./CdtFrontElement";
import { CdtSite } from "./CdtSite";
import { CdtSweeper } from "./CdtSweeper";
import { CdtTriangle } from "./CdtTriangle";

export class EdgeTracer {
    readonly edge: CdtEdge;
    readonly triangles: Set<CdtTriangle>;
    readonly front: RBTree<CdtFrontElement>;
    readonly leftPolygon: Array<CdtSite>;
    readonly rightPolygon: Array<CdtSite>;

    // the upper site of the edge
    a: CdtSite;
    // the lower site of the edge
    b: CdtSite;
    piercedEdge: CdtEdge;
    piercedTriangle: CdtTriangle;
    piercedToTheLeftFrontElemNode: RBNode<CdtFrontElement>;
    piercedToTheRightFrontElemNode: RBNode<CdtFrontElement>;
    elementsToBeRemovedFromFront = new Array<CdtFrontElement>();
    removedTriangles = new Array<CdtTriangle>();

    constructor(edge: CdtEdge, triangles: Set<CdtTriangle>, front: RBTree<CdtFrontElement>, leftPolygon: Array<CdtSite>, rightPolygon: Array<CdtSite>) {
        this.edge = edge;
        this.triangles = triangles;
        this.front = front;
        this.leftPolygon = leftPolygon;
        this.rightPolygon = rightPolygon;
        this.a = edge.upperSite;
        this.b = edge.lowerSite;
    }

    Run() {
        this.Init();
        this.Traverse();
    }

    Traverse() {
        while (!this.BIsReached()) {
            if ((this.piercedToTheLeftFrontElemNode != null)) {
                ProcessLeftFrontPiercedElement();
            }
            else if ((piercedToTheRightFrontElemNode != null)) {
                ProcessRightFrontPiercedElement();
            }
            else {
                ProcessPiercedEdge();
            }

        }

        if ((piercedTriangle != null)) {
            RemovePiercedTriangle(piercedTriangle);
        }

        FindMoreRemovedFromFrontElements();
        for (let elem in of) {
            elementsToBeRemovedFromFront;
        }

        front.Remove(elem);
    }

    ProcessLeftFrontPiercedElement() {
        //  CdtSweeper.ShowFront(triangles, front,new []{new LineSegment(a.point, b.point),new LineSegment(piercedToTheLeftFrontElemNode.Item.Edge.lowerSite.point,piercedToTheLeftFrontElemNode.Item.Edge.upperSite.point)},null);
        let v = piercedToTheLeftFrontElemNode;
        for (
            ; Point.PointToTheLeftOfLine(v.Item.LeftSite.point, a.point, b.point);
        ) {
            elementsToBeRemovedFromFront.Add(v.Item);
            AddSiteToLeftPolygon(v.Item.LeftSite);
            v = front.Previous(v);
        }

        elementsToBeRemovedFromFront.Add(v.Item);
        AddSiteToRightPolygon(v.Item.LeftSite);
        if ((v.Item.LeftSite == b)) {
            piercedToTheLeftFrontElemNode = v;
            // this will stop the traversal
            return;
        }

        FindPiercedTriangle(v);
        piercedToTheLeftFrontElemNode = null;
    }

    FindPiercedTriangle(v: RBNode<CdtFrontElement>) {
        let e = v.Item.Edge;
        let t;
        e.CwTriangle;
        let eIndex = t.Edges.Index(e);
        for (let i: number = 1; (i <= 2); i++) {
            let ei = t.Edges[(i + eIndex)];
            let signedArea0 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(ei.lowerSite.point, a.point, b.point));
            let signedArea1 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(ei.upperSite.point, a.point, b.point));
            if (((signedArea1 * signedArea0)
                <= 0)) {
                piercedTriangle = t;
                piercedEdge = ei;
                break;
            }

        }

    }

    FindMoreRemovedFromFrontElements() {
        for (let triangle in of) {
            removedTriangles;
        }

        for (let e in of) {
            triangle.Edges;
        }

        if (((e.CcwTriangle == null)
            && (e.CwTriangle == null))) {
            let site = e.upperSite;
            // TODO: Warning!!!, inline IF is not supported ?
            (e.upperSite.point.x < e.lowerSite.point.x);
            e.lowerSite;
            let frontNode = CdtSweeper.FindNodeInFrontBySite(front, site);
            if ((frontNode.Item.Edge == e)) {
                elementsToBeRemovedFromFront.Add(frontNode.Item);
            }

        }

    }

    ProcessPiercedEdge() {
        // if(CdtSweeper.db)
        //           CdtSweeper.ShowFront(triangles, front, new[] { new LineSegment(a.point, b.point) },
        //                       new[] { new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point) });
        if ((piercedEdge.CcwTriangle == piercedTriangle)) {
            AddSiteToLeftPolygon(piercedEdge.lowerSite);
            AddSiteToRightPolygon(piercedEdge.upperSite);
        }
        else {
            AddSiteToLeftPolygon(piercedEdge.upperSite);
            AddSiteToRightPolygon(piercedEdge.lowerSite);
        }

        RemovePiercedTriangle(piercedTriangle);
        PrepareNextStateAfterPiercedEdge();
    }



    PrepareNextStateAfterPiercedEdge() {
        let t;
        piercedEdge.CcwTriangle;
        let eIndex = t.Edges.Index(piercedEdge);
        for (let i: number = 1; (i <= 2); i++) {
            let e = t.Edges[(i + eIndex)];
            let signedArea0 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(e.lowerSite.point, a.point, b.point));
            let signedArea1 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(e.upperSite.point, a.point, b.point));
            if (((signedArea1 * signedArea0)
                <= 0)) {
                if (((e.CwTriangle != null)
                    && (e.CcwTriangle != null))) {
                    piercedTriangle = t;
                    piercedEdge = e;
                    break;
                }

                // e has to belong to the front, and its triangle has to be removed
                piercedTriangle = null;
                piercedEdge = null;
                let leftSite = e.upperSite;
                // TODO: Warning!!!, inline IF is not supported ?
                (e.upperSite.point.x < e.lowerSite.point.x);
                e.lowerSite;
                let frontElem = CdtSweeper.FindNodeInFrontBySite(front, leftSite);
                Assert.assert((frontElem != null));
                if ((leftSite.point.x < a.point.x)) {
                    piercedToTheLeftFrontElemNode = frontElem;
                }
                else {
                    piercedToTheRightFrontElemNode = frontElem;
                }

                RemovePiercedTriangle(e.CwTriangle, Question, Question, e.CcwTriangle);
                break;
            }

        }
    }
    RemovePiercedTriangle(t: CdtTriangle) {
        triangles.Remove(t);
        for (let e in of) {
            t.Edges;
        }

        if ((e.CwTriangle == t)) {
            e.CwTriangle = null;
        }
        else {
            e.CcwTriangle = null;
        }

        removedTriangles.Add(t);
    }


    ProcessRightFrontPiercedElement() {
        let v = piercedToTheRightFrontElemNode;
        for (
            ; Point.PointToTheRightOfLine(v.Item.RightSite.point, a.point, b.point);
        ) {
            elementsToBeRemovedFromFront.Add(v.Item);
            this.AddSiteToRightPolygon(v.Item.RightSite);
            v = front.next(v);
        }

        elementsToBeRemovedFromFront.Add(v.Item);
        this.AddSiteToLeftPolygon(v.Item.RightSite);
        if ((v.Item.RightSite == b)) {
            piercedToTheRightFrontElemNode = v;
            // this will stop the traversal
            return;
        }

        FindPiercedTriangle(v);
        piercedToTheRightFrontElemNode = null;
    }

    AddSiteToLeftPolygon(site: CdtSite) {
        this.AddSiteToPolygonWithCheck(site, leftPolygon);
    }

    AddSiteToPolygonWithCheck(site: CdtSite, list: Array<CdtSite>) {
        if ((site == b)) {
            return;
        }

        if (((list.Count == 0)
            || (list[(list.Count - 1)] != site))) {
            list.Add(site);
        }

    }

    AddSiteToRightPolygon(site: CdtSite) {
        this.AddSiteToPolygonWithCheck(site, rightPolygon);
    }

    BIsReached(): boolean {
        let node;
        piercedToTheRightFrontElemNode;
        if ((node != null)) {
            return node.Item.Edge.IsAdjacent(b);
        }

        return piercedEdge.IsAdjacent(b);
    }


    Init() {
        //             if (CdtSweeper.D)
        //                 CdtSweeper.ShowFront(triangles, front, new[] {new LineSegment(a.point, b.point)},null);
        // new[] {new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point)});
        let frontElemNodeRightOfA = CdtSweeper.FindNodeInFrontBySite(front, a);
        let frontElemNodeLeftOfA = front.Previous(frontElemNodeRightOfA);
        if (Point.PointToTheLeftOfLine(b.point, frontElemNodeLeftOfA.Item.LeftSite.point, frontElemNodeLeftOfA.Item.RightSite.point)) {
            piercedToTheLeftFrontElemNode = frontElemNodeLeftOfA;
        }
        else if (Point.PointToTheRightOfLine(b.point, frontElemNodeRightOfA.Item.RightSite.point, frontElemNodeRightOfA.Item.LeftSite.point)) {
            piercedToTheRightFrontElemNode = frontElemNodeRightOfA;
        }
        else {
            for (let e in a.Edges) {
                let t = e.CcwTriangle;
                if ((t == null)) {
                    // TODO: Warning!!! continue If
                }

                if (Point.PointToTheLeftOfLine(b.point, e.lowerSite.point, e.upperSite.point)) {
                    // TODO: Warning!!! continue If
                }

                let eIndex = t.Edges.Index(e);
                let site = t.Sites[(eIndex + 2)];
                if (Point.PointToTheLeftOfLineOrOnLine(b.point, site.point, e.upperSite.point)) {
                    piercedEdge = t.Edges[(eIndex + 1)];
                    piercedTriangle = t;
                    //                                                 CdtSweeper.ShowFront(triangles, front, new[] { new LineSegment(e.upperSite.point, e.lowerSite.point) },
                    //                                                     new[] { new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point) });
                    break;
                }

            }

        }

    }
}
