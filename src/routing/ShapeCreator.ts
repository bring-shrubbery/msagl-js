import { Edge } from "graphlib";
import { from, IEnumerable } from "linq-to-typescript";
import { Port } from "../core/layout/Port";
import { GeomGraph } from "../layout/core/GeomGraph";
import { GeomNode } from "../layout/core/geomNode";
import { Shape } from "./Shape";

//  Class for creating Shape elements from a Graph.
export class ShapeCreator {

  //  For a given graph finds the obstacles for nodes and clusters, correctly parenting the obstacles
  //  according to the cluster hierarchy
  //  <param name="graph">graph with edges to route and nodes/clusters to route around</param>
  //  <returns>the set of obstacles with correct cluster hierarchy and ports</returns>
  public static GetShapes(graph: GeomGraph): IEnumerable<Shape> {
    let nodesToShapes = new Map<Node, Shape>();
    let interestingNodes = from(graph.nodes()).where((n: GeomNode) => !n.underCollapsedCluster()).ToArray();
    for (let v in interestingNodes) {
      nodesToShapes[v] = ShapeCreator.CreateShapeWithCenterPort(v);
    }

    for (let c in graph.RootCluster.AllClustersDepthFirst()) {
      if (!c.IsCollapsed) {
        for (let v in c.Nodes) {
          if (!nodesToShapes.has(v)) {
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

      for (let v in c.Nodes) {
        parent.AddChild(nodesToShapes[v]);
      }

      for (let d in c.Clusters) {
        parent.AddChild(nodesToShapes[d]);
      }

    }

    for (let edge in graph.Edges) {
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

  //  Creates a shape with a RelativeFloatingPort for the node center, attaches it to the shape and all edges
  //  <param name="node"></param>
  //  <returns>Shape obstacle for the node with simple port</returns>
  static CreateShapeWithCenterPort(node: Node): Shape {
    //  Assert.assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
    let shape = new RelativeShape(() => { }, node.BoundaryCurve);
    let port = new RelativeFloatingPort(() => { }, node.BoundaryCurve, () => { }, node.Center);
    shape.Ports.Insert(port);
    for (let e in node.InEdges) {
      ShapeCreator.FixPortAtTarget(shape, port, e);
    }

    for (let e in node.OutEdges) {
      ShapeCreator.FixPortAtSource(shape, port, e);
    }

    for (let e in node.SelfEdges) {
      ShapeCreator.FixPortAtSource(shape, port, e);
      ShapeCreator.FixPortAtTarget(shape, port, e);
    }
        
        #if(TEST_MSAGL)
    return shape;
  }

  //  Creates a ClusterBoundaryPort for the cluster boundary, attaches it to the shape and all edges
  //  <param name="node"></param>
  //  <returns>Shape obstacle for the node with simple port</returns>
  static CreateShapeWithClusterBoundaryPort(node: Node): Shape {
    //  Assert.assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
    Assert.assert((node instanceof Cluster));
    let shape = new RelativeShape(() => { }, node.BoundaryCurve);
    let port = new ClusterBoundaryPort(() => { }, node.BoundaryCurve, () => { }, node.Center);
    shape.Ports.Insert(port);
    for (let e in node.InEdges) {
      ShapeCreator.FixPortAtTarget(shape, port, e);
    }

    for (let e in node.OutEdges) {
      ShapeCreator.FixPortAtSource(shape, port, e);
    }

    for (let e in node.SelfEdges) {
      ShapeCreator.FixPortAtSource(shape, port, e);
      ShapeCreator.FixPortAtTarget(shape, port, e);
    }

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

