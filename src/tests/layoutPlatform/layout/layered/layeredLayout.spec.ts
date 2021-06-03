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

function createGeometry(
  g: Graph,
  nodeBoundaryFunc: (string) => ICurve,
): GeomGraph {
  for (const n of g.shallowNodes) {
    if (n.isGraph) {
      const subG = (n as unknown) as Graph
      new GeomGraph(subG, nodeBoundaryFunc(n.id).boundingBox.size)
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
  return new GeomGraph(g, nodeBoundaryFunc(g.id).boundingBox)
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
  const g = GeomGraph.mk(null, {width: 0, height: 0})
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
  const g = GeomGraph.mk(null, Rectangle.mkEmpty())
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
test('src/tests/data/graphvis/ER.gv', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/ER.gv')
  if (dg == null) return
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(
    GeomObject.getGeom(dg.graph) as GeomGraph,
    ss,
    new CancelToken(),
  )
})

test('b.gv', () => {
  const dg = runLayout('src/tests/data/graphvis/b.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/b.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('b100', () => {
  const dg = runLayout('src/tests/data/graphvis/b100.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/b100.svg')
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
  const dg = runLayout('src/tests/data/graphvis/longflat.gv')
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/longflat.svg')
  t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
})

test('layered layout empty graph', () => {
  const gg = GeomGraph.mk(null, Rectangle.mkEmpty())
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(gg, ss, new CancelToken())
  ll.run()
})

test('layered layout nodes only', () => {
  const g = new GeomGraph(new Graph(null), new Size(0, 0))
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

function runLayout(fname: string) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  createGeometry(dg.graph, nodeBoundaryFunc)
  const ss = new SugiyamaLayoutSettings()
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

test('layout all gv files from list', () => {
  const list: string[] = [
    'a.gv',
    'abstract.gv',
    'alf.gv',
    'arrows.gv',
    'arrowsize.gv',
    'AvantGarde.gv',
    'awilliams.gv',
    'b.gv',
    'b100.gv',
    'b102.gv',
    'b103.gv',
    'b104.gv',
    'b106.gv',
    'b117.gv',
    'b123.gv',
    'b124.gv',
    'b135.gv',
    'b143.gv',
    'b145.gv',
    'b146.gv',
    'b15.gv',
    'b155.gv',
    'b22.gv',
    'b29.gv',
    'b3.gv',
    'b33.gv',
    'b34.gv',
    'b36.gv',
    'b491.gv',
    'b51.gv',
    'b53.gv',
    'b545.gv',
    'b56.gv',
    'b57.gv',
    'b58.gv',
    'b60.gv',
    'b62.gv',
    'b68.gv',
    'b69.gv',
    'b7.gv',
    'b71.gv',
    'b73.gv',
    'b73a.gv',
    'b76.gv',
    'b77.gv',
    'b786.gv',
    'b79.gv',
    'b80.gv',
    'b80a.gv',
    'b81.gv',
    'b85.gv',
    'b94.gv',
    'b993.gv',
    'bad.gv',
    'badvoro.gv',
    'big.gv',
    'biglabel.gv',
    'Bookman.gv',
    'cairo.gv',
    'center.gv',
    'clover.gv',
    'clust.gv',
    'clust1.gv',
    'clust2.gv',
    'clust3.gv',
    'clust4.gv',
    'clust5.gv',
    'clusters.gv',
    'clustlabel.gv',
    'color.gv',
    'colors.gv',
    'colorscheme.gv',
    'compound.gv',
    'Courier.gv',
    'crazy.gv',
    'ctext.gv',
    'd.gv',
    'dd.gv',
    'decorate.gv',
    'dfa.gv',
    'dir.gv',
    'dpd.gv',
    'edgeclip.gv',
    'ER.gv',
    'fdp.gv',
    'fig6.gv',
    'flatedge.gv',
    'fsm.gv',
    'grammar.gv',
    'grdangles.gv',
    'grdcluster.gv',
    'grdcolors.gv',
    'grdfillcolor.gv',
    'grdlinear.gv',
    'grdlinear_angle.gv',
    'grdlinear_node.gv',
    'grdradial.gv',
    'grdradial_angle.gv',
    'grdradial_node.gv',
    'grdshapes.gv',
    'hashtable.gv',
    'Heawood.gv',
    'Helvetica.gv',
    'honda-tokoro.gv',
    'html.gv',
    'html2.gv',
    'in.gv',
    'inv_inv.gv',
    'inv_nul.gv',
    'inv_val.gv',
    'japanese.gv',
    'jcctree.gv',
    'jsort.gv',
    'KW91.gv',
    'labelclust-fbc.gv',
    'labelclust-fbd.gv',
    'labelclust-fbl.gv',
    'labelclust-fbr.gv',
    'labelclust-fdc.gv',
    'labelclust-fdd.gv',
    'labelclust-fdl.gv',
    'labelclust-fdr.gv',
    'labelclust-ftc.gv',
    'labelclust-ftd.gv',
    'labelclust-ftl.gv',
    'labelclust-ftr.gv',
    'labelclust-nbc.gv',
    'labelclust-nbd.gv',
    'labelclust-nbl.gv',
    'labelclust-nbr.gv',
    'labelclust-ndc.gv',
    'labelclust-ndd.gv',
    'labelclust-ndl.gv',
    'labelclust-ndr.gv',
    'labelclust-ntc.gv',
    'labelclust-ntd.gv',
    'labelclust-ntl.gv',
    'labelclust-ntr.gv',
    'labelroot-fbc.gv',
    'labelroot-fbd.gv',
    'labelroot-fbl.gv',
    'labelroot-fbr.gv',
    'labelroot-fdc.gv',
    'labelroot-fdd.gv',
    'labelroot-fdl.gv',
    'labelroot-fdr.gv',
    'labelroot-ftc.gv',
    'labelroot-ftd.gv',
    'labelroot-ftl.gv',
    'labelroot-ftr.gv',
    'labelroot-nbc.gv',
    'labelroot-nbd.gv',
    'labelroot-nbl.gv',
    'labelroot-nbr.gv',
    'labelroot-ndc.gv',
    'labelroot-ndd.gv',
    'labelroot-ndl.gv',
    'labelroot-ndr.gv',
    'labelroot-ntc.gv',
    'labelroot-ntd.gv',
    'labelroot-ntl.gv',
    'labelroot-ntr.gv',
    'Latin1.gv',
    'layer.gv',
    'layer2.gv',
    'layers.gv',
    'ldbxtried.gv',
    'longflat.gv',
    'lsunix1.gv',
    'lsunix2.gv',
    'lsunix3.gv',
    'mike.gv',
    'mode.gv',
    'multi.gv',
    'NaN.gv',
    'nestedclust.gv',
    'newarrows.gv',
    'NewCenturySchlbk.gv',
    'ngk10_4.gv',
    'nhg.gv',
    'nojustify.gv',
    'nul_inv.gv',
    'nul_nul.gv',
    'nul_val.gv',
    'ordering.gv',
    'overlap.gv',
    'p.gv',
    'p2.gv',
    'p3.gv',
    'p4.gv',
    'pack.gv',
    'Palatino.gv',
    'Petersen.gv',
    'pgram.gv',
    'pm2way.gv',
    'pmpipe.gv',
    'polypoly.gv',
    'ports.gv',
    'proc3d.gv',
    'process.gv',
    'ps.gv',
    'ps_user_shapes.gv',
    'pslib.gv',
    'rd_rules.gv',
    'record.gv',
    'record2.gv',
    'records.gv',
    'root.gv',
    'rootlabel.gv',
    'rowcolsep.gv',
    'rowe.gv',
    'russian.gv',
    'sb_box.gv',
    'sb_box_dbl.gv',
    'sb_circle.gv',
    'sb_circle_dbl.gv',
    'shapes.gv',
    'shells.gv',
    'sides.gv',
    'size.gv',
    'sl_box.gv',
    'sl_box_dbl.gv',
    'sl_circle.gv',
    'sl_circle_dbl.gv',
    'sq_rules.gv',
    'sr_box.gv',
    'sr_box_dbl.gv',
    'sr_circle.gv',
    'sr_circle_dbl.gv',
    'st_box.gv',
    'st_box_dbl.gv',
    'st_circle.gv',
    'st_circle_dbl.gv',
    'states.gv',
    'structs.gv',
    'style.gv',
    'Symbol.gv',
    'Times.gv',
    'train11.gv',
    'trapeziumlr.gv',
    'tree.gv',
    'triedds.gv',
    'try.gv',
    'unix.gv',
    'unix2.gv',
    'unix2k.gv',
    'url.gv',
    'user_shapes.gv',
    'val_inv.gv',
    'val_nul.gv',
    'val_val.gv',
    'viewfile.gv',
    'viewport.gv',
    'weight.gv',
    'world.gv',
    'xlabels.gv',
    'xx.gv',
    'ZapfChancery.gv',
    'ZapfDingbats.gv',
  ]
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of list) {
    if (i++ > 10) return
    if (f.match('big(.*).gv')) continue // the parser bug
    //console.log(f)
    let dg: DrawingGraph
    try {
      dg = runLayout(join(path, f))
    } catch (Error) {
      console.log(f + ' error' + Error.message)
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
  const nodes: GeomNode[] = [...g.shallowNodes()]
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nodeBoundaryFunc(id: string): ICurve {
  return CurveFactory.mkRectangleWithRoundedCorners(
    40, // tsize.width,
    30, // tsize.height,
    40 / 10, // tsize.width / 10,
    30 / 10, // tsize.height / 10,
    new Point(0, 0),
  )
}
