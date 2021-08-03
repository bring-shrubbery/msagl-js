/*
import {Edge} from 'graphlib'
import {from, IEnumerable} from 'linq-to-typescript'
import {Port} from '../core/layout/Port'
import {GeomGraph} from '../layout/core/GeomGraph'
import {GeomNode} from '../layout/core/geomNode'
import {Shape} from './Shape'

//  Class for creating Shape elements from a Graph.
export class ShapeCreator {
  //  For a given graph finds the obstacles for nodes and clusters, correctly parenting the obstacles
  //  according to the cluster hierarchy


  public static GetShapes(graph: GeomGraph): IEnumerable<Shape> {
    const nodesToShapes = new Map<Node, Shape>()
    const interestingNodes = from(graph.nodes())
      .where((n: GeomNode) => !n.underCollapsedCluster())
      .ToArray()
    for (const v of interestingNodes) {
      nodesToShapes[v] = ShapeCreator.CreateShapeWithCenterPort(v)
    }

    for (const c of graph.RootCluster.AllClustersDepthFirst()) {
      if (!c.IsCollapsed) {
        for (const v of c.Nodes) {
          if (!nodesToShapes.has(v)) {
            nodesToShapes[v] = ShapeCreator.CreateShapeWithCenterPort(v)
          }
        }
      }

      if (c == graph.RootCluster) {
        // TODO: Warning!!! continue If
      }

      const parent
      if (c.IsCollapsed) {
        // TODO: Warning!!! continue If
      }

      for (const v of c.Nodes) {
        parent.AddChild(nodesToShapes[v])
      }

      for (const d of c.Clusters) {
        parent.AddChild(nodesToShapes[d])
      }
    }

    for (const edge of graph.Edges) {
      const shape: Shape
      if (nodesToShapes.TryGetValue(edge.Source, TODOOUT shape)) {
  if (edge.SourcePort != null) {
    shape.Ports.Insert(edge.SourcePort)
  }
}

if (nodesToShapes.TryGetValue(edge.Target, TODOOUT shape)) {
  if (edge.TargetPort != null) {
    shape.Ports.Insert(edge.TargetPort)
  }
}
    }

return nodesToShapes.Values
  }

  //  Creates a shape with a RelativeFloatingPort for the node center, attaches it to the shape and all edges


  static CreateShapeWithCenterPort(node: Node): Shape {
  //  Assert.assert(Point.closeDistEps(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
  const shape = new RelativeShape((node) => node.BoundaryCurve)
  const port = new RelativeFloatingPort(
    (node) => node.BoundaryCurve,
    (node) => node.Center,
  )
  shape.Ports.Insert(port)
  for (const e of node.InEdges) {
    ShapeCreator.FixPortAtTarget(shape, port, e)
  }

  for (const e of node.OutEdges) {
    ShapeCreator.FixPortAtSource(shape, port, e)
  }

  for (const e of node.SelfEdges) {
    ShapeCreator.FixPortAtSource(shape, port, e)
    ShapeCreator.FixPortAtTarget(shape, port, e)
  }

  return shape
}

  //  Creates a ClusterBoundaryPort for the cluster boundary, attaches it to the shape and all edges


  static CreateShapeWithClusterBoundaryPort(node: Node): Shape {
  //  Assert.assert(Point.closeDistEps(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
  Assert.assert(node instanceof Cluster)
  const shape = new RelativeShape((node) => node.BoundaryCurve)
  const port = new ClusterBoundaryPort(
    (node) => node.BoundaryCurve,
    (node) => node.Center,
  )
  shape.Ports.Insert(port)
  for (const e of node.InEdges) {
    ShapeCreator.FixPortAtTarget(shape, port, e)
  }

  for (const e of node.OutEdges) {
    ShapeCreator.FixPortAtSource(shape, port, e)
  }

  for (const e of node.SelfEdges) {
    ShapeCreator.FixPortAtSource(shape, port, e)
    ShapeCreator.FixPortAtTarget(shape, port, e)
  }

  return shape
}

  static FixPortAtSource(shape: Shape, port: Port, e: Edge) {
  if (e.SourcePort == null) {
    e.SourcePort = port
  } else {
    shape.Ports.Insert(e.SourcePort)
  }
}

  static FixPortAtTarget(shape: Shape, port: Port, e: Edge) {
  if (e.TargetPort == null) {
    e.TargetPort = port
  } else {
    shape.Ports.Insert(e.TargetPort)
  }
}
}
*/
