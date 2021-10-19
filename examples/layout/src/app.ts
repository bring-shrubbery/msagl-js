import {
  GeomGraph,
  SugiyamaLayoutSettings,
  LayeredLayout,
  CancelToken,
  Node,
  GeomNode,
  CurveFactory,
  Point,
  Size,
  MdsLayoutSettings,
  layoutGraph,
} from 'msagl-js'

import Renderer from './renderer'

function measureTextSize(str: string): {width: number; height: number} {
  return {width: str.length * 8 + 8, height: 20}
}

function setNode(
  g: GeomGraph,
  id: string,
  size: {width: number; height: number},
): GeomNode {
  let node = g.graph.findNode(id)
  if (node == null) {
    g.graph.addNode((node = new Node(id)))
  }
  const geomNode = new GeomNode(node)
  geomNode.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
    size.width,
    size.height,
    1,
    1,
    new Point(0, 0),
  )
  return geomNode
}

async function main() {
  const resp = await fetch(
    'https://gist.githubusercontent.com/mohdsanadzakirizvi/6fc325042ce110e1afc1a7124d087130/raw/ab9a310cfc2003f26131a7149950947645391e28/got_social_graph.json',
  )
  const data = await resp.json()

  const nodeMap: any = {}
  const g = GeomGraph.mk('graph', new Size(0, 0))
  for (const node of data.nodes) {
    nodeMap[node.id] = node
    const wh = measureTextSize(node.character)
    setNode(g, node.character, wh)
  }
  for (const edge of data.links) {
    const e = g.setEdge(
      nodeMap[edge.source].character,
      nodeMap[edge.target].character,
    )
    e.edgeGeometry.targetArrowhead = null
  }

  const layoutSettings = new MdsLayoutSettings()
  layoutGraph(g, null, () => layoutSettings)
  new Renderer(g)
}

main()
