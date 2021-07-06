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
import {
  Rectangle,
  Size,
} from '../../../../layoutPlatform/math/geometry/rectangle'

import {join} from 'path'
import fs = require('fs')
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {Arrowhead} from '../../../../layoutPlatform/layout/core/arrowhead'
import {GeomLabel} from '../../../../layoutPlatform/layout/core/geomLabel'
import {Assert} from '../../../../layoutPlatform/utils/assert'
import {Node} from '../../../../layoutPlatform/structs/node'
import {Edge} from '../../../../layoutPlatform/structs/edge'
import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'

const sortedList: string[] = [
  'ps_user_shapes.gv',
  'center.gv',
  'multi.gv',
  'a.gv',
  'b77.gv',
  'ps.gv',
  'in.gv',
  'b123.gv',
  'bad.gv',
  'clover.gv',
  'b76.gv',
  'b80a.gv',
  'b135.gv',
  'clustlabel.gv',
  'b80.gv',
  'b79.gv',
  'rowcolsep.gv',
  'longflat.gv',
  'Latin1.gv',
  'b545.gv',
  'b146.gv',
  'b60.gv',
  'dir.gv',
  'b491.gv',
  'b993.gv',
  'b62.gv',
  'b73.gv',
  'edgeclip.gv',
  'pack.gv',
  'user_shapes.gv',
  'b33.gv',
  'b73a.gv',
  'clust3.gv',
  'clust2.gv',
  'clust1.gv',
  'record2.gv',
  'ordering.gv',
  'try.gv',
  'd.gv',
  'fdp.gv',
  'labelclust-ndd.gv',
  'b58.gv',
  'labelclust-fdd.gv',
  'labelclust-ntd.gv',
  'nestedclust.gv',
  'labelclust-ndl.gv',
  'labelclust-ndr.gv',
  'labelclust-nbd.gv',
  'labelclust-ndc.gv',
  'labelclust-ftd.gv',
  'b7.gv',
  'labelclust-fdl.gv',
  'labelclust-fdr.gv',
  'labelclust-fbd.gv',
  'labelclust-fdc.gv',
  'rootlabel.gv',
  'labelroot-ndd.gv',
  'labelclust-ntl.gv',
  'labelclust-ntr.gv',
  'labelclust-ntc.gv',
  'labelclust-nbl.gv',
  'labelclust-nbr.gv',
  'labelclust-nbc.gv',
  'process.gv',
  'clust5.gv',
  'sb_box.gv',
  'labelroot-fdd.gv',
  'sb_circle.gv',
  'labelclust-ftl.gv',
  'labelroot-ntd.gv',
  'labelclust-ftr.gv',
  'labelclust-ftc.gv',
  'labelroot-ndl.gv',
  'labelclust-fbl.gv',
  'p3.gv',
  'labelroot-ndr.gv',
  'labelroot-nbd.gv',
  'labelclust-fbr.gv',
  'labelroot-ndc.gv',
  'labelclust-fbc.gv',
  'p2.gv',
  'clust.gv',
  'b145.gv',
  'layers.gv',
  'p.gv',
  'layer.gv',
  'labelroot-ftd.gv',
  'labelroot-fdl.gv',
  'labelroot-fdr.gv',
  'labelroot-fbd.gv',
  'labelroot-ntl.gv',
  'labelroot-fdc.gv',
  'labelroot-ntr.gv',
  'labelroot-ntc.gv',
  'labelroot-nbl.gv',
  'labelroot-nbr.gv',
  'labelroot-nbc.gv',
  'color.gv',
  'layer2.gv',
  'labelroot-ftl.gv',
  'labelroot-ftr.gv',
  'labelroot-ftc.gv',
  'labelroot-fbl.gv',
  'labelroot-fbr.gv',
  'labelroot-fbc.gv',
  'compound.gv',
  'colorscheme.gv',
  'nojustify.gv',
  'structs.gv',
  'p4.gv',
  'flatedge.gv',
  'b.gv',
  'b117.gv',
  'nhg.gv',
  'ZapfDingbats.gv',
  'colors.gv',
  'mike.gv',
  'ZapfChancery.gv',
  'sb_box_dbl.gv',
  'sb_circle_dbl.gv',
  'clust4.gv',
  'clusters.gv',
  'xlabels.gv',
  'KW91.gv',
  'records.gv',
  'ctext.gv',
  'b22.gv',
  'states.gv',
  'grdcluster.gv',
  'grdradial_node.gv',
  'russian.gv',
  'grdlinear_node.gv',
  'b155.gv',
  'nul_nul.gv',
  'tree.gv',
  'inv_nul.gv',
  'b68.gv',
  'fsm.gv',
  'inv_inv.gv',
  'nul_inv.gv',
  'hashtable.gv',
  'val_nul.gv',
  'inv_val.gv',
  'ER.gv',
  'nul_val.gv',
  'val_inv.gv',
  'b786.gv',
  'b85.gv',
  'ports.gv',
  'val_val.gv',
  'sides.gv',
  'html.gv',
  'b3.gv',
  'rowe.gv',
  'abstract.gv',
  'train11.gv',
  'jcctree.gv',
  'japanese.gv',
  'Heawood.gv',
  'b34.gv',
  'fig6.gv',
  'shapes.gv',
  'Petersen.gv',
  'Symbol.gv',
  'record.gv',
  'alf.gv',
  'dfa.gv',
  'world.gv',
  'style.gv',
  'dd.gv',
  'grdangles.gv',
  'shells.gv',
  'grdshapes.gv',
  'url.gv',
  'grammar.gv',
  'overlap.gv',
  'dpd.gv',
  'html2.gv',
  'b56.gv',
  'unix.gv',
  'Times.gv',
  'Courier.gv',
  'Bookman.gv',
  'lsunix2.gv',
  'lsunix1.gv',
  'Palatino.gv',
  'lsunix3.gv',
  'trapeziumlr.gv',
  'AvantGarde.gv',
  'NewCenturySchlbk.gv',
  'triedds.gv',
  'grdcolors.gv',
  'size.gv',
  'ngk10_4.gv',
  'unix2k.gv',
  'unix2.gv',
  'weight.gv',
  'viewfile.gv',
  'sq_rules.gv',
  'pm2way.gv',
  'arrows.gv',
  'arrowsize.gv',
  'rd_rules.gv',
  'newarrows.gv',
  'st_box.gv',
  'st_circle.gv',
  'sr_box.gv',
  'sr_circle.gv',
  'sl_box.gv',
  'sl_circle.gv',
  'b53.gv',
  'pgram.gv',
  'NaN.gv',
  'b71.gv',
  'honda-tokoro.gv',
  'Helvetica.gv',
  'biglabel.gv',
  'pmpipe.gv',
  'st_box_dbl.gv',
  'st_circle_dbl.gv',
  'sr_box_dbl.gv',
  'sr_circle_dbl.gv',
  'sl_box_dbl.gv',
  'sl_circle_dbl.gv',
  'grdlinear.gv',
  'grdfillcolor.gv',
  'ldbxtried.gv',
  'grdradial.gv',
  'crazy.gv',
  'grdlinear_angle.gv',
  'cairo.gv',
  'pslib.gv',
  'proc3d.gv',
  'jsort.gv',
  'polypoly.gv',
  'grdradial_angle.gv',
  'awilliams.gv',
  'decorate.gv',
  'b57.gv',
  'b15.gv',
  'big.gv',
  'b124.gv',
  'b36.gv',
  'b94.gv',
  'mode.gv',
  'b51.gv',
  'b69.gv',
  'badvoro.gv',
  'viewport.gv',
  'b106.gv',
  'b143.gv',
  'b29.gv',
  'xx.gv',
  'b102.gv',
  'root.gv',
  'b81.gv',
  'b103.gv',
  'b104.gv',
  'b100.gv',
]

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
  const g = GeomGraph.mk('graph', {width: 0, height: 0})
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
  const ll = new LayeredLayout(rootGeom, ss, new CancelToken())
  ll.run()
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

test('clust3', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/clust3.gv')
  const geomGraph = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(geomGraph, ss, new CancelToken())
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/testclust3.svg')
  t.writeGraph(geomGraph)
})

test('arrowhead size default', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  Arrowhead.defaultArrowheadLength *= 2
  const geomGraph = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(geomGraph, ss, new CancelToken())
  ll.run()
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/longArrows.svg')
  t.writeGraph(geomGraph)
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

function runLayout(
  fname: string,
  ss: SugiyamaLayoutSettings = new SugiyamaLayoutSettings(),
) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )

  ll.run()

  return dg
}

function outputGraph(g: GeomGraph, name: string) {
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
test('awilliams', () => {
  const fname = 'src/tests/data/graphvis/awilliams.gv'
  const dg = runLayout(fname)
  if (dg != null) {
    const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + 'awilliams.svg')
    t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  }
})

xtest('brandes', () => {
  const path = 'src/tests/data/graphvis/'

  for (let i = 0; i < sortedList.length && i < 217; i++) {
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

test('layout all gv files from list', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    //console.log(f)
    if (i++ > 160) return
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function nodeBoundaryFunc(id: string): ICurve {
  return CurveFactory.mkRectangleWithRoundedCorners(
    40.1, // tsize.width,
    30.2, // tsize.height,
    40.1 / 10, // tsize.width / 10,
    30.2 / 10, // tsize.height / 10,
    new Point(0, 0),
  )
}
export function labelRectFunc(text: string): Rectangle {
  return Rectangle.mkPP(new Point(0, 0), new Point(text.length * 10, 10.5))
}
export function createGeometry(
  g: Graph,
  nodeBoundaryFunc: (string) => ICurve,
  labelRect: (string) => Rectangle,
): GeomGraph {
  for (const n of g.shallowNodes) {
    if (n.isGraph) {
      const subG = (n as unknown) as Graph
      new GeomGraph(subG, nodeBoundaryFunc(n.id).boundingBox.size)
      createGeometry(subG, nodeBoundaryFunc, labelRect)
    } else {
      const gn = new GeomNode(n)
      //const tsize = getTextSize(drawingNode.label.text, drawingNode.fontname)
      gn.boundaryCurve = nodeBoundaryFunc(n.id)
    }
  }
  for (const e of g.edges) {
    const ge = new GeomEdge(e)
    if (e.label) {
      Assert.assert(e.label != null)
      ge.label = new GeomLabel(labelRect(e.label.text), e.label)
    }
  }
  return new GeomGraph(g, nodeBoundaryFunc(g.id).boundingBox)
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
