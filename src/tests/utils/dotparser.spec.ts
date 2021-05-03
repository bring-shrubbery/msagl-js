import {parseDotGraph} from '../../tools/dotparser'
import {Graph} from './../../layoutPlatform/structs/graph'
import {Node} from './../../layoutPlatform/structs/node'

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

function isGraph(n: Node) {
  return n.hasOwnProperty('isCollapsed')
}

test('inh', () => {
  const b = new B()
  expect(foo(b)).toBe('BBB')
  const c = new Graph()
  expect(isGraph(c)).toBe(true)
})

test('dot parser', () => {
  const g = parseDotGraph('src/tests/data/graphvis/clust4.gv')
  expect(g == null).toBe(false)
})
