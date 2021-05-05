import {Color} from '../../drawing/color'
import {DrawingNode} from '../../drawing/drawingNode'
import {parseDotGraph, parseDotString} from '../../tools/dotparser'
import {readdir} from 'fs'
import {join} from 'path'

test('all gv files', () => {
  const path = 'src/tests/data/graphvis/'
  readdir(path, (err, files) => {
    expect(err).toBe(null)
    for (const f of files) {
      if (f.match('(.*).gv')) {
        const g = parseDotGraph(join(path, f))
        expect(g != null).toBe(true)
      } else {
        expect(1).toBe(0)
      }
    }
  })
  expect(1).toBe(0)
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
