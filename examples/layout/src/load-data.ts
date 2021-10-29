import {getGeojsonFeatures} from '@deck.gl/layers/geojson-layer/geojson'
import {
  GeomGraph,
  Graph,
  Size,
  layoutGraph,
  SugiyamaLayoutSettings,
  MdsLayoutSettings,
} from 'msagl-js'
import {DrawingGraph, parseDotString} from 'msagl-js/drawing'
import {getDefaultCompilerOptions} from 'typescript'
const abstract_gv =
  'digraph abstract {\n' +
  '	size="6,6";\n' +
  '  S24 -> 27;\n' +
  '  S24 -> 25;\n' +
  '  S1 -> 10;\n' +
  '  S1 -> 2;\n' +
  '  S35 -> 36;\n' +
  '  S35 -> 43;\n' +
  '  S30 -> 31;\n' +
  '  S30 -> 33;\n' +
  '  9 -> 42;\n' +
  '  9 -> T1;\n' +
  '  25 -> T1;\n' +
  '  25 -> 26;\n' +
  '  27 -> T24;\n' +
  '  2 -> 3;\n' +
  '  2 -> 16;\n' +
  '  2 -> 17;\n' +
  '  2 -> T1;\n' +
  '  2 -> 18;\n' +
  '  10 -> 11;\n' +
  '  10 -> 14;\n' +
  '  10 -> T1;\n' +
  '  10 -> 13;\n' +
  '  10 -> 12;\n' +
  '  31 -> T1;\n' +
  '  31 -> 32;\n' +
  '  33 -> T30;\n' +
  '  33 -> 34;\n' +
  '  42 -> 4;\n' +
  '  26 -> 4;\n' +
  '  3 -> 4;\n' +
  '  16 -> 15;\n' +
  '  17 -> 19;\n' +
  '  18 -> 29;\n' +
  '  11 -> 4;\n' +
  '  14 -> 15;\n' +
  '  37 -> 39;\n' +
  '  37 -> 41;\n' +
  '  37 -> 38;\n' +
  '  37 -> 40;\n' +
  '  13 -> 19;\n' +
  '  12 -> 29;\n' +
  '  43 -> 38;\n' +
  '  43 -> 40;\n' +
  '  36 -> 19;\n' +
  '  32 -> 23;\n' +
  '  34 -> 29;\n' +
  '  39 -> 15;\n' +
  '  41 -> 29;\n' +
  '  38 -> 4;\n' +
  '  40 -> 19;\n' +
  '  4 -> 5;\n' +
  '  19 -> 21;\n' +
  '  19 -> 20;\n' +
  '  19 -> 28;\n' +
  '  5 -> 6;\n' +
  '  5 -> T35;\n' +
  '  5 -> 23;\n' +
  '  21 -> 22;\n' +
  '  20 -> 15;\n' +
  '  28 -> 29;\n' +
  '  6 -> 7;\n' +
  '  15 -> T1;\n' +
  '  22 -> 23;\n' +
  '  22 -> T35;\n' +
  '  29 -> T30;\n' +
  '  7 -> T8;\n' +
  '  23 -> T24;\n' +
  '  23 -> T1;\n' +
  '  }\n'
export async function loadDefaultGraph(): Promise<Graph> {
  /*const resp = await fetch(
    'https://gist.githubusercontent.com/mohdsanadzakirizvi/6fc325042ce110e1afc1a7124d087130/raw/ab9a310cfc2003f26131a7149950947645391e28/got_social_graph.json',
  )
  const data = await resp.json()
  const g = new Graph('got_social_graph.json')

  const nodeMap: any = {}
  for (const node of data.nodes) {
    nodeMap[node.id] = node
    g.addNode(new Node(node.character))
  }
  for (const edge of data.links) {
    g.setEdge(nodeMap[edge.source].character, nodeMap[edge.target].character)
  }
  return g*/
  const dg = parseDotString(abstract_gv)
  layoutDrawingGraph(dg)
  dg.graph.id = 'default graph'
  return dg.graph
}

export function measureTextSize(str: string): Size {
  return new Size(str.length * 8 + 8, 20)
}

export async function loadDotFile(file: File): Promise<DrawingGraph> {
  const content = await file.text()
  const dg = parseDotString(content)
  layoutDrawingGraph(dg)
  dg.graph.id = file.name
  return dg
}

function layoutDrawingGraph(dg: DrawingGraph): void {
  dg.createGeometry(measureTextSize)
  layoutGeomGraph(<GeomGraph>GeomGraph.getGeom(dg.graph), dg.hasDirectedEdge())
}

export function layoutGeomGraph(geomGraph: GeomGraph, directed: boolean) {
  if (directed) {
    layoutGraph(geomGraph, null, () => new SugiyamaLayoutSettings())
  } else {
    layoutGraph(geomGraph, null, () => new MdsLayoutSettings())
  }
}
