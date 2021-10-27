import {
  Graph,
  GeomGraph,
  GeomNode,
  GeomEdge,
  CurveFactory,
  Point,
  Size,
  MdsLayoutSettings,
  layoutGraph,
} from 'msagl-js'
import {parseDotString} from 'drawing-msagl-js'
import {loadDefaultGraph, loadDotFile} from './load-data'
import {dropZone} from './drag-n-drop'
import Renderer from './renderer'

const renderer = new Renderer()

function measureTextSize(str: string): {width: number; height: number} {
  return {width: str.length * 8 + 8, height: 20}
}

function render(g: Graph) {
  document.getElementById('graph-name').innerText = g.id

  const gg = new GeomGraph(g, new Size(0, 0))

  for (const node of g.shallowNodes) {
    const wh = measureTextSize(node.id)
    const geomNode = new GeomNode(node)
    geomNode.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
      wh.width,
      wh.height,
      1,
      1,
      new Point(0, 0),
    )
  }
  for (const edge of g.edges) {
    new GeomEdge(edge)
  }

  const layoutSettings = new MdsLayoutSettings()
  layoutGraph(gg, null, () => layoutSettings)
  renderer.setGraph(gg)
}

dropZone('drop-target', async (f: File) => {
  const graph = await loadDotFile(f)
  render(graph)
})
;(async () => {
  const g = await loadDefaultGraph()
  render(g)
})()
