import {parseDotGraph} from './../../../utils/dotparser'
import {SugiyamaLayoutSettings} from './../../../layout/layered/SugiyamaLayoutSettings'

import {LayeredLayout} from '../../../layout/layered/layeredLayout'
import {Graph} from '../../../structs/graph'
import {GeomNode} from '../../../layout/core/geomNode'
import {GeomEdge} from '../../../layout/core/geomEdge'
function createGeometry(g: Graph) {
  for (const n of g.nodes) {
    new GeomNode(n)
  }
  for (const e of g.edges) {
    new GeomEdge(e)
  }
}

test('layered layout hookup', () => {
  const g = parseDotGraph('src/tests/data/graphvis/abstract.gv')
  createGeometry(g)
  const ll = new LayeredLayout(g, new SugiyamaLayoutSettings())
  ll.run()
})
