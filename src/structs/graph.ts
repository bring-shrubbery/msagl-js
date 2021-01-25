import {Assert} from '../utils/assert'

export class Entity {
  private attrs: any[]
  constructor() {
    // extend the array on demand
    this.attrs = []
  }
  setAtrr(position: number, val: any) {
    if (this.attrs.length < position) {
      do {
        this.attrs.push(null)
      } while (this.attrs.length < position)
      this.attrs.push(val)
    } else if (this.attrs.length == position) this.attrs.push(val)
    else this.attrs[position] = val
  }
}

export class Node extends Entity {
  inEdges: Set<Edge> = new Set<Edge>()
  outEdges: Set<Edge> = new Set<Edge>()
  selfEdges: Set<Edge> = new Set<Edge>()

  private *_edges(): IterableIterator<Edge> {
    for (const e of this.inEdges) yield e
    for (const e of this.outEdges) yield e
    for (const e of this.selfEdges) yield e
  }

  private addInEdge(edge: Edge): void {
    Assert.assert(edge.target == this)
    this.inEdges.add(edge)
  }

  private addOutEdge(edge: Edge): void {
    Assert.assert(edge.source == this)
    this.outEdges.add(edge)
  }

  private addSelfEdge(edge: Edge): void {
    Assert.assert(edge.source == edge.target && edge.source == this)
    this.selfEdges.add(edge)
  }

  addEdde(e: Edge) {
    if (this == e.source) {
      if (e.target == this) this.addSelfEdge(e)
      else this.addOutEdge(e)
    } else if (this == e.target) {
      this.addInEdge(e)
    } else {
      Assert.assert(false, 'attaching an edge to a wrong node')
    }
  }

  get edges(): IterableIterator<Edge> {
    return this._edges()
  }

  get outDegree(): number {
    return this.outEdges.size
  }
  get inDegree(): number {
    return this.inEdges.size
  }
  get selfDegree(): number {
    return this.selfEdges.size
  }

  get degree(): number {
    return this.outDegree + this.inDegree + this.selfDegree
  }
}

export class Edge extends Entity {
  source: Node
  target: Node
  constructor(s: Node, t: Node) {
    super()
    this.source = s
    this.target = t
    if (s != t) {
      s.outEdges.add(this)
      t.outEdges.add(this)
    } else {
      s.selfEdges.add(this)
    }
  }
}

export class Graph extends Entity {
  private nodes: Set<Node> = new Set<Node>()
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

  // caution it is a linear by the number of nodes method
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
    if (edge.source != edge.target) {
      edge.source.outEdges.add(edge)
      edge.target.outEdges.add(edge)
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
}
