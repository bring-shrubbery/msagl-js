import {Graph, Node, Edge} from './../../structs/graph'
test('graph create', () => {
  const g = new Graph()
  expect(g.nodeCount).toBe(0)
  expect(g.edgeCount).toBe(0)
  const n = new Node()
  g.addNode(n)
  expect(g.nodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)
})
