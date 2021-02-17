import {parseDotGraph} from './../../../utils/dotparser'
import {SugiyamaLayoutSettings} from './../../../layout/layered/SugiyamaLayoutSettings'
import {LayeredLayout} from '../../../layout/layered/layeredLayout'
test('layered layout hookup', () => {
  const g = parseDotGraph('src/tests/data/graphvis/clust4.gv')
  const ll = new LayeredLayout(g, new SugiyamaLayoutSettings())
  ll.run()
})
