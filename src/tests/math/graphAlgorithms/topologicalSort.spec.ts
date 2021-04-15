import {TopologicalSort} from './../../../math/graphAlgorithms/topologicalSort'
function checkPair(p: [number, number], order: number[]) {
  const sourceIndex = order.indexOf(p[0])
  const targetIndex = order.indexOf(p[1])
  if (sourceIndex >= targetIndex) {
    console.log(p)
  }
  expect(sourceIndex != -1).toBe(true)
  expect(targetIndex != -1).toBe(true)
  expect(sourceIndex < targetIndex).toBe(true)
}

xtest('topo sort', () => {
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

xtest('topo sort rev', () => {
  const pairs: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 2],
  ]
  const pairs_rev: [number, number][] = pairs.map((p) => [p[1], p[0]])
  const order = TopologicalSort.getOrder(3, pairs_rev)
  expect(order.length).toBe(3)
  for (const p of pairs_rev) {
    checkPair(p, order)
  }
})

function shift(i: number, shift: number, bound: number) {
  const t = (i + shift) % bound
  return t
}

function mkPairs(n: number) {
  const pairs = []
  const off = Math.ceil(n / 2)
  for (let s = 0; s < n; s++) {
    for (let t = s + 1; t < n; t++) {
      pairs.push([shift(s, off, n), shift(t, off, n)])
    }
  }
  return pairs
}

xtest('topo sort larger', () => {
  const n = 200
  const pairs: [number, number][] = mkPairs(n)
  const order = TopologicalSort.getOrder(n, pairs)
  expect(order.length).toBe(n)
  //  for (const p of pairs) {
  //  checkPair(p, order)
  //}
})
