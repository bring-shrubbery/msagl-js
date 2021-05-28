import {SugiyamaLayoutSettings} from '../../../../layoutPlatform/layout/layered/SugiyamaLayoutSettings'
import SortedMap = require('collections/sorted-map')
import {LayeredLayout} from '../../../../layoutPlatform/layout/layered/layeredLayout'
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
import {StringBuilder} from 'typescript-string-operations'
import {interpolateICurve} from '../../../../layoutPlatform/math/geometry/curve'
import {LayerDirectionEnum} from '../../../../layoutPlatform/layout/layered/layerDirectionEnum'
import {ICurve} from '../../../../layoutPlatform/math/geometry/icurve'

function createGeometry(
  g: Graph,
  nodeBoundaryFunc: (string) => ICurve,
): GeomGraph {
  for (const n of g.nodes) {
    if (n.isGraph) {
      const subG = (n as unknown) as Graph
      new GeomGraph(subG)
      createGeometry(subG, nodeBoundaryFunc)
    } else {
      const gn = new GeomNode(n)
      //const tsize = getTextSize(drawingNode.label.text, drawingNode.fontname)
      gn.boundaryCurve = nodeBoundaryFunc(n.id)
    }
  }
  for (const e of g.edges) {
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
  createGeometry(g.graph, nodeBoundaryFunc)
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
  for (const t of a) {
    expect(m.get(t)).toBe(t)
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
  outputGraph(g, 'TB')
  ss.layerDirection = LayerDirectionEnum.BT
  ll.run()
  outputGraph(g, 'BT')
  ss.layerDirection = LayerDirectionEnum.LR
  ll.run()
  outputGraph(g, 'LR')
  ss.layerDirection = LayerDirectionEnum.RL
  ll.run()
  outputGraph(g, 'RL')
})

test('disconnected comps', () => {
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
  duplicateDisconnected(g, '_')
  duplicateDisconnected(g, '__')
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(g, ss, new CancelToken())
  ll.run()
  const strB = new StringBuilder()
  for (const n of g.nodes()) {
    const s = n.id + ', center = ' + n.center
    strB.AppendLine(s)
  }
  strB.AppendLine('edges')
  for (const e of g.edges()) {
    strB.AppendLine(edgeString(e, true)) // true to get an array of poins
  }

  console.log(strB.ToString())
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/disconnected.svg')
  t.writeGraph(g)
})
test('margins', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
  ss.margins = {left: 100, right: 10, top: 170, bottom: 50}
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter(
    '/tmp/abstract_margins_' + ss.margins.left + '_' + ss.margins.top + '.svg',
  )
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('clusters', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/clust.gv')
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )
  ll.run()
  const t = new SvgDebugWriter('/tmp/clust.gv' + '.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('layer and node separation', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
  ss.LayerSeparation = 100
  let ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )
  ll.run()
  let t: SvgDebugWriter = new SvgDebugWriter(
    '/tmp/abstract' + ss.LayerSeparation + '_' + ss.NodeSeparation + '.svg',
  )
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  ss.NodeSeparation = 60
  ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )
  ll.run()
  t = new SvgDebugWriter(
    '/tmp/abstract' + ss.LayerSeparation + '_' + ss.NodeSeparation + '.svg',
  )
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
test('layered layout hookup abstract', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )

  expect(ll.IntGraph.nodeCount).toBe(47)
  expect(ll.IntGraph.edges.length).toBe(68)

  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/abstract.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
test('layered layout hookup longflat', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/longflat.gv')
  createGeometry(dg.graph, nodeBoundaryFunc)
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

test('layered layout empty graph', () => {
  const gg = GeomGraph.mk()
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(gg, ss, new CancelToken())
  ll.run()
})

test('layered layout nodes only', () => {
  const g = new GeomGraph(new Graph())
  g.setNode('kspacey', {width: 144, height: 100})
  g.setNode('swilliams', {width: 160, height: 100})
  g.setNode('bpitt', {width: 108, height: 100})
  g.setNode('hford', {width: 168, height: 100})
  g.setNode('lwilson', {width: 144, height: 100})
  g.setNode('kbacon', {width: 121, height: 100})
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(g, ss, new CancelToken())
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/nodes_only.svg')
  t.writeGraph(g)
})

function outputGraph(g: GeomGraph, name: string) {
  const strB = new StringBuilder()
  for (const n of g.nodes()) {
    const s = n.id + ', center = ' + n.center
    strB.AppendLine(s)
  }
  strB.AppendLine('edges')
  for (const e of g.edges()) {
    strB.AppendLine(edgeString(e, true)) // true to get an array of poins
  }

  console.log(strB.ToString())
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + name + '.svg')
  t.writeGraph(g)
}

export function edgeString(e: GeomEdge, edgesAsArrays: boolean): string {
  const s = e.source.id + '->' + e.target.id
  return (
    s +
    ', curve(' +
    (edgesAsArrays
      ? interpolateEdgeAsString(e)
      : SvgDebugWriter.curveString(e.curve)) +
    ')'
  )
}

function interpolateEdgeAsString(e: GeomEdge): string {
  const ps = interpolateEdge(e)
  let s = '[' + ps[0].toString()
  for (let i = 1; i < ps.length; i++) {
    s += ' ' + ps[i].toString()
  }
  return s + ']'
}

function duplicateDisconnected(g: GeomGraph, suffix: string) {
  const nodes: GeomNode[] = [...g.nodes()]
  const edges: GeomEdge[] = [...g.edges()]
  for (const n of nodes) {
    g.setNode(n.node.id + suffix, {width: n.width, height: n.height})
  }
  for (const e of edges) {
    g.setEdge(e.source.id + suffix, e.target.id + suffix)
  }
}
function interpolateEdge(edge: GeomEdge): Point[] {
  if (edge.edgeGeometry == null) return []
  let ret = []
  if (edge.edgeGeometry.sourceArrowhead != null)
    ret = ret.concat(
      addArrow(
        edge.curve.start,
        edge.edgeGeometry.sourceArrowhead.tipPosition,
        25,
      ),
    )
  ret = ret.concat(interpolateICurve(edge.curve, 1))
  if (edge.edgeGeometry.targetArrowhead != null) {
    ret = ret.concat(
      addArrow(
        edge.curve.end,
        edge.edgeGeometry.targetArrowhead.tipPosition,
        25,
      ),
    )
  }
  return ret
}
function addArrow(start: Point, end: Point, arrowAngle: number): Point[] {
  let dir = end.sub(start)
  const l = dir.length
  dir = dir.div(l).rotate90Ccw()
  dir = dir.mul(l * Math.tan(arrowAngle * 0.5 * (Math.PI / 180.0)))
  return [start, start.add(dir), end, start.sub(dir), start]
}
function nodeBoundaryFunc(id: string): ICurve {
  return CurveFactory.mkRectangleWithRoundedCorners(
    20, // tsize.width,
    30, // tsize.height,
    20 / 10, // tsize.width / 10,
    30 / 10, // tsize.height / 10,
    new Point(0, 0),
  )
}
