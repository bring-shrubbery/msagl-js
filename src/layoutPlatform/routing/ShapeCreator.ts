    
    ///  <summary>
    ///  Class for creating Shape elements from a Graph.

import { Port } from "dotparser";
import { from, IEnumerable } from "linq-to-typescript";
import { GeomGraph, Edge, GeomNode } from "../..";
import { RelativeFloatingPort } from "../layout/core/relativeFloatingPort";
import { Shape } from "./shape";

    ///  </summary>
export    class ShapeCreator {
        
        ///  <summary>
        ///  For a given graph finds the obstacles for nodes and clusters, correctly parenting the obstacles
        ///  according to the cluster hierarchy
        ///  </summary>
        ///  <param name="graph">graph with edges to route and nodes/clusters to route around</param>
        ///  <returns>the set of obstacles with correct cluster hierarchy and ports</returns>
        public static GetShapes(graph: GeomGraph): IEnumerable<Shape> {
            let nodesToShapes = new Map<GeomNode, Shape>();
            let interestingNodes = Array.from(graph.shallowNodes()).
            filter((n) => !n.underCollapsedCluster())
            for (let v of interestingNodes) {
                nodesToShapes.set(v,  ShapeCreator.CreateShapeWithCenterPort(v));
            }
            
            for (let c of graph.RootCluster.AllClustersDepthFirst()) {
                if (!c.IsCollapsed) {
                    for (let v of c.Nodes) {
                        if (!nodesToShapes.ContainsKey(v)) {
                            nodesToShapes[v] = ShapeCreator.CreateShapeWithCenterPort(v);
                        }
                        
                    }
                    
                }
                
                if ((c == graph.RootCluster)) {
                    // TODO: Warning!!! continue If
                }
                
                let parent;
                if (c.IsCollapsed) {
                    // TODO: Warning!!! continue If
                }
                
                for (let v of c.Nodes) {
                    parent.AddChild(nodesToShapes[v]);
                }
                
                for (let d of c.Clusters) {
                    parent.AddChild(nodesToShapes[d]);
                }
                
            }
            
            for (let edge of graph.Edges) {
                let shape: Shape;
                if (nodesToShapes.TryGetValue(edge.Source, /* out */shape)) {
                    if ((edge.SourcePort != null)) {
                        shape.Ports.Insert(edge.SourcePort);
                    }
                    
                }
                
                if (nodesToShapes.TryGetValue(edge.Target, /* out */shape)) {
                    if ((edge.TargetPort != null)) {
                        shape.Ports.Insert(edge.TargetPort);
                    }
                    
                }
                
            }
            
            return nodesToShapes.Values;
        }
        
        ///  <summary>
        ///  Creates a shape with a RelativeFloatingPort for the node center, attaches it to the shape and all edges
        ///  </summary>
        ///  <param name="node"></param>
        ///  <returns>Shape obstacle for the node with simple port</returns>
        static CreateShapeWithCenterPort(node: GeomNode): Shape {
            //  Debug.Assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
            let shape = new RelativeShape(() => {  }, node.BoundaryCurve);
            let port = new RelativeFloatingPort(() => {  }, node.BoundaryCurve, () => {  }, node.Center);
            shape.Ports.Insert(port);
            for (let e of node.InEdges) {
                ShapeCreator.FixPortAtTarget(shape, port, e);
            }
            
            for (let e of node.OutEdges) {
                ShapeCreator.FixPortAtSource(shape, port, e);
            }
            
            for (let e of node.SelfEdges) {
                ShapeCreator.FixPortAtSource(shape, port, e);
                ShapeCreator.FixPortAtTarget(shape, port, e);
            }
            
            #if (TEST_MSAGL)
            return shape;
        }
        
        ///  <summary>
        ///  Creates a ClusterBoundaryPort for the cluster boundary, attaches it to the shape and all edges
        ///  </summary>
        ///  <param name="node"></param>
        ///  <returns>Shape obstacle for the node with simple port</returns>
        static CreateShapeWithClusterBoundaryPort(node: GeomNode): Shape {
            //  Debug.Assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
            Debug.Assert((node instanceof  Cluster));
            let shape = new RelativeShape(() => {  }, node.BoundaryCurve);
            let port = new ClusterBoundaryPort(() => {  }, node.BoundaryCurve, () => {  }, node.Center);
            shape.Ports.Insert(port);
            for (let e of node.InEdges) {
                ShapeCreator.FixPortAtTarget(shape, port, e);
            }
            
            for (let e of node.OutEdges) {
                ShapeCreator.FixPortAtSource(shape, port, e);
            }
            
            for (let e of node.SelfEdges) {
                ShapeCreator.FixPortAtSource(shape, port, e);
                ShapeCreator.FixPortAtTarget(shape, port, e);
            }
            
            #if (TEST_MSAGL)
            shape.UserData = node.ToString();
            #endif
            return shape;
        }
        
        static FixPortAtSource(shape: Shape, port: Port, e: Edge) {
            if ((e.SourcePort == null)) {
                e.SourcePort = port;
            }
            else {
                shape.Ports.Insert(e.SourcePort);
            }
            
        }
        
        static FixPortAtTarget(shape: Shape, port: Port, e: Edge) {
            if ((e.TargetPort == null)) {
                e.TargetPort = port;
            }
            else {
                shape.Ports.Insert(e.TargetPort);
            }
            
        }
    }
}