import {GeomGraph} from '@/src/layout/core'
import {DrawingGraph} from '@/test/drawing/drawingGraph'
import {GeomObject} from '@/src/layout/core/geomObject'
import {SvgDebugWriter} from '@/test/utils/svgDebugWriter'
import {sortedList} from '../sortedBySizeListOfgvFiles'
import {join} from 'path'
import {outputGraph, runMDSLayout} from '@/test/utils/testUtils'

test('graph with subgraphs', () => {
  const dg = runMDSLayout('test/data/graphvis/clust.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'clustMDS')
})

xtest('b7 pivot mds', () => {
  const dg = runMDSLayout('test/data/graphvis/b7.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'b7Mds.svg')
})

test('layout 0-50 gv files with MDS', () => {
  const path = 'test/data/graphvis/'
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
      t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

test('layout 50-100 gv files with MDS', () => {
  const path = 'test/data/graphvis/'
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
      t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

xtest('layout 100-150 gv files with MDS', () => {
  const path = 'test/data/graphvis/'
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
      t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

xtest('layout 150-200 gv files with MDS', () => {
  const path = 'test/data/graphvis/'
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
        t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
      }
    } catch (Error) {
      console.log(f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
  }
})

xtest('layout 200-250 gv files with MDS', () => {
  const path = 'test/data/graphvis/'
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
      t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
  }
})

test('layout from 250 and up  gv files with MDS', () => {
  expect(3).toBe(3)
  // const path = 'test/data/graphvis/'
  // let i = 0
  // for (const f of sortedList) {
  //   if (f.match('big(.*).gv')) continue // the parser bug
  //   if (i++ < 250) continue
  //   let dg: DrawingGraph
  //   try {
  //     dg = runMDSLayout(join(path, f))
  //   } catch (Error) {
  //     console.log(f + ' error:' + Error.message)
  //     expect(1).toBe(0)
  //   }
  //   if (dg != null) {
  //     const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + '_pivot.svg')
  //     t.writeGeomGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
  //   }
  // }
})
