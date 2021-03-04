import { IEdge } from './iedge'
import { Queue } from 'queue-typescript'
import { from, IEnumerable } from 'linq-to-typescript'

export class BasicGraphOnEdges<TEdge extends IEdge> {
  edges: TEdge[]
  NodeCount = 0
  inEdges: TEdge[][]
  outEdges: TEdge[][]
  selfEdges: TEdge[][];

  *incidentEdges(v: number): IterableIterator<TEdge> {
    return from(this.outEdges[v]).concatenate(from(this.inEdges[v]))
  }

  mkGraphOnEdges(edges: IEnumerable<TEdge>): BasicGraphOnEdges<TEdge> {
    const n = new BasicGraphOnEdges<TEdge>()
    n.setEdges(edges.toArray(), BasicGraphOnEdges.vertexCount(edges))
    return n
  }

  mkGraphOnEdgesArray(edges: TEdge[]): BasicGraphOnEdges<TEdge> {
    const n = new BasicGraphOnEdges<TEdge>()
    n.setEdges(edges, BasicGraphOnEdges.vertexCount(from(edges)))
    return n
  }

  mkGraphOnEdgesN(edges: TEdge[], numberOfVerts: number) {
    const n = new BasicGraphOnEdges<TEdge>()
    n.setEdges(edges, numberOfVerts)
    return n
  }

  static deleteFromArray(arr: any, obj: any) {
    const index = arr.indexOf(obj, 0)
    if (index > -1) {
      arr.splice(index, 1)
    }
  }

  // the method is not efficient, takes linear time
  removeEdge(edge: TEdge) {
    BasicGraphOnEdges.deleteFromArray(this.edges, edge)
    if (edge.Source != edge.Target) {
      BasicGraphOnEdges.deleteFromArray(this.outEdges[edge.Source], edge)
      BasicGraphOnEdges.deleteFromArray(this.inEdges[edge.Target], edge)
    } else {
      BasicGraphOnEdges.deleteFromArray(this.selfEdges[edge.Source], edge)
    }
  }

  // This method should be static be
  /// finds the maximum of sources and targets, and return it incremented by 1
  static vertexCount(edges: IEnumerable<IEdge>) {
    let nov = 0
    for (const ie of edges) {
      if (ie.Source >= nov) nov = ie.Source
      if (ie.Target >= nov) nov = ie.Target
    }
    return ++nov
  }

  // sets edges of the graph
  setEdges(valEdges: TEdge[], nov: number) {
    this.edges = valEdges

    this.NodeCount = nov
    const outEdgesCounts = new Array(this.NodeCount).fill(0)
    const inEdgesCounts = new Array(this.NodeCount).fill(0)
    const selfEdgesCounts = new Array(this.NodeCount).fill(0)

    this.outEdges = new Array<TEdge[]>(this.NodeCount)
    this.inEdges = new Array<TEdge[]>(this.NodeCount)
    this.selfEdges = new Array<TEdge[]>(this.NodeCount)

    for (const e of this.edges) {
      if (e.Source != e.Target) {
        outEdgesCounts[e.Source]++
        inEdgesCounts[e.Target]++
      } else {
        selfEdgesCounts[e.Source]++
      }
    }

    //allocate now
    for (let i = 0; i < this.NodeCount; i++) {
      this.outEdges[i] = new Array<TEdge>(outEdgesCounts[i])
      outEdgesCounts[i] = 0 //used later for edge insertion

      this.inEdges[i] = new Array<TEdge>(inEdgesCounts[i])
      inEdgesCounts[i] = 0 //used later for edge insertion

      this.selfEdges[i] = new Array<TEdge>(selfEdgesCounts[i])
      selfEdgesCounts[i] = 0 //used later for edge insertion
    }

    //set the edges now
    for (const e of this.edges) {
      const u = e.Source
      const v = e.Target
      if (u != v) {
        this.outEdges[u][outEdgesCounts[u]++] = e
        this.inEdges[v][inEdgesCounts[v]++] = e
      } else {
        this.selfEdges[u][selfEdgesCounts[u]++] = e
      }
    }
  }

  inEdgesCount(node: number) {
    return this.inEdges[node].length
  }

  outEdgesCount(node: number) {
    return this.outEdges[node].length
  }
  selfEdgesCount(node: number) {
    return this.selfEdges[node].length
  }

  addEdge(e: TEdge) {
    this.edges.push(e)
    if (e.Source != e.Target) {
      this.outEdges[e.Source].push(e)
      this.inEdges[e.Target].push(e)
    } else {
      this.selfEdges[e.Source].push(e)
    }
  }

  // We assume that the graph is connected here
  *nodesOfConnectedGraph(): IterableIterator<number> {
    if (this.edges.length == 0) return
    const enqueed = new Set<number>()
    const q = new Queue<number>()
    let i = this.edges[0].Source
    BasicGraphOnEdges.enqueue(enqueed, q, i)
    yield i
    while (q.length > 0) {
      i = q.dequeue()
      for (const e of this.outEdges[i]) {
        const s = e.Target
        if (!enqueed.has(s)) {
          BasicGraphOnEdges.enqueue(enqueed, q, s)
          yield s
        }
      }
      for (const e of this.inEdges[i]) {
        const s = e.Source
        if (!enqueed.has(s)) {
          BasicGraphOnEdges.enqueue(enqueed, q, s)
          yield s
        }
      }
    }
  }

  *pred(n: number): IterableIterator<number> {
    for (const e of this.inEdges[n]) {
      yield e.Source
    }
  }

  *succ(n: number): IterableIterator<number> {
    for (const e of this.outEdges[n]) {
      yield e.Target
    }
  }

  static enqueue(enqueed: Set<number>, q: Queue<number>, i: number) {
    q.enqueue(i)
    enqueed.add(i)
  }
}
