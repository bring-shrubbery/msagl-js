import {Graph, Node, Size} from 'msagl-js'
import {DrawingGraph, parseDotString} from 'msagl-js/drawing'
export async function loadDefaultGraph(): Promise<Graph> {
  const resp = await fetch(
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
  return g
}

export function measureTextSize(str: string): Size {
  return new Size(str.length * 8 + 8, 20)
}
export async function loadDotFile(file: File): Promise<DrawingGraph> {
  const content = await file.text()
  const dg = parseDotString(content)
  dg.createGeometry(measureTextSize)
  return dg
}
