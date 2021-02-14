import {Node} from './node'
import {Edge} from './edge'
import {AttrContainer} from './attrContainer'

export class Graph extends AttrContainer {
  nodes: Map<string, Node> = new Map<string, Node>()
  private *_edges() {
    // if we go over n.inEdges too then not self edges will be reported twice
    for (const pair of this.nodes) {
      for (const e of pair[1].outEdges) yield e
      for (const e of pair[1].selfEdges) yield e
    }
  }

  get nodeCount(): number {
    return this.nodes.size
  }

  // caution: it is a linear by the number of nodes method
  get edgeCount(): number {
    let count = 0
    for (const pair of this.nodes) {
      count += pair[1].outDegree + pair[1].selfDegree
    }
    return count
  }

  get edges(): IterableIterator<Edge> {
    return this._edges()
  }
  addNode(node: Node) {
    this.nodes.set(node.id, node)
  }

  addEdge(edge: Edge): void {
    this.addNode(edge.source)
    this.addNode(edge.target)
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
    this.nodes.delete(node.id)
  }

  nodeIsConsistent(n: Node): boolean {
    for (const e of n.outEdges) {
      if (e.source != n) {
        return false
      }
      if (e.source == e.target) {
        return false
      }
      if (!this.nodes.has(e.target.id)) {
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
      if (!this.nodes.has(e.source.id)) {
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
    for (const pair of this.nodes) {
      if (!this.nodeIsConsistent(pair[1])) {
        return false
      }
    }
    return true
  }
}
