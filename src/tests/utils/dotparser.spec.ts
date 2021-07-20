import {Color} from '../../drawing/color'
import {DrawingNode} from '../../drawing/drawingNode'
import {parseDotGraph, parseDotString} from '../../tools/dotparser'
import {join} from 'path'
import fs = require('fs')
import {sortedList} from '../layoutPlatform/layout/sortedBySizeListOfgvFiles'
test('all gv files list ', () => {
  const path = 'src/tests/data/graphvis/'
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    parseDotGraph(join(path, f))
  }
})
test('all gv files', () => {
  const path = 'src/tests/data/graphvis/'
  fs.readdir(path, (err, files) => {
    expect(err).toBe(null)
    for (const f of files) {
      if (!f.match('(.*).gv')) continue
      if (f.match('big.gv')) continue

      const g = parseDotGraph(join(path, f))
      expect(g != null).toBe(true)
    }
  })
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
