import {Graph, Node, Edge} from './../../structs/graph'
test('graph create', () => {
  const g = new Graph()
  expect(g.nodeCount).toBe(0)
  expect(g.edgeCount).toBe(0)
  const n = new Node()
  g.addNode(n)
  expect(g.nodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)

  let e = new Edge(n, n)
  g.addEdge(e)
  expect(g.edgeCount).toBe(1)

  const a = new Node()
  e = new Edge(a, n)
  g.addEdge(e)
  expect(g.nodeCount).toBe(2)
  expect(g.edgeCount).toBe(2)

  e = new Edge(n, a)
  expect(g.nodeCount).toBe(2)
  expect(g.edgeCount).toBe(3)

  expect(g.isConsistent()).toBe(true)

  const b = new Node()
  e = new Edge(a, b)
  // at this point the edge does not belong to this.nodes
  expect(g.isConsistent()).toBe(false)

  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)
})
