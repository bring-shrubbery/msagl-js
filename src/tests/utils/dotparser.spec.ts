import {Graph} from './../../structs/graph'
import {parseDotGraph} from './../../utils/dotparser'

test('dot parser', () => {
  console.log('Current directory: ' + process.cwd())
  const g = parseDotGraph('src/tests/data/graphvis/clust4.gv')
  expect(g == null).toBe(false)
})
