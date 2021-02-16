import parse = require('dotparser')
import {readFileSync} from 'fs'
import {Edge} from '../structs/edge'
import {Graph} from '../structs/graph'
import {Node} from '../structs/node'

function parseEdge(s: string, t: string, graph: Graph) {
  let sn: Node
  const nc = graph.nodeCollection
  if (!nc.hasNode(s)) {
    nc.addNode((sn = new Node(s)))
  } else {
    sn = nc.getNode(s)
  }
  let tn: Node
  if (!nc.hasNode(t)) {
    nc.addNode((tn = new Node(t)))
  } else {
    tn = nc.getNode(t)
  }
  nc.addEdge(new Edge(sn, tn))
}

function parseGraph(o: any, graph: Graph) {
  parseUnderGraph(o.children, graph)
}

function parseNode(o: any, graph: Graph) {
  const node = new Node(o.id)
  graph.nodeCollection.addNode(node)
}
function parseUnderGraph(children: any, graph: Graph) {
  //console.log(ast)
  for (const o of children) {
    switch (o.type) {
      case 'node_stmt':
        parseNode(o, graph)
        break
      case 'edge_stmt':
        const edgeList: any[] = o.edge_list
        for (let i = 0; i < edgeList.length - 1; i++)
          parseEdge(edgeList[i], edgeList[i + 1], graph)
        break
      case 'subgraph':
        const subg = Graph.mkGraph(o.id)
        graph.nodeCollection.addNode(subg)
        parseGraph(o, subg)
    }
  }
}

export function parseDotGraph(fileName: string): Graph {
  const ast = parse(readFileSync(fileName, 'utf-8'))
  if (ast == null) return null
  const graph = new Graph()
  parseUnderGraph(ast[0].children, graph)
  return graph
}
