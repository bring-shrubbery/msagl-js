import {MinimumSpanningTreeByPrim} from '../../../../layoutPlatform/math/graphAlgorithms/MinimumSpanningTreeByPrim'
import {mkGraphOnEdgesArray} from '../../../../layoutPlatform/structs/basicGraphOnEdges'
import {IntPair} from '../../../../layoutPlatform/utils/IntPair'

test('rombus with diagal', () => {
  const edges = [
    new IntPair(0, 1),
    new IntPair(1, 2),
    new IntPair(2, 3),
    new IntPair(3, 0),
    new IntPair(0, 2),
  ]
  const graph = mkGraphOnEdgesArray<IntPair>(edges)
  const mstree = new MinimumSpanningTreeByPrim(
    graph,
    (e) => (e == edges[4] ? 2 : 1),
    1,
  )
  const tree = mstree.GetTreeEdges()

  expect(tree.length).toBe(3)
  const nodes = new Set<number>()
  nodes.add(0)
  nodes.add(1)
  nodes.add(2)
  nodes.add(3)
  for (const e of tree) {
    nodes.delete(e.source)
    nodes.delete(e.target)
  }
  expect(nodes.size).toBe(0)
})
