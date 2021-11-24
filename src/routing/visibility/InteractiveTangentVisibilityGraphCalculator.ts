import { IEnumerable } from "linq-to-typescript";
import { Point, ICurve } from "../..";
import { TriangleOrientation } from "../../math/geometry/point";
import { RBNode } from "../../structs/RBTree/rbNode";
import { RBTree } from "../../structs/RBTree/rbTree";
import { Polygon } from "./Polygon";
import { TangentPair } from "./TangentPair";
import { VisibilityGraph } from "./VisibilityGraph";
import { Algorithm } from "../../utils/algorithm";
import { Diagonal } from "./Diagonal";
import { Tangent } from "./Tangent";

export class InteractiveTangentVisibilityGraphCalculator extends Algorithm {
        
    //  the list of obstacles
    
    polygons: Array<Polygon>;
    
    //  From these polygons we calculate visibility edges to all other polygons
    
    addedPolygons: IEnumerable<Polygon>;
    
    visibilityGraph: VisibilityGraph;
    
    diagonals: Array<Diagonal>;
    
    tangents: Array<Tangent>;
    
    activeDiagonalTree: RBTree<Diagonal>;
    
    currentPolygon: Polygon;
    
    activeDiagonalComparer: ActiveDiagonalComparerWithRay = new ActiveDiagonalComparerWithRay();
    
    useLeftPTangents: boolean;
    
    //  we calculate tangents between activePolygons and between activePolygons and existingObsacles
    
     run() {
        this.useLeftPTangents = true;
        this.CalculateAndAddEdges();
        // use another family of tangents
        this.useLeftPTangents = false;
        this.CalculateAndAddEdges();
    }
    
    CalculateAndAddEdges() {
        for (let p: Polygon in of) {
            this.addedPolygons;
        }
        
        this.CalculateVisibleTangentsFromPolygon(p);
        ProgressStep();
    }
    
    private CalculateVisibleTangentsFromPolygon(polygon: Polygon) {
        this.currentPolygon = polygon;
        this.AllocateDataStructures();
        this.OrganizeTangents();
        this.InitActiveDiagonals();
        this.Sweep();
    }
    
    private AllocateDataStructures() {
        this.tangents = new Array<Tangent>();
        this.diagonals = new Array<Diagonal>();
        this.activeDiagonalTree = new RBTree<Diagonal>(this.activeDiagonalComparer);
    }
    
    private Sweep() {
        if ((this.tangents.Count < 2)) {
            return;
        }
        
        for (let i: number = 1; (i < this.tangents.Count); i++) {
            // we processed the first element already
            let t: Tangent = this.tangents[i];
            if ((t.Diagonal != null)) {
                if ((t.Diagonal.RbNode == this.activeDiagonalTree.TreeMinimum())) {
                    this.AddVisibleEdge(t);
                }
                
                if (t.IsHigh) {
                    this.RemoveDiagonalFromActiveNodes(t.Diagonal);
                }
                
            }
            else if (t.IsLow) {
                this.activeDiagonalComparer.PointOnTangentAndInsertedDiagonal = t.End.point;
                this.InsertActiveDiagonal(new Diagonal(t, t.Comp));
                if ((t.Diagonal.RbNode == this.activeDiagonalTree.TreeMinimum())) {
                    this.AddVisibleEdge(t);
                }
                
            }
            
            #if (TEST_MSAGL)
        }
        
    }
    
    private AddVisibleEdge(t: Tangent) {
        VisibilityGraph.addEdge(this.visibilityGraph.GetVertex(t.start), this.visibilityGraph.GetVertex(t.End));
    }
    
    //  this function will also add the first tangent to the visible edges if needed
    
    private InitActiveDiagonals() {
        if ((this.tangents.Count == 0)) {
            return;
        }
        
        let firstTangent: Tangent = this.tangents[0];
        let firstTangentStart: Point = firstTangent.start.point;
        let firstTangentEnd: Point = firstTangent.End.point;
        for (let diagonal: Diagonal in of) {
            this.diagonals;
        }
        
        if (InteractiveTangentVisibilityGraphCalculator.RayIntersectDiagonal(firstTangentStart, firstTangentEnd, diagonal)) {
            this.activeDiagonalComparer.PointOnTangentAndInsertedDiagonal = ActiveDiagonalComparerWithRay.IntersectDiagonalWithRay(firstTangentStart, firstTangentEnd, diagonal);
            this.InsertActiveDiagonal(diagonal);
        }
        
        if ((firstTangent.Diagonal.RbNode == this.activeDiagonalTree.TreeMinimum())) {
            this.AddVisibleEdge(firstTangent);
        }
        
        if ((firstTangent.IsLow == false)) {
            // remove the diagonal of the top tangent from active edges
            let diag: Diagonal = firstTangent.Diagonal;
            this.RemoveDiagonalFromActiveNodes(diag);
        }
        
    }
    
    @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
    private AddPolylinesForShow(curves: Array<ICurve>) {
        for (let p: Polygon in of) {
            this.AllObstacles;
        }
        
        curves.Add(p.Polyline);
    }
    
    private RemoveDiagonalFromActiveNodes(diag: Diagonal) {
        let changedNode: RBNode<Diagonal> = this.activeDiagonalTree.DeleteSubtree(diag.RbNode);
        if ((changedNode != null)) {
            if ((changedNode.Item != null)) {
                changedNode.Item.RbNode = changedNode;
            }
            
        }
        
        diag.LeftTangent.Diagonal = null;
        diag.RightTangent.Diagonal = null;
    }
    
    private InsertActiveDiagonal(diagonal: Diagonal) {
        diagonal.RbNode = this.activeDiagonalTree.Insert(diagonal);
        InteractiveTangentVisibilityGraphCalculator.MarkDiagonalAsActiveInTangents(diagonal);
    }
    
    private static MarkDiagonalAsActiveInTangents(diagonal: Diagonal) {
        diagonal.LeftTangent.Diagonal = diagonal;
        diagonal.RightTangent.Diagonal = diagonal;
    }
    
    static RayIntersectDiagonal(pivot: Point, pointOnRay: Point, diagonal: Diagonal): boolean {
        let a: Point = diagonal.start;
        let b: Point = diagonal.End;
        return ((Point.getTriangleOrientation(pivot, a, b) == TriangleOrientation.Counterclockwise) 
                    && ((Point.getTriangleOrientation(pivot, pointOnRay, a) != TriangleOrientation.Counterclockwise) 
                    && (Point.getTriangleOrientation(pivot, pointOnRay, b) != TriangleOrientation.Clockwise)));
    }
    
    //  compare tangents by measuring the counterclockwise angle between the tangent and the edge
    
    TangentComparison(e0: Tangent, e1: Tangent): number {
        return StemStartPointComparer.CompareVectorsByAngleToXAxis((e0.End.point - e0.start.point), (e1.End.point - e1.start.point));
    }
    
    get AllObstacles(): IEnumerable<Polygon> {
        for (let p: Polygon in of) {
            this.addedPolygons;
        }
        
        yield;
        return p;
        for (let p: Polygon in of) {
            this.polygons;
        }
        
        yield;
        return p;
    }
    
    private OrganizeTangents() {
        for (let q: Polygon in of) {
            this.AllObstacles;
        }
        
        if ((q != this.currentPolygon)) {
            this.ProcessPolygonQ(q);
        }
        
        this.tangents.Sort(new Comparison<Tangent>(TangentComparison));
    }
    
    private ProcessPolygonQ(q: Polygon) {
        let tangentPair: TangentPair = new TangentPair(this.currentPolygon, q);
        if (this.useLeftPTangents) {
            tangentPair.CalculateLeftTangents();
        }
        else {
            tangentPair.CalculateRightTangents();
        }
        
        let couple: Tuple<number, number> = tangentPair.leftPLeftQ;
        // TODO: Warning!!!, inline IF is not supported ?
        this.useLeftPTangents;
        tangentPair.rightPLeftQ;
        let t0: Tangent = new Tangent(this.currentPolygon[couple.Item1], q[couple.Item2]);
        t0.IsLow = true;
        t0.SeparatingPolygons = !this.useLeftPTangents;
        couple = tangentPair.leftPRightQ;
        // TODO: Warning!!!, inline IF is not supported ?
        this.useLeftPTangents;
        tangentPair.rightPRightQ;
        let t1: Tangent = new Tangent(this.currentPolygon[couple.Item1], q[couple.Item2]);
        t1.IsLow = false;
        t1.SeparatingPolygons = this.useLeftPTangents;
        t0.Comp = t1;
        t1.Comp = t0;
        this.tangents.Add(t0);
        this.tangents.Add(t1);
        this.diagonals.Add(new Diagonal(t0, t1));
    }
    
    public constructor (holes: ICollection<Polygon>, addedPolygons: IEnumerable<Polygon>, visibilityGraph: VisibilityGraph) {
        this.polygons = holes;
        this.visibilityGraph = this.visibilityGraph;
        this.addedPolygons = this.addedPolygons;
    }
    
    export class FilterVisibleEdgesDelegate extends System.Delegate {
    }
}