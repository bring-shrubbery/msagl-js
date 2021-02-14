import {Graph} from './../../structs/graph'
import {Edge} from './../../structs/edge'
import {Node} from './../../structs/node'
import {Rectangle} from './../../math/geometry/rectangle'
test('graph create', () => {
  const g = new Graph()
  expect(g.nodeCount).toBe(0)
  expect(g.edgeCount).toBe(0)
  const n = new Node('n')
  g.addNode(n)
  expect(g.nodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)

  let e = new Edge(n, n)
  g.addEdge(e)
  expect(g.edgeCount).toBe(1)

  const a = new Node('a')
  e = new Edge(a, n)
  g.addEdge(e)
  expect(g.nodeCount).toBe(2)
  expect(g.edgeCount).toBe(2)

  e = new Edge(n, a)
  expect(g.nodeCount).toBe(2)
  expect(g.edgeCount).toBe(3)

  expect(g.isConsistent()).toBe(true)

  const b = new Node('b')
  e = new Edge(a, b)
  // at this point the edge does not belong to this.nodes
  expect(g.isConsistent()).toBe(false)

  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)
})

test('graph delete node', () => {
  const g = new Graph()
  const n = new Node('n')
  g.addNode(n)

  let e = new Edge(n, n)
  g.addEdge(e)
  expect(g.edgeCount).toBe(1)
  const a = new Node('a')
  e = new Edge(a, n)
  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)

  const b = new Node('b')
  e = new Edge(a, b)
  // at this point the edge does not belong to this.nodes
  expect(g.isConsistent()).toBe(false)

  g.addEdge(e)
  expect(g.isConsistent()).toBe(true)
  expect(g.nodeIsConsistent(n)).toBe(true)
  g.removeNode(n)
  expect(g.nodeCount).toBe(2)
  expect(g.isConsistent()).toBe(true)
  g.removeNode(a)
  expect(g.isConsistent()).toBe(true)
  expect(g.nodeCount).toBe(1)
  expect(g.edgeCount).toBe(0)
})

test('graph attr', () => {
  const g = new Graph()
  const rect = new Rectangle(0, 1, 0, 1)
  g.setAttr(0, rect)
  let r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
  g.setAttr(3, rect)
  expect(g.getAttr(2)).toBe(null)
  r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
})
