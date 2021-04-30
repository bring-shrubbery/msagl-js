import { parseDotGraph, parseDotString } from '../../../utils/dotparser'
import { SugiyamaLayoutSettings } from '../../../layout/layered/SugiyamaLayoutSettings'
import SortedMap = require('collections/sorted-map')
import { LayeredLayout } from '../../../layout/layered/LayeredLayout'
import { Graph } from '../../../structs/graph'
import { GeomNode } from '../../../layout/core/geomNode'
import { GeomEdge } from '../../../layout/core/geomEdge'
import { CurveFactory } from '../../../math/geometry/curveFactory'
import { Point } from '../../../math/geometry/point'
import { CancelToken } from '../../../utils/cancelToken'
import { GeomGraph } from '../../../layout/core/GeomGraph'
import { GeomObject } from '../../../layout/core/geomObject'
function createGeometry(g: Graph) {
  for (const n of g.nodes) {
    const gn = new GeomNode(n)
    gn.boundaryCurve = CurveFactory.mkCircle(10, new Point(0, 0))
  }
  for (const e of g.Edges) {
    new GeomEdge(e)
  }
  const geomGraph = new GeomGraph(g)
}

type P = [number, number]

test('map test', () => {
  const m = new Map<number, string>()
  m.set(1, '1')
  m.set(2.1, '2')
  const r = 2.1
  expect(m.get(1)).toBe('1')
  expect(m.get(r)).toBe('2')
  expect(m.get(2.1)).toBe('2')
  m.set(1, '4')
  expect(m.get(1)).toBe('4')
  const mi = new Map<P, string>()
  const ip0: P = [0, 0]
  mi.set(ip0, 'ip0')
  expect(mi.get(ip0)).toBe('ip0')
  const ip1: P = [0, 0]

  expect(mi.get(ip1)).toBe(undefined)
})
test('layered layout glued graph', () => {
  const graphString = 'digraph G {\n' + 'a -> b\n' + 'a -> b}'
  const g = parseDotString(graphString)
  createGeometry(g)
  const ll = new LayeredLayout(
    GeomObject.getGeom(g) as GeomGraph,
    new SugiyamaLayoutSettings(),
    new CancelToken(),
  )
  ll.CreateGluedDagSkeletonForLayering()
  for (const e of ll.gluedDagSkeletonForLayering.edges) {
    expect(e.weight).toBe(2)
  }
})
test('sorted map', () => {
  const m = SortedMap<number, number>()
  m.set(0, 0)
  m.set(-1, -1)
  m.set(2, 2)
  const a = []
  for (const [k, v] of m.entries()) {
    expect(k).toBe(v)
    a.push(k)
  }
  expect(a[0]).toBe(-1)
  expect(a[1]).toBe(0)
  expect(a[2]).toBe(2)
  expect(m.size == 3)
})

test('layered layout hookup', () => {
  const g = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(g)
  const ll = new LayeredLayout(
    GeomObject.getGeom(g) as GeomGraph,
    new SugiyamaLayoutSettings(),
    new CancelToken(),
  )
  expect(ll.IntGraph.nodeCount).toBe(47)
  expect(ll.IntGraph.edges.length).toBe(68)
  ll.run()
})
