import {TopologicalSort} from './../../../math/graphAlgorithms/topologicalSort'

function checkPair(p: [number, number], order: number[]) {
  const sourceIndex = order.indexOf(p[0])
  const targetIndex = order.indexOf(p[1])
  expect(sourceIndex != -1).toBe(true)
  expect(targetIndex != -1).toBe(true)
  expect(sourceIndex < targetIndex).toBe(true)
}

test('topo sort', () => {
  const pairs: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 2],
  ]
  const order = TopologicalSort.getOrder(3, pairs)
  expect(order.length).toBe(3)
  for (const p of pairs) {
    checkPair(p, order)
  }
})
