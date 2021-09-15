import {join} from 'path'
import {GeomGraph} from '../../../..'
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {EdgeRoutingMode} from '../../../../layoutPlatform/core/routing/EdgeRoutingMode'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {runMDSLayout} from '../../layout/mds/PivotMDS.spec'
import {sortedList} from '../../layout/sortedBySizeListOfgvFiles'

test('first 50 dot files', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i > 50) return
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f), EdgeRoutingMode.Rectilinear)
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
