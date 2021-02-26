import { parseDotGraph } from './../../../utils/dotparser'
import { SugiyamaLayoutSettings } from './../../../layout/layered/SugiyamaLayoutSettings'

import { LayeredLayout } from '../../../layout/layered/layeredLayout'
import { Graph } from '../../../structs/graph'
import { GeomNode } from '../../../layout/core/geomNode'
import { GeomEdge } from '../../../layout/core/geomEdge'
import { CurveFactory } from '../../../math/geometry/curveFactory'
import { Point } from '../../../math/geometry/point'
function createGeometry(g: Graph) {
  for (const n of g.nodes) {
    const gn = new GeomNode(n)
    gn.boundaryCurve = CurveFactory.mkCircle(10, new Point(0, 0))
  }
  for (const e of g.edges) {
    new GeomEdge(e)
  }
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

xtest('layered layout hookup', () => {
  const g = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(g)
  // const ll = new LayeredLayout(g, new SugiyamaLayoutSettings())
  // ll.run()
})
