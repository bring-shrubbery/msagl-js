import parseDot from 'dotparser'
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

export async function loadDotFile(file: File): Promise<Graph> {
  const content = await file.text()
  const ast = parseDot(content)
  const g = new Graph(file.name)
  const children = ast[0].children

  // Add nodes first, then edges
  children.sort((s1, s2) => (s1.type < s2.type ? 1 : -1))

  for (const stmt of children) {
    switch (stmt.type) {
      case 'node_stmt':
        g.addNode(new Node(stmt.node_id.id.toString()))
        break
      case 'edge_stmt':
        g.setEdge(
          stmt.edge_list[0].id.toString(),
          stmt.edge_list[1].id.toString(),
        )
        break
      default:
    }
  }
  return g
}
