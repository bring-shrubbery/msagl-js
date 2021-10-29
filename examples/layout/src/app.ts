import {Graph, GeomGraph} from 'msagl-js'

import {loadDefaultGraph, layoutGeomGraph, loadDotFile} from './load-data'
import {dropZone} from './drag-n-drop'
import Renderer from './renderer'
import {DrawingGraph} from 'msagl-js/dist/drawing'
import {measureTextSize} from './load-data'
const renderer = new Renderer()

// expect g with geometry graph set and laid out here,
// it is GeomGraph.getGeom(g) ready for rendering
function render(g: Graph) {
  document.getElementById('graph-name').innerText = g.id

  console.log(GeomGraph.getGeom(g) as GeomGraph)
  renderer.setGraph(GeomGraph.getGeom(g) as GeomGraph)
}

dropZone('drop-target', async (f: File) => {
  const graph = await loadDotFile(f)
  renderDrawingGraph(graph)
})
;(async () => {
  const g = await loadDefaultGraph()
  render(g)
})()

function renderDrawingGraph(dg: DrawingGraph) {
  dg.createGeometry(measureTextSize)
  layoutGeomGraph(<GeomGraph>GeomGraph.getGeom(dg.graph), dg.hasDirectedEdge())

  renderer.setGraph(GeomGraph.getGeom(dg.graph) as GeomGraph)
}
