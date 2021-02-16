import parse = require('dotparser')
import {readFileSync} from 'fs'
import {Graph} from '../structs/graph'

function parseEdge(s: any, t: any, g: Graph) {}

export function parseDotGraph(fileName: string): Graph {
  const ast = parse(readFileSync(fileName, 'utf-8'))
  if (ast == null) return null
  const graph = new Graph()
  //console.log(ast)
  const children = ast[0].children
  for (const o of children) {
    switch (o.type) {
      case 'node_stmt':
        console.log('node')
        break
      case 'edge_stmt':
        const edgeList: any[] = o.edge_list
        for (let i = 0; i < edgeList.length - 1; i++)
          parseEdge(edgeList[i], edgeList[i + 1], graph)
        console.log('edge')
        break
    }
  }
  return graph
}
