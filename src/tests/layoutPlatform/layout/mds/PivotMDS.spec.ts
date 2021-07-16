import {PivotMDS} from '../../../../layoutPlatform/layout/mds/PivotMDS'
import {parseDotGraph} from '../../../../tools/dotparser'
import {
  createGeometry,
  nodeBoundaryFunc,
  labelRectFunc,
  outputGraph,
} from '../layered/layeredLayout.spec'

test('graph with subgraphs', () => {
  const dg = parseDotGraph('src/tests/data/graphvis/clust.gv')
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const layout = new PivotMDS(gg, null, () => 1)
  layout.run()
  outputGraph(gg, 'clustMDS')
})
