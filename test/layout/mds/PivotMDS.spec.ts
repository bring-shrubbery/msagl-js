import {GeomGraph} from '../../../src'
import {GeomObject} from '../../../src/layout/core/geomObject'
import {SvgDebugWriter} from '../../utils/svgDebugWriter'
import {runMDSLayout, outputGraph} from '../../utils/testUtils'
import {sortedList} from '../sortedBySizeListOfgvFiles'
import {join} from 'path'
import {DrawingGraph} from '../../../src/drawing'
test('graph with subgraphs', () => {
  const dg = runMDSLayout('test/data/graphvis/clust.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'clustMDS')
})

test('compound', () => {
  const dg = runMDSLayout('test/data/graphvis/compound.gv')
  outputGraph(<GeomGraph>GeomObject.getGeom(dg.graph), 'compound.pivot.svg')
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

test('layout 100-150 gv files with MDS', () => {
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

xtest('layout from 250 and up  gv files with MDS', () => {
  expect(3).toBe(3)
  // const path = 'test/data/graphvis/'
  // let i = 0
  // for (const f of sortedList) {
  //   if (f.match('big(.*).gv')) continue // the parser bug
  //   if (i++ < 250) continueP
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
