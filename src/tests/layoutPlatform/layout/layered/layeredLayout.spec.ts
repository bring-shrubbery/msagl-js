import {SugiyamaLayoutSettings} from '../../../../layoutPlatform/layout/layered/SugiyamaLayoutSettings'
import SortedMap = require('collections/sorted-map')
import {LayeredLayout} from '../../../../layoutPlatform/layout/layered/LayeredLayout'
import {Graph} from '../../../../layoutPlatform/structs/graph'
import {GeomNode} from '../../../../layoutPlatform/layout/core/geomNode'
import {GeomEdge} from '../../../../layoutPlatform/layout/core/geomEdge'
import {CurveFactory} from '../../../../layoutPlatform/math/geometry/curveFactory'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {CancelToken} from '../../../../layoutPlatform/utils/cancelToken'
import {GeomGraph} from '../../../../layoutPlatform/layout/core/GeomGraph'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {parseDotGraph, parseDotString} from '../../../../tools/dotparser'
import {DrawingObject} from '../../../../drawing/drawingObject'
import {DrawingNode} from '../../../../drawing/drawingNode'
import {StringBuilder} from 'typescript-string-operations'

export function getTextSize(txt: string, font: string) {
  const element = document.createElement('canvas')
  const context = element.getContext('2d')
  // context.font = font
  const tsize = {
    width: context.measureText(txt).width,
    height: parseInt(context.font),
  }
  return 'size = ' + tsize.width + ' ' + tsize.height
}

function createGeometry(g: Graph): GeomGraph {
  for (const n of g.nodes) {
    const gn = new GeomNode(n)
    //const tsize = getTextSize(drawingNode.label.text, drawingNode.fontname)
    gn.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
      80, // tsize.width,
      20, // tsize.height,
      80 / 10, // tsize.width / 10,
      20 / 10, // tsize.height / 10,
      new Point(0, 0),
    )
  }
  for (const e of g.Edges) {
    new GeomEdge(e)
  }
  return new GeomGraph(g)
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
  createGeometry(g.graph)
  const ll = new LayeredLayout(
    GeomObject.getGeom(g.graph) as GeomGraph,
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

test('show API', () => {
  // Create a new geometry graph
  const g = GeomGraph.mk()
  // Add nodes to the graph. The first argument is the node id. The second is the size string
  g.setNode('kspacey', {width: 144, height: 100})
  g.setNode('swilliams', {width: 160, height: 100})
  g.setNode('bpitt', {width: 108, height: 100})
  g.setNode('hford', {width: 168, height: 100})
  g.setNode('lwilson', {width: 144, height: 100})
  g.setNode('kbacon', {width: 121, height: 100})

  // Add edges to the graph.
  g.setEdge('kspacey', 'swilliams')
  g.setEdge('swilliams', 'kbacon')
  g.setEdge('bpitt', 'kbacon')
  g.setEdge('hford', 'lwilson')
  g.setEdge('lwilson', 'kbacon')
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(g, ss, new CancelToken())
  ll.run()
  const strB = new StringBuilder()
  for (const n of g.nodes()) {
    const s = n.id + ', center = ' + n.center
    strB.AppendLine(s)
  }
  for (const e of g.edges()) {
    strB.AppendLine(edgeString(e))
  }

  console.log(strB.ToString())
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/api.svg')
  t.writeGraph(g)
})

test('layered layout hookup abstract', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )

  expect(ll.IntGraph.nodeCount).toBe(47)
  expect(ll.IntGraph.edges.length).toBe(68)

  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/ll.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
test('layered layout hookup longflat', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/longflat.gv')
  createGeometry(dg.graph)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )

  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/longflat.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
function edgeString(e: GeomEdge): string {
  const s =
    e.source.id +
    '->' +
    e.target.id +
    ', curve(' +
    SvgDebugWriter.curveString(e.curve) +
    ')'
  return s
}
