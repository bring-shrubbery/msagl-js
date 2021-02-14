import {Entity} from './entity'
import {Edge} from './edge'
import {Cluster} from './cluster'
import {Assert} from './../utils/assert'

export class Label extends Entity {
  text: string
  toString() {
    return this.text
  }
  constructor(t: string) {
    super()
    this.text = t
  }
}

export class Node extends Entity {
  id: string
  inEdges: Set<Edge> = new Set<Edge>()
  outEdges: Set<Edge> = new Set<Edge>()
  selfEdges: Set<Edge> = new Set<Edge>()

  toString(): string {
    return this.id
  }
  constructor(id: string) {
    super()
    this.id = id
  }

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

  *allClusterAncestors(): IterableIterator<Cluster> {
    let parent: Cluster = this.clusterParent
    while (parent != null) {
      yield parent
      parent = parent.clusterParent
    }
  }
}
