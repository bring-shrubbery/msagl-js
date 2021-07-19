import {GeomGraph} from '../../../..'
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
import {PivotMDS} from '../../../../layoutPlatform/layout/mds/PivotMDS'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {parseDotGraph} from '../../../../tools/dotparser'
import {
  createGeometry,
  nodeBoundaryFunc,
  labelRectFunc,
  outputGraph,
} from '../layered/layeredLayout.spec'
import {sortedList} from '../sortedBySizeListOfgvFiles'
import {join} from 'path'

test('graph with subgraphs', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/clust.gv')
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const layout = new PivotMDS(gg, null, () => 1)
  layout.run()
  outputGraph(gg, 'clustMDS')
})

function runLayout(fname: string) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const pivotLayout = new PivotMDS(
    <GeomGraph>GeomObject.getGeom(dg.graph),
    null,
    () => 1,
  )
  pivotLayout.run()
  return dg
}

test('layout all gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (i++ > 50) return
    let dg: DrawingGraph
    try {
      dg = runLayout(join(path, f))
    } catch (Error) {
      console.log(f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/pivot' + f + '.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

test('labelclust-ndd.gv with MDS', () => {
  const path = 'src/tests/data/graphvis/labelclust-ndd.gv'
  let dg: DrawingGraph
  try {
    dg = runLayout(path)
  } catch (Error) {
    console.log(path + ' error:' + Error.message)
    expect(1).toBe(0)
  }
  if (dg != null) {
    const t: SvgDebugWriter = new SvgDebugWriter('/tmp/inPivot.svg')
    t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  }
})
