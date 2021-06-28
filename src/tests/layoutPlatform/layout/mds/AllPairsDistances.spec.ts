import {GeomEdge} from '../../../../layoutPlatform/layout/core/geomEdge'
import {AllPairsDistances} from '../../../../layoutPlatform/layout/mds/AllPairsDistances'
import {CurveFactory} from '../../../../layoutPlatform/math/geometry/curveFactory'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {Edge} from '../../../../layoutPlatform/structs/edge'
import {Graph} from '../../../../layoutPlatform/structs/graph'
import {Node} from '../../../../layoutPlatform/structs/node'
import {createGeometry} from '../layered/layeredLayout.spec'

test('all pairs distances', () => {
  const graph = new Graph(null)
  // make a trapeze (abcd), with sides ab = 1, bc = 0.5, cd = 1, da = 1
  const a = new Node('a', graph)
  const b = new Node('b', graph)
  const c = new Node('c', graph)
  const d = new Node('d', graph)
  graph.addNode(a)
  graph.addNode(b)
  graph.addNode(c)
  graph.addNode(d)
  new Edge(a, b, graph)
  const bc = new Edge(b, c, graph)
  new Edge(c, d, graph)
  new Edge(d, a, graph)

  const nodes = []
  for (const n of graph.shallowNodes) {
    nodes.push(n)
  }

  // make sure that we iterate the nodes in the order abcd
  for (let i = 0; i < nodes.length; i++)
    expect(nodes[i].id.charAt(0)).toBe('abcd'.charAt(i))

  const geomGraph = createGeometry(
    graph,
    () => CurveFactory.createRectangle(10, 10, new Point(0, 0)),
    () => null,
  )
  const length = (e: GeomEdge) => (e.edge == bc ? 0.5 : 1)
  const ss = new AllPairsDistances(geomGraph, length)
  ss.run()
  const res = ss.Result
  expect(res.length).toBe(4)
  expect(res[0][0]).toBe(0)
  expect(res[0][1]).toBe(1)
  expect(res[0][2]).toBe(1.5)
  expect(res[0][3]).toBe(1)
  expect(res[1][0]).toBe(1)
  expect(res[1][1]).toBe(0)
  expect(res[1][2]).toBe(0.5)
  expect(res[1][3]).toBe(1.5)
  expect(res[2][0]).toBe(1.5)
  expect(res[2][1]).toBe(0.5)
  expect(res[2][2]).toBe(0)
  expect(res[2][3]).toBe(1)
  expect(res[3][0]).toBe(res[0][3])
  expect(res[3][1]).toBe(res[1][3])
  expect(res[3][2]).toBe(res[2][3])
  expect(res[3][3]).toBe(res[3][3])
})
