import {IntPair} from './../../utils/IntPair'
import {BasicGraphOnEdges} from './../../structs/basicGraphOnEdges'
import {Stack} from 'stack-typescript'

// Implements the topological sort
import {IEdge} from './../../structs/iedge'

function visitNodeC(
  g: BasicGraphOnEdges<IEdge>,
  u: number,
  t: number[],
  level: number,
) {
  t[u] = level
  for (const e of g.outEdges[u]) {
    const v = e.target
    if (t[v] < level) return true
    visitNodeC(g, v, t, level + 1)
  }
  return false
}

export class TopologicalSort {
  // Do a topological sort of a list of int edge tuples
  static getOrder(
    numberOfVertices: number,
    edges: [number, number][],
  ): number[] {
    const tmp = new BasicGraphOnEdges<IntPair>()
    const dag = tmp.mkGraphOnEdgesArray(
      edges.map((e) => new IntPair(e[0], e[1]), numberOfVertices),
    )
    //    Assert.assert(!hasCycle(dag), 'no cycles')
    return TopologicalSort.getOrderOnGraph(dag)
  }

  // The function returns an array arr such that
  // arr is a permutation of the graph vertices,
  // and for any edge e in graph if e.Source=arr[i]
  // e.Target=arr[j], then i is less than j
  static getOrderOnGraph(graph: BasicGraphOnEdges<IEdge>): number[] {
    const visited = new Array<boolean>(graph.NodeCount).fill(false)

    //no recursion! So we have to organize a stack
    const se = new Stack<{edges: IEdge[]; index: number; current_u: number}>()

    const order: number[] = []

    let en: IEdge[]
    for (let u = 0; u < graph.NodeCount; u++) {
      if (visited[u]) continue

      let cu = u
      visited[cu] = true
      let i = 0

      en = graph.outEdges[u]
      do {
        for (; i < en.length; i++) {
          const v = en[i].target
          if (!visited[v]) {
            visited[v] = true
            se.push({edges: en, index: i + 1, current_u: cu})
            cu = v
            en = graph.outEdges[cu]
            i = -1
          }
        }
        order.push(cu)

        if (se.length > 0) {
          const t = se.pop()
          en = t.edges
          i = t.index
          cu = t.current_u
        } else break
      } while (true)
    }
    return order.reverse()
  }
}
