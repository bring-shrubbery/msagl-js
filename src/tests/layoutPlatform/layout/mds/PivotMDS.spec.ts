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
import {MdsLayoutSettings} from '../../../../layoutPlatform/layout/mds/MDSLayoutSettings'
import {layoutGraph} from '../../../../layoutPlatform/layout/driver'
import {EdgeRoutingMode} from '../../../../layoutPlatform/core/routing/EdgeRoutingMode'

test('graph with subgraphs', () => {
  const dg = runMDSLayout('src/tests/data/graphvis/clust.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'clustMDS')
})

export function runMDSLayout(
  fname: string,
  edgeRoutingMode = EdgeRoutingMode.StraightLine,
) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const settings = new MdsLayoutSettings()
  settings.edgeRoutingMode = edgeRoutingMode
  layoutGraph(gg, null, () => settings)
  return dg
}

xtest('b7 pivot mds', () => {
  const dg = runMDSLayout('src/tests/data/graphvis/b7.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'b7Mds.svg')
})

test('layout 0-50 gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 50) return
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
    } catch (Error) {
      console.log('i = ' + i + ', ' + f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/pivot' + f + '.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

test('layout 50-100 gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 100) return
    if (i < 50) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
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

test('layout 100-150 gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 150) return
    if (i < 100) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
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

test('layout 150-200 gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 200) return
    if (i < 150) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
      if (dg != null) {
        const t: SvgDebugWriter = new SvgDebugWriter('/tmp/pivot' + f + '.svg')
        t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
      }
    } catch (Error) {
      console.log(f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
  }
})

test('layout 200-250 gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 250) return
    if (i < 200) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
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

test('layout from 250 and up  gv files with MDS', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (i++ < 250) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f))
    } catch (Error) {
      console.log(f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + '_pivot.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})
