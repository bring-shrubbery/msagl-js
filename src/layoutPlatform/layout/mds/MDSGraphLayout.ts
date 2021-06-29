import { IEnumerable, from } from "linq-to-typescript"
import { HitTestBehavior } from "../../core/geometry/RTree/HitTestBehavior"
import { RectangleNode } from "../../core/geometry/RTree/RectangleNode"
import { Point } from "../../math/geometry/point"
import { Rectangle } from "../../math/geometry/rectangle"
import { GeomGraph } from "../core/GeomGraph"
import { AllPairsDistances } from "./AllPairsDistances"
import { MdsLayoutSettings } from "./MDSLayoutSettings"
import { PivotDistances } from "./PivotDistances"
import { Transform } from "./Transform"
import {Algorithm} from '../../utils/algorithm'
import { CancelToken } from "../../utils/cancelToken"
import { GeomNode } from "../core/geomNode"
import { GeomEdge } from "../core/geomEdge"

//  Class for graph layout with multidimensional scaling.
export class MdsGraphLayout extends Algorithm {
    
    graph: GeomGraph
    length:(e:GeomEdge) => number
    settings: MdsLayoutSettings
    
    //  Constructs the multidimensional scaling algorithm.
    public constructor (settings: MdsLayoutSettings, geometryGraph: GeomGraph, cancelToken:CancelToken, length:(e:GeomEdge)=> number ) {
        super(cancelToken)
        this.settings = settings;
        this.graph = geometryGraph;
        this.length = length
    }
    
    //  Executes the algorithm
    run() {
        this.LayoutConnectedComponents();
        this.SetGraphBoundingBox();
    }
    
    SetGraphBoundingBox() {
        this.graph.boundingBox = this.graph.pumpTheBoxToTheGraphWithMargins();
    }
    
    //  Scales a configuration such that the average edge length in the drawing
    //  equals the average of the given edge lengths.
    static ScaleToAverageEdgeLength(g: GeomGraph, x: number[], y: number[], length:(e:GeomEdge)=> number) {
        let index = new Map<GeomNode, number>();
        let c = 0;
        for (const node of g.shallowNodes()) {
            index.set(node, c);
            c++;
        }
        
        let avgLength: number = 0;
        let avgSum: number = 0;
        for (let edge of g.edges()) {
            let i: number = index.get(edge.source);
            let j: number = index.get(edge.target);
            avgSum +=  Math.sqrt(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2))
            avgLength += length(edge)
        }
        
        if ((avgLength > 0)) {
            avgSum /= avgLength
        }
        
    
        if (avgSum > 0) {
            for (let i: number = 0; (i < x.length); i++) {
                 x[i] /= avgSum;
                    y[i] /= avgSum;
                
            }
            
        }
        
    }
    
    //  Layouts a connected graph with Multidimensional Scaling, using
    //  shortest-path distances as Euclidean target distances.
    static LayoutGraphWithMds(geometryGraph: GeomGraph, settings: MdsLayoutSettings, arrays:{x: number[], y: number[]}, length:(e:GeomEdge)=>number) {
        arrays.x = new Array(geometryGraph.shallowNodeCount);
        arrays.y = new Array(geometryGraph.shallowNodeCount);
        if (arrays.x.length == 0) {
            return;
        }
        
        if (arrays.x.length == 1) {
            arrays.x[0] = arrays.y[0] = 0;
            return;
        }
        
        let k: number = Math.min(settings.PivotNumber, geometryGraph.shallowNodeCount);
        let iter: number = settings.GetNumberOfIterationsWithMajorization(geometryGraph.shallowNodeCount);
        let exponent: number = settings.Exponent;
        let pivotArray = new Array(k);
        const pivotDistances = new PivotDistances(geometryGraph, pivotArray, length)
        pivotDistances.run();
        let c = pivotDistances.Result;
        MultidimensionalScaling.LandmarkClassicalScaling(c, arrays, pivotArray);
        MdsGraphLayout.ScaleToAverageEdgeLength(geometryGraph, x, y);
        if ((iter > 0)) {
            let apd: AllPairsDistances = new AllPairsDistances(geometryGraph, false);
            apd.run();
            let d: number[,] = apd.Result;
            let w: number[,] = MultidimensionalScaling.ExponentialWeightMatrix(d, exponent);
            //  MultidimensionalScaling.DistanceScaling(d, x, y, w, iter);
            MultidimensionalScaling.DistanceScalingSubset(d, x, y, w, iter);
        }
        
    }
    
    //  class GeometryGraphComparer : IComparer<GeomGraph> {
    //     public int Compare(GeomGraph g1, GeomGraph g2) {
    //         return g2.Nodes.Count.CompareTo(g1.Nodes.Count);
    //     }
    // }
    //  Computes layout for possibly disconnected graphs by putting
    //  the layouts for connected components together.
    private /* internal */ LayoutConnectedComponents() {
        let graphs: GeomGraph[] = GraphConnectedComponents.CreateComponents(this.graph.node, this.graph.edges).ToArray();
        //  layout components, compute bounding boxes
        if (this.settings.RunInParallel) {
            let options: ParallelOptions = new ParallelOptions();
            #if (PPC)
            if ((this.cancelToken != null)) {
                options.CancellationToken = this.cancelToken.CancellationToken;
            }
            
            #endif
            System.Threading.Tasks.Parallel.ForEach(graphs, options, LayoutConnectedGraphWithMds);
        }
        else {
            for (let i: number = 0; (i < graphs.length); i++) {
                this.LayoutConnectedGraphWithMds(graphs[i]);
            }
            
        }
        
        if ((graphs.length > 1)) {
            MdsGraphLayout.PackGraphs(graphs, this.settings);
            // restore the parents
            for (let node in graphs.SelectMany(() => {  }, g.Nodes)) {
                node.GeometryParent = this.graph;
            }
            
        }
        
    }
    
    LayoutConnectedGraphWithMds(compGraph: GeomGraph) {
        let y: number[];
        let x: number[];
        MdsGraphLayout.LayoutGraphWithMds(compGraph, this.settings, /* out */x, /* out */y);
        if ((this.settings.RotationAngle != 0)) {
            Transform.Rotate(x, y, this.settings.RotationAngle);
        }
        
        let scaleX: number = this.settings.ScaleX;
        let scaleY: number = this.settings.ScaleY;
        let index: number = 0;
        for (let node: Node in compGraph.node) {
            node.Center = new Point((x[index] * scaleX), (y[index] * scaleY));
            index++;
            if (((index % 100) 
                        == 0)) {
                ProgressStep();
            }
            
        }
        
        if (this.settings.AdjustScale) {
            this.AdjustScale(compGraph.node);
        }
        
        if (this.settings.RemoveOverlaps) {
            GTreeOverlapRemoval.RemoveOverlaps(compGraph.node.ToArray(), this.settings.NodeSeparation);
        }
        
        compGraph.boundingBox = compGraph.pumpTheBoxToTheGraphWithMargins();
    }
    
    AdjustScale(nodes: IList<Node>) {
        if ((nodes.Count <= 5)) {
            return;
        }
        
        // we can have only a little bit of white space with a layout with only few nodes
        let repetitions: number = 10;
        let scale = 1;
        let delta = 0.5;
        let tree = MdsGraphLayout.BuildNodeTree(nodes);
        let random = new Random(1);
        for (
        ; true; 
        ) {
            const let minNumberOfHits: number = 6;
            const let maxNumberOfHits: number = 15;
            const let numberOfChecks: number = 100;
            let hits: number = MdsGraphLayout.NumberOfHits(numberOfChecks, random, tree, maxNumberOfHits);
            if ((hits < minNumberOfHits)) {
            }
            
            (1 + delta);
            if ((hits > maxNumberOfHits)) {
                scale = (scale * (1 + delta));
            }
            else {
                return;
            }
            
            2;
            // adjust the scale the graph
            this.ScaleNodes(nodes, scale);
            0;
            return;
            MdsGraphLayout.UpdateTree(tree);
        }
        
    }
    
    ScaleNodes(nodes: IList<Node>, scale: number) {
        let i: number = 0;
        for (let node: Node in nodes) {
            node.Center = (node.Center * scale);
            i++;
            if (((i % 100) 
                        == 0)) {
                ProgressStep();
            }
            
        }
        
    }
    
    static UpdateTree(tree: RectangleNode<Node, Point>) {
        if (tree.IsLeaf) {
            tree.Rectangle = tree.UserData.BoundingBox;
        }
        else {
            MdsGraphLayout.UpdateTree(tree.Left);
            MdsGraphLayout.UpdateTree(tree.Right);
            tree.rectangle = tree.Left.rectangle;
            tree.rectangle.Add(tree.Right.rectangle);
        }
        
    }
    
    static NumberOfHits(numberOfChecks: number, random: Random, tree: RectangleNode<Node, Point>, maxNumberOfHits: number): number {
        //  var l = new List<Point>();
        let numberOfHits: number = 0;
        for (let i: number = 0; (i < numberOfChecks); i++) {
            let point: Point = MdsGraphLayout.RandomPointFromBox(random, (<Rectangle>(tree.rectangle)));
            //    l.Add(point);
            HitTestBehavior.Stop;
            null;
            numberOfHits++;
            if ((numberOfHits == maxNumberOfHits)) {
                return maxNumberOfHits;
            }
            
        }
        
        // LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(Getdc(tree, l));
        return numberOfHits;
    }
    
    static BuildNodeTree(nodes: IList<Node>): RectangleNode<Node, Point> {
        return RectangleNode.CreateRectangleNodeOnEnumeration(nodes.Select(() => {  }, new RectangleNode<Node, Point>(n, n.BoundingBox)));
    }
    
    static RandomPointFromBox(random: Random, boundingBox: Rectangle): Point {
        let x = random.NextDouble();
        let y = random.NextDouble();
        let p = new Point((boundingBox.left 
                        + (boundingBox.width * x)), (boundingBox.bottom 
                        + (boundingBox.height * y)));
        return p;
    }
    
    //  Pack the given graph components to the specified aspect ratio
    public static PackGraphs(components: IEnumerable<GeomGraph>, settings: LayoutAlgorithmSettings): Rectangle {
        let rectangles: List<RectangleToPack<GeomGraph>> = from;
        c;
        let select: components;
        new RectangleToPack<GeomGraph>(c.BoundingBox, c);
        ToList();
        if ((rectangles.Count > 1)) {
            let packing: OptimalPacking<GeomGraph> = new OptimalRectanglePacking<GeomGraph>(rectangles, this.settings.PackingAspectRatio);
            // TODO: Warning!!!, inline IF is not supported ?
            (this.settings.PackingMethod == PackingMethod.Compact);
            (<OptimalPacking<GeomGraph>>(new OptimalColumnPacking<GeomGraph>(rectangles, this.settings.PackingAspectRatio)));
            packing.Run();
            for (let r in rectangles) {
                let component: GeomGraph = r.Data;
                let delta = (r.Rectangle.LeftBottom - component.boundingBox.leftBottom);
                component.Translate(delta);
            }
            
            return new Rectangle(0, 0, packing.PackedWidth, packing.PackedHeight);
        }
        
        if ((rectangles.Count == 1)) {
            return rectangles[0].Rectangle;
        }
        
        return Rectangle.CreateAnEmptyBox();
    }
}