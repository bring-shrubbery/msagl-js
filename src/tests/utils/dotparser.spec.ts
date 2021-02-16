import {Graph} from './../../structs/graph'
import {Node} from './../../structs/node'
import {Cluster} from './../../structs/cluster'

import {parseDotGraph} from './../../utils/dotparser'

class A {
  get prop() {
    return 'aaa'
  }
}

class B extends A {
  get prop() {
    return 'BBB'
  }
}

function foo(a: A) {
  return a.prop
}

function isCluster(n: Node) {
  return n.hasOwnProperty('isCollapsed')
}

test('inh', () => {
  const b = new B()
  expect(foo(b)).toBe('BBB')
  const c = new Cluster('t')
  expect(isCluster(c)).toBe(true)
})

test('dot parser', () => {
  console.log('Current directory: ' + process.cwd())
  const g = parseDotGraph('src/tests/data/graphvis/clust4.gv')
  expect(g == null).toBe(false)
})
