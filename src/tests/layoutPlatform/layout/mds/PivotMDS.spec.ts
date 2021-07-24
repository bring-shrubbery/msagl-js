import {GeomGraph} from '../../../..'
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
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
import {layoutGraph} from '../driver'
import {MdsLayoutSettings} from '../../../../layoutPlatform/layout/mds/MDSLayoutSettings'

test('graph with subgraphs', () => {
  const dg = runLayout('src/tests/data/graphvis/clust.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'clustMDS')
})

function runLayout(fname: string) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const settings = new MdsLayoutSettings()
  layoutGraph(gg, null, () => settings)
  return dg
}

test('b7 pivot mds', () => {
  const dg = runLayout('src/tests/data/graphvis/b7.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'b7Mds.svg')
})

xtest('layout all gv files with MDS', () => {
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
    const t: SvgDebugWriter = new SvgDebugWriter('/tmp/labelClust-ndd.svg')
    t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  }
})
