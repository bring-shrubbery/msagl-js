import {Color} from '../drawing/color'

import {parseDotGraph, parseDotString} from './dotparser'
import {join} from 'path'
import {sortedList} from '../data/sortedBySizeListOfgvFiles'
import {DrawingNode} from '../drawing/drawingNode'

test('all gv files list ', () => {
  const path = 'test/data/graphvis/'
  for (const f of sortedList) {
    try {
      parseDotGraph(join(path, f))
    } catch (Error) {
      console.log('Cannot parse file = ' + f + ' error:' + Error.message)
    }
  }
})

test('pack gv', () => {
  const g = parseDotGraph('test/data/graphvis/pack.gv')
  expect(g == null).toBe(false)
})

xtest('dot parser', () => {
  const g = parseDotGraph('test/data/graphvis/clust4.gv')
  expect(g == null).toBe(false)
})

xtest('parse with colors ', () => {
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
