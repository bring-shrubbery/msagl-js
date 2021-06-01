import {Graph} from './../../../layoutPlatform/structs/graph'
import {Edge} from './../../../layoutPlatform/structs/edge'
import {Node} from './../../../layoutPlatform/structs/node'
import {Rectangle} from './../../../layoutPlatform/math/geometry/rectangle'
test('graph create', () => {
  const g = new Graph(null)
  expect(g.shallowNodeCount).toBe(0)
  expect(g.edgeCount).toBe(0)
  const n = new Node('n', g)
  g.addNode(n)
  expect(g.shallowNodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)

  let e = new Edge(n, n, g)
  g.addEdge(e)
  expect(g.edgeCount).toBe(1)

  const a = new Node('a', g)
  e = new Edge(a, n, g)
  g.addEdge(e)
  expect(g.shallowNodeCount).toBe(2)
  expect(g.edgeCount).toBe(2)

  e = new Edge(n, a, g)
  expect(g.shallowNodeCount).toBe(2)
  expect(g.edgeCount).toBe(3)

  expect(g.isConsistent()).toBe(true)

  const b = new Node('b', g)
  e = new Edge(a, b, g)
  // at this point the edge does not belong to this.nodes
  expect(g.isConsistent()).toBe(false)

  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)
})

test('node add graph', () => {
  const g = new Graph(null)
  const n = Graph.mkGraph('g0', g)
  const m = new Node('m', g)
  g.addNode(n)
  g.addNode(m)
  const graphs = new Array<Graph>()
  for (const gr of g.graphs()) {
    graphs.push(gr)
  }
  expect(graphs.length).toBe(1)
  const p = Graph.mkGraph('g1', g)
  n.addNode(p)
  for (const gr of n.graphs()) graphs.push(gr)
  expect(graphs.length).toBe(2)
})

test('graph delete node', () => {
  const g = new Graph(null)
  const n = new Node('n', g)
  g.addNode(n)

  let e = new Edge(n, n, g)
  g.addEdge(e)
  expect(g.edgeCount).toBe(1)
  const a = new Node('a', g)
  e = new Edge(a, n, g)
  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)

  const b = new Node('b', g)
  e = new Edge(a, b, g)
  // at this point the edge does not belong to this.nodes
  expect(g.isConsistent()).toBe(false)

  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)
  expect(g.nodeIsConsistent(n)).toBe(true)
  g.removeNode(n)
  expect(g.shallowNodeCount).toBe(2)
  expect(g.isConsistent()).toBe(true)
  g.removeNode(a)
  expect(g.isConsistent()).toBe(true)
  expect(g.shallowNodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)
})

test('graph attr', () => {
  const g = new Graph(null)
  const rect = new Rectangle({left: 0, right: 1, bottom: 0, top: 1})
  g.setAttr(0, rect)
  let r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
  g.setAttr(3, rect)
  expect(g.getAttr(2)).toBe(null)
  r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
})
