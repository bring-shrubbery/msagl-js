///  <summary>
///  Class for creating Shape elements from a Graph.

import {from, IEnumerable} from 'linq-to-typescript'
import {GeomGraph, GeomNode, GeomEdge} from '../..'
import {Port} from '../layout/core/port'
import {RelativeFloatingPort} from '../layout/core/relativeFloatingPort'
import {Assert} from '../utils/assert'
import {ClusterBoundaryPort} from './ClusterBoundaryPort'
import {RelativeShape} from './RelativeShape'
import {Shape} from './shape'

///  </summary>
export class ShapeCreator {
  ///  <summary>
  ///  For a given graph finds the obstacles for nodes and clusters, correctly parenting the obstacles
  ///  according to the cluster hierarchy
  ///  </summary>
  ///  <param name="graph">graph with edges to route and nodes/clusters to route around</param>
  ///  <returns>the set of obstacles with correct cluster hierarchy and ports</returns>
  public static GetShapes(graph: GeomGraph): IEnumerable<Shape> {
    const nodesToShapes = new Map<GeomNode, Shape>()
    const interestingNodes = Array.from(graph.shallowNodes()).filter(
      (n) => !n.underCollapsedCluster(),
    )
    for (const v of interestingNodes) {
      nodesToShapes.set(v, ShapeCreator.CreateShapeWithCenterPort(v))
    }

    for (const c of graph.subgraphs()) {
      if (!c.graph.isCollapsed) {
        for (const v of c.shallowNodes()) {
          if (!nodesToShapes.has(v)) {
            nodesToShapes.set(v, ShapeCreator.CreateShapeWithCenterPort(v))
          }
        }
      }

      const parent: Shape = ShapeCreator.CreateShapeWithClusterBoundaryPort(c)
      nodesToShapes.set(c, parent)
      if (c.graph.isCollapsed) {
        continue
      }

      for (const v of c.shallowNodes()) {
        parent.AddChild(nodesToShapes.get(v))
      }

      for (const d of c.subgraphs()) {
        parent.AddChild(nodesToShapes.get(d))
      }
    }

    for (const edge of graph.edges()) {
      let shape = nodesToShapes.get(edge.source)
      if (shape) {
        if (edge.sourcePort != null) {
          shape.Ports.add(edge.sourcePort)
        }
      }
      shape = nodesToShapes.get(edge.target)
      if (shape) {
        if (edge.targetPort != null) {
          shape.Ports.add(edge.targetPort)
        }
      }
    }

    return from(nodesToShapes.values())
  }

  ///  <summary>
  ///  Creates a shape with a RelativeFloatingPort for the node center, attaches it to the shape and all edges
  ///  </summary>
  ///  <param name="node"></param>
  ///  <returns>Shape obstacle for the node with simple port</returns>
  static CreateShapeWithCenterPort(node: GeomNode): Shape {
    //  Assert.assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
    const shape = new RelativeShape(() => node.boundaryCurve)
    const port = RelativeFloatingPort.mk(
      () => node.boundaryCurve,
      () => node.center,
    )
    shape.Ports.add(port)
    for (const e of node.inEdges()) {
      ShapeCreator.FixPortAtTarget(shape, port, e)
    }

    for (const e of node.outEdges()) {
      ShapeCreator.FixPortAtSource(shape, port, e)
    }

    for (const e of node.selfEdges()) {
      ShapeCreator.FixPortAtSource(shape, port, e)
      ShapeCreator.FixPortAtTarget(shape, port, e)
    }

    return shape
  }

  ///  <summary>
  ///  Creates a ClusterBoundaryPort for the cluster boundary, attaches it to the shape and all edges
  ///  </summary>
  ///  <param name="node"></param>
  ///  <returns>Shape obstacle for the node with simple port</returns>
  static CreateShapeWithClusterBoundaryPort(node: GeomNode): Shape {
    //  Assert.assert(ApproximateComparer.Close(node.BoundaryCurve.BoundingBox, node.BoundingBox), "node's curve doesn't fit its bounds!");
    Assert.assert(node.isGraph())
    const shape = new RelativeShape(() => node.boundaryCurve)
    const port = ClusterBoundaryPort.mk(
      () => node.boundaryCurve,
      () => node.center,
    )
    shape.Ports.add(port)
    for (const e of node.inEdges()) {
      ShapeCreator.FixPortAtTarget(shape, port, e)
    }

    for (const e of node.outEdges()) {
      ShapeCreator.FixPortAtSource(shape, port, e)
    }

    for (const e of node.selfEdges()) {
      ShapeCreator.FixPortAtSource(shape, port, e)
      ShapeCreator.FixPortAtTarget(shape, port, e)
    }

    return shape
  }

  static FixPortAtSource(shape: Shape, port: Port, e: GeomEdge) {
    if (e.sourcePort == null) {
      e.sourcePort = port
    } else {
      shape.Ports.add(e.sourcePort)
    }
  }

  static FixPortAtTarget(shape: Shape, port: Port, e: GeomEdge) {
    if (e.targetPort == null) {
      e.targetPort = port
    } else {
      shape.Ports.add(e.targetPort)
    }
  }
}
