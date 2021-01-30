import {Node} from './node'
import {Edge} from './edge'
import {AttrContainer} from './attrContainer'

export class Graph extends AttrContainer {
  nodes: Set<Node> = new Set<Node>()
  private *_edges() {
    // if we go over n.inEdges too then not self edges will be reported twice
    for (const n of this.nodes) {
      for (const e of n.outEdges) yield e
      for (const e of n.selfEdges) yield e
    }
  }

  get nodeCount(): number {
    return this.nodes.size
  }

  // caution: it is a linear by the number of nodes method
  get edgeCount(): number {
    let count = 0
    for (const n of this.nodes) {
      count += n.outDegree + n.selfDegree
    }
    return count
  }

  get edges(): IterableIterator<Edge> {
    return this._edges()
  }
  addNode(node: Node) {
    this.nodes.add(node)
  }

  addEdge(edge: Edge): void {
    this.nodes.add(edge.source)
    this.nodes.add(edge.target)
    if (edge.source != edge.target) {
      edge.source.outEdges.add(edge)
      edge.target.inEdges.add(edge)
    } else {
      edge.source.selfEdges.add(edge)
    }
  }
  removeNode(node: Node) {
    for (const e of node.outEdges) {
      e.target.inEdges.delete(e)
    }
    for (const e of node.inEdges) {
      e.source.outEdges.delete(e)
    }
    this.nodes.delete(node)
  }

  nodeIsConsistent(n: Node): boolean {
    for (const e of n.outEdges) {
      if (e.source != n) {
        return false
      }
      if (e.source == e.target) {
        return false
      }
      if (!this.nodes.has(e.target)) {
        return false
      }
    }
    for (const e of n.inEdges) {
      if (e.target != n) {
        return false
      }

      if (e.source == e.target) {
        return false
      }
      if (!this.nodes.has(e.source)) {
        return false
      }
      return true
    }

    for (const e of n.selfEdges) {
      if (e.target != e.source) {
        return false
      }
      if (e.source == n) {
        return false
      }
    }

    return true
  }

  isConsistent(): boolean {
    for (const n of this.nodes) {
      if (!this.nodeIsConsistent(n)) {
        return false
      }
    }
    return true
  }
}
