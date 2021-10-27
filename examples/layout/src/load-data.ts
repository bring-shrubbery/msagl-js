import parseDot from 'dotparser'
import {DrawingGraph, parseDotString} from 'drawing-msagl-js'
import {Graph, Node} from 'msagl-js'

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

export async function loadDotFile(file: File): Promise<DrawingGraph> {
  const content = await file.text()
  const ret = parseDotString(content)
  ret.graph.id = file.name
  return ret
}
