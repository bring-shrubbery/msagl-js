import {
  GeomGraph,
  Rectangle,
  SugiyamaLayoutSettings,
  layoutGraphWithSugiayma,
} from '../../src'
import {SplineRouter} from '../../src/routing/splineRouter'
import {SvgDebugWriter} from '../utils/svgDebugWriter'
import {setNode} from '../utils/testUtils'

test('spline router self edge', () => {
  const g = GeomGraph.mk('graph', Rectangle.mkEmpty())
  setNode(g, 'a', 10, 10)
  g.setEdge('a', 'a')
  g.layoutSettings = new SugiyamaLayoutSettings()
  layoutGraphWithSugiayma(g, null) // null for the CancelToken that is ignored at the moment
  for (const e of g.edges()) {
    expect(e.curve == null).toBe(false)
  }
  const sr = new SplineRouter(g, 2, 4, Math.PI / 6)
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/self.svg')
  t.writeGeomGraph(g)
})
