import {IntPair} from './intPair'
import {BasicGraph} from './../../structs/basicGraph'
import {BasicGraphOnEdges} from './../../structs/basicGraphOnEdges'
import {from} from 'linq-to-typescript'
import {Stack} from 'stack-typescript'

// Implements the topological sort
import {IEdge} from './../../structs/iedge'
export class TopologicalSort {
  // Do a topological sort of a list of int edge tuples
  static getOrder(
    numberOfVertices: number,
    edges: [number, number][],
  ): number[] {
    const tmp = new BasicGraphOnEdges<IntPair>()
    const dag = tmp.mkGraphEdges(
      edges.map((e) => new IntPair(e[0], e[1]), numberOfVertices),
    )
    return TopologicalSort.getOrderOnGraphOnEdges(dag)
  }

  // The function returns an array arr such that
  // arr is a permutation of the graph vertices,
  // and for any edge e in graph if e.Source=arr[i]
  // e.Target=arr[j], then i is less than j
  static getOrderOnGraphOnEdges(graph: BasicGraphOnEdges<IEdge>): number[] {
    const visited = new Array<boolean>(graph.nodeCount).fill(false)

    //no recursion! So we have to organize a stack
    const sv = new Stack<number>()
    const se = new Stack<[IEdge[], number]>()

    const order: number[] = []

    let en: any
    let i = 0
    for (let u = 0; u < graph.nodeCount; u++) {
      if (visited[u]) continue

      let cu = u
      visited[cu] = true

      en = graph.outEdges[u]
      do {
        for (; i < en.length; i++) {
          const v = en[i].target
          if (!visited[v]) {
            visited[v] = true
            sv.push(cu)
            se.push([en, i])
            cu = v
            en = graph.outEdges[cu]
            i = -1
          }
        }
        order.push(cu)

        if (sv.length > 0) {
          const t = se.pop()
          en = t[0]
          i = t[1]
          cu = sv.pop()
        } else break
      } while (true)
    }
    return order.reverse()
  }
}
