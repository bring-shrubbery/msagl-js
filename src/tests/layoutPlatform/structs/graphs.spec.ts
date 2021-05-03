import {Graph} from './../../../layoutPlatform/structs/graph'
import {Edge} from './../../../layoutPlatform/structs/edge'
import {Node} from './../../../layoutPlatform/structs/node'
import {Rectangle} from './../../../layoutPlatform/math/geometry/rectangle'
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

test('node add graph', () => {
  const g = new Graph()
  const n = Graph.mkGraph('g0')
  const m = new Node('m')
  g.addNode(n)
  g.addNode(m)
  const graphs = new Array<Graph>()
  for (const gr of g.graphs()) {
    graphs.push(gr)
  }
  expect(graphs.length).toBe(1)
  const p = Graph.mkGraph('g1')
  n.addNode(p)
  for (const gr of n.graphs()) graphs.push(gr)
  expect(graphs.length).toBe(2)
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
  const rect = new Rectangle({left: 0, right: 1, bottom: 0, top: 1})
  g.setAttr(0, rect)
  let r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
  g.setAttr(3, rect)
  expect(g.getAttr(2)).toBe(null)
  r = g.getAttr(0) as Rectangle
  expect(r.width).toBe(rect.width)
})
