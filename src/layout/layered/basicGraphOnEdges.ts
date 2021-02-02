import {IEdge} from './iedge'
import {Queue} from 'queue-typescript'
export class BasicGraphOnEdges {
  edges: IEdge[]
  nodeCount = 0
  inEdges: IEdge[][]
  outEdges: IEdge[][]
  selfEdges: IEdge[][]

  static mkGraphEdges(edges: IEdge[]): BasicGraphOnEdges {
    const n = new BasicGraphOnEdges()
    n.setEdges(edges, BasicGraphOnEdges.vertexCount(edges))
    return n
  }

  static mkGraphEdgesN(edges: IEdge[], numberOfVerts: number) {
    const n = new BasicGraphOnEdges()
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
  removeEdge(edge: IEdge) {
    BasicGraphOnEdges.deleteFromArray(this.edges, edge)
    if (edge.source != edge.target) {
      BasicGraphOnEdges.deleteFromArray(this.outEdges[edge.source], edge)
      BasicGraphOnEdges.deleteFromArray(this.inEdges[edge.target], edge)
    } else {
      BasicGraphOnEdges.deleteFromArray(this.selfEdges[edge.source], edge)
    }
  }

  /// finds the maximum of sources and targets, and return it incremented by 1
  static vertexCount(edges: IEdge[]) {
    let nov = 0
    for (const ie of edges) {
      if (ie.source >= nov) nov = ie.source
      if (ie.target >= nov) nov = ie.target
    }
    return ++nov
  }

  // sets edges of the graph
  setEdges(valEdges: IEdge[], nov: number) {
    this.edges = valEdges

    this.nodeCount = nov
    const outEdgesCounts = new Array(this.nodeCount).fill(0)
    const inEdgesCounts = new Array(this.nodeCount).fill(0)
    const selfEdgesCounts = new Array(this.nodeCount).fill(0)

    this.outEdges = new Array<IEdge[]>(this.nodeCount)
    this.inEdges = new Array<IEdge[]>(this.nodeCount)
    this.selfEdges = new Array<IEdge[]>(this.nodeCount)

    for (const e of this.edges) {
      if (e.source != e.target) {
        outEdgesCounts[e.source]++
        inEdgesCounts[e.target]++
      } else {
        selfEdgesCounts[e.source]++
      }
    }

    //allocate now
    for (let i = 0; i < this.nodeCount; i++) {
      this.outEdges[i] = new Array<IEdge>(outEdgesCounts[i])
      outEdgesCounts[i] = 0 //used later for edge insertion

      this.inEdges[i] = new Array<IEdge>(inEdgesCounts[i])
      inEdgesCounts[i] = 0 //used later for edge insertion

      this.selfEdges[i] = new Array<IEdge>(selfEdgesCounts[i])
      selfEdgesCounts[i] = 0 //used later for edge insertion
    }

    //set the edges now
    for (const e of this.edges) {
      const u = e.source
      const v = e.target
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

  addEdge(e: IEdge) {
    this.edges.push(e)
    if (e.source != e.target) {
      this.outEdges[e.source].push(e)
      this.inEdges[e.target].push(e)
    } else {
      this.selfEdges[e.source].push(e)
    }
  }

  // We assume that the graph is connected here
  *nodesOfConnectedGraph(): IterableIterator<number> {
    if (this.edges.length == 0) return
    const enqueed = new Set<number>()
    const q = new Queue<number>()
    let i = this.edges[0].source
    BasicGraphOnEdges.enqueue(enqueed, q, i)
    yield i
    while (q.length > 0) {
      i = q.dequeue()
      for (const e of this.outEdges[i]) {
        const s = e.target
        if (!enqueed.has(s)) {
          BasicGraphOnEdges.enqueue(enqueed, q, s)
          yield s
        }
      }
      for (const e of this.inEdges[i]) {
        const s = e.source
        if (!enqueed.has(s)) {
          BasicGraphOnEdges.enqueue(enqueed, q, s)
          yield s
        }
      }
    }
  }

  static enqueue(enqueed: Set<number>, q: Queue<number>, i: number) {
    q.enqueue(i)
    enqueed.add(i)
  }
}
