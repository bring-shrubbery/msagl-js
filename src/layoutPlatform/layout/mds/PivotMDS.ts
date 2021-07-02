    import {Algorithm} from '../../utils/algorithm'
import { GeomGraph } from '../core/GeomGraph'
import { GeomNode } from '../core/geomNode'
import { MdsGraphLayout } from './MDSGraphLayout'
    class PivotMDSNodeWrap
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

        // scales the final layout by the specified factor
        private _scale: number
        public get scale(): number {
            return this._scale
        }
        public set scale(value: number) {
            this._scale = value
        }
        

        // Layout graph by the PivotMds method.  Uses spectral techniques to obtain a layout in
        // O(n^2) time when iterations with majorization are used, otherwise it is more like O(PivotNumber*n).
        public PivotMDS(graph:GeomGraph)
        {
            this.graph = graph;
            this.scale = 1;
        }

        // Executes the actual algorithm.
        run()
        {
            var g = CreateLiftedGraph(this.graph)
            foreach (var v in graph.Nodes)
            {
                Debug.Assert(!(v is Cluster));
                var u = new GeomNode(v.BoundaryCurve.Clone())
                {
                    UserData = v
                };
                v.AlgorithmData = new PivotMDSNodeWrap(u);
                g.Nodes.Add(u);
            }
            double avgLength = 0;
            foreach (var e in graph.Edges)
            {
                avgLength += e.Length;
                if (e.Source is Cluster || e.Target is Cluster) continue;
                var u = e.Source.AlgorithmData as PivotMDSNodeWrap;
                var v = e.Target.AlgorithmData as PivotMDSNodeWrap;
                var ee = new Edge(u.node, v.node)
                {
                    Length = e.Length
                };
                g.Edges.Add(ee);
            }
            if (graph.Edges.Count != 0)
            {
                avgLength /= graph.Edges.Count;
            }
            else
            {
                avgLength = 100;
            }

            // create edges from the children of each parent cluster to the parent cluster node
            foreach (var c in graph.RootCluster.AllClustersDepthFirst())
            {
                if (c == graph.RootCluster) continue;

                var u = new GeomNode(CurveFactory.CreateRectangle(10, 10, new Point()));
                u.UserData = c;
                c.AlgorithmData = new PivotMDSNodeWrap(u);
                g.Nodes.Add(u);
                    
                foreach (var v in c.Nodes.Concat(from cc in c.Clusters select (GeomNode)cc))
                {
                    var vv = v.AlgorithmData as PivotMDSNodeWrap;
                    g.Edges.Add(new Edge(u, vv.node)
                    {
                        Length = avgLength
                    });
                }
            }

            // create edges between clusters
            foreach (var e in graph.Edges)
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
            MdsLayoutSettings settings = new MdsLayoutSettings
            {
                ScaleX = this.scale,
                ScaleY = this.scale,
                IterationsWithMajorization = 0,
                RemoveOverlaps = false,
                AdjustScale = false
            };

            MdsGraphLayout mdsLayout = new MdsGraphLayout(settings, g);
            this.RunChildAlgorithm(mdsLayout, 1.0);

            g.UpdateBoundingBox();
            foreach (var v in graph.Nodes)
            {
                var m = v.AlgorithmData as PivotMDSNodeWrap;
                v.Center = m.node.Center;
            }
        }
    }
}
 function CreateLiftedGraph(graph: GeomGraph):GeomGraph {
    throw new Error('Function not implemented.')
}

