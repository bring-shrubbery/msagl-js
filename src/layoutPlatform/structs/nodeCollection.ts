import {Node} from './node'
import {Edge} from './edge'
import {Graph} from './graph'
export class NodeCollection {
  private *nodes_(): IterableIterator<Node> {
    for (const p of this.nodeMap) yield p[1]
  }

  private *graphs_(): IterableIterator<Graph> {
    for (const n of this.nodes_()) {
      if (n.isGraph) {
        yield n as Graph
      }
    }
  }

  find(id: string): Node {
    return this.nodeMap.get(id)
  }

  get nodes(): IterableIterator<Node> {
    return this.nodes_()
  }

  get graphs(): IterableIterator<Graph> {
    return this.graphs_()
  }

  nodeMap: Map<string, Node> = new Map<string, Node>()

  private *_edges() {
    // if we go over n.inEdges too then not self edges will be reported twice
    for (const pair of this.nodeMap) {
      for (const e of pair[1].outEdges) {
        yield e
      }
      for (const e of pair[1].selfEdges) {
        yield e
      }
    }
  }

  interGraphEdges(): IterableIterator<Edge> {
    throw new Error('not implemented')
  }

  hasNode(id: string) {
    return this.nodeMap.has(id)
  }

  getNode(id: string): Node {
    return this.nodeMap.get(id)
  }

  get nodeCount(): number {
    return this.nodeMap.size
  }

  // caution: it is a linear by the number of nodes method
  get edgeCount(): number {
    let count = 0
    for (const pair of this.nodeMap) {
      count += pair[1].outDegree + pair[1].selfDegree
    }
    return count
  }

  get edges(): IterableIterator<Edge> {
    return this._edges()
  }
  addNode(node: Node) {
    this.nodeMap.set(node.id, node)
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
    this.nodeMap.delete(node.id)
  }

  nodeIsConsistent(n: Node): boolean {
    for (const e of n.outEdges) {
      if (e.source != n) {
        return false
      }
      if (e.source == e.target) {
        return false
      }
      if (!this.nodeMap.has(e.target.id)) {
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
      if (!this.nodeMap.has(e.source.id)) {
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
    for (const pair of this.nodeMap) {
      if (!this.nodeIsConsistent(pair[1])) {
        return false
      }
    }
    return true
  }
}
