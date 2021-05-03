import {Color} from '../../drawing/color'
import {DrawingNode} from '../../drawing/drawingNode'
import {parseDotGraph, parseDotString} from '../../tools/dotparser'
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

test('parse with colors ', () => {
  const dotString =
    'digraph G {\n' +
    'node [style=filled, shape=box]\n' +
    'ddddddd [fontcolor=yellow, fillcolor=blue, color=orange]\n' +
    'subgraph clusterA {\n' +
    '  style=filled\n' +
    '  fillcolor=lightgray\n' +
    'pencolor=blue\n' +
    'eeeee [peripheries=3, fontcolor=red, color=yellow]\n' +
    'eeeee -> ee\n' +
    '}\n' +
    'ddddddd -> eeeee [labelfontcolor=chocolate, headlabel=headlabel, label=flue, fontcolor=green, color=lightblue]\n' +
    '}'
  const drawingGraph = parseDotString(dotString)
  expect(drawingGraph != null).toBe(true)
  const ddNode: DrawingNode = drawingGraph.findNode('ddddddd')
  expect(ddNode != null).toBe(true)
  expect(ddNode.node.id).toBe('ddddddd')
  expect(Color.equal(ddNode.color, Color.Orange)).toBe(true)
})
