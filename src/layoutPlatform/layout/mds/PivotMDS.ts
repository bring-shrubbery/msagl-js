    import { Edge } from '../../structs/edge'
import { Graph } from '../../structs/graph'
    import { Node } from '../../structs/node'
import {Algorithm} from '../../utils/algorithm'
import { Assert } from '../../utils/assert'
import { GeomEdge } from '../core/geomEdge'
import { GeomGraph } from '../core/GeomGraph'
import { GeomNode } from '../core/geomNode'
import { LayoutSettings } from '../layered/SugiyamaLayoutSettings'
import { MdsGraphLayout } from './MDSGraphLayout'
import { MdsLayoutSettings } from './MDSLayoutSettings'
    class PiUotMDSNodeWrap
        {
            node: GeomNode 
            constructor(node:GeomNode)
            {
                this.node = node;
            }
        }

    // Initial layout using PivotMDS method for FastIncrementalLayout
    export class PivotMDS extends Algorithm
    {
        
        private graph:GeomGraph

        // scales the final layout by the specified factor on X
        private _scaleX: number
        iterationsWithMajorization: number
        public get scaleX(): number {
            return this._scaleX
        }
        public set scaleX(value: number) {
            this._scaleX = value
        }
        
        // scales the final layout by the specified factor on Y
        private _scaleY: number
        public get scaleY(): number {
            return this._scaleY
        }
        public set scaleY(value: number) {
            this._scaleY = value
        }
        

        // Layout graph by the PivotMds method.  Uses spectral techniques to obtain a layout in
        // O(n^2) time when iterations with majorization are used, otherwise it is more like O(PivotNumber*n).
        public PivotMDS(graph:GeomGraph)
        {
            this.graph = graph;
            this.scaleX = 1;
        }

        // Executes the actual algorithm.
        run()
        {
            const liftedData = {liftedGraph:GeomGraph.mk("tmpmds", null), liftedToOriginalNodes:new Map<GeomNode, GeomNode>(), liftedToOriginalEdges:new Map<GeomEdge, GeomEdge>()}
            var g = CreateLiftedGraph(this.graph, liftedData)
            const SVGLength = 0;
            for (var e  of Graph.Edges)
            {
                SVGLength += e.length;
                if (e.Source is Cluster || e.Target is Cluster) continue;
                var u = e.Source.AlgorithmData as PivotMDSNodeWrap;
                var v = e.Target.AlgorithmData as PivotMDSNodeWrap;
                var ee = new Edge(u.node, v.node)
                {
                    Length = e.length
                };
                g.Edges.Add(ee);
            }
            if (Graph.Edges.Count != 0)
            {
                avgLength /= Graph.Edges.Count;
            }
            else
            {
                avgLength = 100;
            }

            // create edges from the children of each parent cluster to the parent cluster node
            for (var c  of Graph.RootCluster.AllClustersDepthFirst())
            {
                if (c == Graph.RootCluster) continue;

                var u = new GeomNode(CurveFactory.CreateRectangle(10, 10, new Point()));
                u.UserData = c;
                c.AlgorithmData = new PivotMDSNodeWrap(u);
                g.Nodes.Add(u);
                    
                for (var v  of c.Nodes.Concat(from cc  of c.Clusters select (GeomNode)cc))
                {
                    var vv = v.AlgorithmData as PivotMDSNodeWrap;
                    g.Edges.Add(new Edge(u, vv.node)
                    {
                        Length = avgLength
                    });
                }
            }

            // create edges between clusters
            for (const e of Graph.Edges)
            {
                if (e.Source is Cluster || e.Target is Cluster)
                {
                    var u = e.Source.AlgorithmData as PivotMDSNodeWrap;
                    var v = e.Target.AlgorithmData as PivotMDSNodeWrap;
                    var ee = new Edge(u.node, v.node)
                    {
                        Length = e.Length
                    };
                    g.Edges.Add(ee);
                }
            }

            // with 0 majorization iterations we just do PivotMDS
            const settings = new MdsLayoutSettings()
            
            
                this._scaleX = this.scaleX,
                this._scaleY = this.scaleY
                this.iterationsWithMajorization = 0,
                this.removeOverlaps = false
                
            

            MdsGraphLayout mdsLayout = new MdsGraphLayout(settings, g);
            this.RunChildAlgorithm(mdsLayout, 1.0);

            g.UpdateBoundingBox();
            for (var v  of Graph.Nodes)
            {
                var m = v.AlgorithmData as PivotMDSNodeWrap;
                v.Center = m.node.center;
            }
        }
    }

 function CreateLiftedGraph(geomGraph: GeomGraph, 
    t:{liftedGraph:GeomGraph, 
        liftedToOriginalNodes:Map<GeomNode, GeomNode>,
     liftedToOriginalEdges:Map<GeomEdge, GeomEdge>}) 
     {
         for (const u of geomGraph.deepNodes()) {
            const origLiftedU = geomGraph.liftNode(u)
            const newLiftedU = getNewLifted(u, origLiftedU)

            for (const uv of u.outEdges()) {
                const liftedV = geomGraph.liftNode(uv.target)
               if (liftedV == origLiftedU) continue
                
               const newLiftedV= getNewLifted(uv.target, liftedV) 
               const uvL = new Edge(newLiftedV.node, newLiftedV.node)
               const uvGeomEdge = new GeomEdge(uvL)
               t.liftedToOriginalEdges.set(uvGeomEdge, uv )
            }
        }   
    
     function getNewLifted(v: GeomNode, vLifted:GeomNode):GeomNode {
         let newLifted = t.liftedGraph.findNode(vLifted.id)
         if (!newLifted) {
             newLifted = GeomNode.mkNode(vLifted.boundaryCurve.clone(), new Node(vLifted.id))
             t.liftedGraph.addNode(newLifted)
             t.liftedToOriginalNodes.set(newLifted, v)
         }
         return newLifted
     }
    }



