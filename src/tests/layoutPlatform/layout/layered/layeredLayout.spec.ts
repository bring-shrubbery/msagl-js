import {SugiyamaLayoutSettings} from '../../../../layoutPlatform/layout/layered/SugiyamaLayoutSettings'
import {SortedMap} from '@esfx/collections-sortedmap'
import {LayeredLayout} from '../../../../layoutPlatform/layout/layered/layeredLayout'
import {Graph} from '../../../../layoutPlatform/structs/graph'
import {GeomNode} from '../../../../layoutPlatform/layout/core/geomNode'
import {GeomEdge} from '../../../../layoutPlatform/layout/core/geomEdge'
import {CancelToken} from '../../../../layoutPlatform/utils/cancelToken'
import {GeomGraph} from '../../../../layoutPlatform/layout/core/GeomGraph'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {parseDotGraph, parseDotString} from '../../../../tools/dotparser'
import {StringBuilder} from 'typescript-string-operations'
import {LayerDirectionEnum} from '../../../../layoutPlatform/layout/layered/layerDirectionEnum'
import {
  Rectangle,
  Size,
} from '../../../../layoutPlatform/math/geometry/rectangle'

import {join} from 'path'
import fs = require('fs')
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {Arrowhead} from '../../../../layoutPlatform/layout/core/arrowhead'
import {Node} from '../../../../layoutPlatform/structs/node'
import {Edge} from '../../../../layoutPlatform/structs/edge'
import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'
import {sortedList} from '../sortedBySizeListOfgvFiles'
import {layoutGraph} from '../../../../layoutPlatform/layout/driver'
import {
  createGeometry,
  nodeBoundaryFunc,
  labelRectFunc,
  outputGraph,
  edgeString,
} from './utils'

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

test('self on node', () => {
  const g = GeomGraph.mk('graph', Rectangle.mkEmpty())
  g.setNode('a', {width: 10, height: 10})
  g.setEdge('a', 'a')
  const ll = new LayeredLayout(
    g,
    new SugiyamaLayoutSettings(),
    new CancelToken(),
  )
  ll.run()
  for (const e of g.edges()) {
    expect(e.curve == null).toBe(false)
  }
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/self.svg')
  t.writeGraph(g)
})

test('layered layout glued graph', () => {
  const graphString = 'digraph G {\n' + 'a -> b\n' + 'a -> b}'
  const g = parseDotString(graphString)
  createGeometry(g.graph, nodeBoundaryFunc, labelRectFunc)
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
  const m = new SortedMap<number, number>()
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
  const g = GeomGraph.mk('graph', new Size(0, 0))
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
  const g = GeomGraph.mk('graph', Rectangle.mkEmpty())
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
  for (const n of g.shallowNodes()) {
    const s = n.id + ', center = ' + n.center
    strB.AppendLine(s)
  }
  strB.AppendLine('edges')
  for (const e of g.edges()) {
    strB.AppendLine(edgeString(e, true)) // true to get an array of poins
  }

  //  console.log(strB.ToString())
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/disconnected.svg')
  t.writeGraph(g)
})
test('margins', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
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
  // First we create connections without any geometry data yet
  // create the root graph
  const root = new Graph()
  // add node 'a' to root
  const a = new Node('a')
  root.addNode(a)
  //create cluster 'bcd' with nodes 'b',c', and 'd', and add it to bcd
  const bcd = new Graph('bcd')
  root.addNode(bcd)
  // add nodes 'b', 'c', and 'd' to 'bcd'
  const b = new Node('b')
  bcd.addNode(b)
  const c = new Node('c')
  bcd.addNode(c)
  const d = new Node('d')
  bcd.addNode(d)
  new Edge(b, c) // b->c
  new Edge(b, d) // b->d
  //create cluster 'efg' with nodes 'b','f', and 'g', and add it to efg
  const efg = new Graph('efg')
  root.addNode(efg)
  // add nodes 'e', 'f', and 'g' to 'efg'
  const e = new Node('e')
  efg.addNode(e)
  const f = new Node('f')
  efg.addNode(f)
  const g = new Node('g')
  efg.addNode(g)
  new Edge(e, f) // e->f
  new Edge(e, g) // e->g

  // add edges
  new Edge(a, bcd) // a->bcd
  new Edge(bcd, efg)
  new Edge(efg, a)
  new Edge(a, b) // the layout for this edge is not implemented yet, so it will not appear in the SVG file
  // Now we create geometry data neccessary for layout
  const rootGeom = createGeometry(root, nodeBoundaryFunc, labelRectFunc)

  const ss = new SugiyamaLayoutSettings()
  layoutGraph(rootGeom, null, () => ss)
  const t = new SvgDebugWriter('/tmp/clustabc' + '.svg')
  t.writeGraph(rootGeom)
})

test('layer and node separation', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
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

test('clust.gv', () => {
  const ss = new SugiyamaLayoutSettings()
  const dg = runLayout('src/tests/data/graphvis/clust.gv', ss)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/clust.gv.svg')
  t.writeGraph(<GeomGraph>GeomObject.getGeom(dg.graph))
})

test('arrowhead size default', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  Arrowhead.defaultArrowheadLength *= 2
  const geomGraph = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(geomGraph, ss, new CancelToken())
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/longArrows.svg')
  t.writeGraph(<GeomGraph>GeomObject.getGeom(dg.graph))
})

test('arrowhead size per edge', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  const geomGraph = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  for (const e of geomGraph.edges()) {
    if (e.edgeGeometry.sourceArrowhead) {
      e.edgeGeometry.sourceArrowhead.length /= 2
    }
    if (e.edgeGeometry.targetArrowhead) {
      e.edgeGeometry.targetArrowhead.length /= 2
    }
  }
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(geomGraph, ss, new CancelToken())
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/arrowheadLength.svg')
  t.writeGraph(geomGraph)
})

test('src/tests/data/graphvis/ER.gv', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/ER.gv')
  if (dg == null) return
  createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
})

test('b.gv', () => {
  const ss = new SugiyamaLayoutSettings()
  ss.BrandesThreshold = 1
  const dg = runLayout('src/tests/data/graphvis/b.gv', ss)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/btest.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
test('fsm.gv brandes', () => {
  const ss = new SugiyamaLayoutSettings()
  ss.BrandesThreshold = 1
  const dg = runLayout('src/tests/data/graphvis/fsm.gv', ss)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/fsmbrandes.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  // console.log(qualityMetric(GeomObject.getGeom(dg.graph) as GeomGraph))
})
test('fsm.gv', () => {
  const ss = new SugiyamaLayoutSettings()
  const dg = runLayout('src/tests/data/graphvis/fsm.gv', ss)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/fsmNetworkSimplex.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

xtest('process.gv', () => {
  // this is not a directed graph:todo fix the parser
  const ss = new SugiyamaLayoutSettings()
  ss.BrandesThreshold = 1
  const dg = runLayout('src/tests/data/smallGraphs/process.gv', ss)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/processBrandes.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

xtest('b100', () => {
  const dg = runLayout('src/tests/data/graphvis/b100.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/b100.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})
test('pmpipe.gv', () => {
  const dg = runLayout('src/tests/data/graphvis/pmpipe.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/pmpipe.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('layered layout hookup longflat', () => {
  const dg = runLayout('src/tests/data/graphvis/longflat.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/longflat.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('layered layout empty graph', () => {
  const gg = GeomGraph.mk('graph', Rectangle.mkEmpty())
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(gg, ss, new CancelToken())
  ll.run()
})

// the smaller number the better layout
export function qualityMetric(gg: GeomGraph): number {
  let r = 0 // the sum of edges length
  for (const e of gg.edges()) {
    r += e.source.center.sub(e.target.center).length
  }
  const internsectionWeight = 100
  for (const e of gg.edges()) {
    for (const u of gg.edges()) {
      if (e == u) continue
      if (crossed(e, u)) {
        r += internsectionWeight
      }
    }
  }
  return r
}

test('layered layout nodes only', () => {
  const g = new GeomGraph(new Graph('graph'), new Size(0, 0))
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

function runLayout(fname: string, settings: SugiyamaLayoutSettings = null) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  if (!settings) settings = new SugiyamaLayoutSettings()
  layoutGraph(gg, null, () => settings)
  return dg
}
// function runLayout(
//   fname: string,
//   ss: SugiyamaLayoutSettings = new SugiyamaLayoutSettings(),
// ) {
//   const dg = parseDotGraph(fname)
//   if (dg == null) return null
//   createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
//   const ll = new LayeredLayout(
//     GeomObject.getGeom(dg.graph) as GeomGraph,
//     ss,
//     new CancelToken(),
//   )

//   ll.run()

//   return dg
// }

test('root', () => {
  const fname = 'src/tests/data/graphvis/root.gv'
  const dg = runLayout(fname)
  if (dg != null) {
    const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + 'root.svg')
    t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  }
})

test('compound', () => {
  const dg = runLayout('src/tests/data/graphvis/compound.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'compound')
})

test('brandes', () => {
  const path = 'src/tests/data/graphvis/'

  for (let i = 0; i < sortedList.length && i < 100; i++) {
    const f = sortedList[i]
    if (f.match('big(.*).gv')) continue // the parser bug

    // pmpipe.gv = sortedList[21] fails
    let dg: DrawingGraph
    try {
      const ss = new SugiyamaLayoutSettings()
      ss.BrandesThreshold = 1
      dg = runLayout(join(path, f), ss)
    } catch (Error) {
      console.log('i = ' + i + ', file = ' + f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + 'brandes.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

test('layout first 150 gv files from list', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    //console.log(f)
    if (i++ > 150) return
    let dg: DrawingGraph
    try {
      dg = runLayout(join(path, f))
    } catch (Error) {
      console.log(f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + '.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

xtest('layout all gv files', () => {
  const path = 'src/tests/data/graphvis/'
  fs.readdir(path, (err, files) => {
    expect(err).toBe(null)
    for (const f of files) {
      if (!f.match('(.*).gv')) continue
      if (f.match('big.gv')) continue

      const fname = join(path, f)
      const dg = runLayout(fname)
      if (dg != null) {
        const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + '.svg')
        t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
      }
    }
  })
})

function duplicateDisconnected(g: GeomGraph, suffix: string) {
  const nodes: GeomNode[] = Array.from(g.shallowNodes())
  const edges: GeomEdge[] = Array.from(g.edges())
  for (const n of nodes) {
    g.setNode(n.node.id + suffix, {width: n.width, height: n.height})
  }
  for (const e of edges) {
    g.setEdge(e.source.id + suffix, e.target.id + suffix)
  }
}

function crossed(u: GeomEdge, v: GeomEdge): boolean {
  const r = LineSegment.IntersectPPPP(
    u.source.center,
    u.target.center,
    v.source.center,
    v.target.center,
  )
  if (r) {
    return LineSegment.xIsBetweenPoints(u.source.center, u.target.center, r)
  }
  return false
}
