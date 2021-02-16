import parse = require('dotparser')
import {readFileSync} from 'fs'
import {Cluster} from '../structs/cluster'
import {Edge} from '../structs/edge'
import {Graph, IHasClusters} from '../structs/graph'
import {Node} from '../structs/node'

import {NodeCollection} from '../structs/nodeCollection'
function parseEdge(s: string, t: string, nc: NodeCollection) {
  let sn: Node
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

function parseCluster(o: any, cluster: Cluster) {
  parseDotGraphOnNodeCollection(o.children, cluster.nodeCollection, cluster)
}

function parseDotGraphOnNodeCollection(
  children: any,
  nc: NodeCollection,
  graph: IHasClusters,
) {
  //console.log(ast)
  for (const o of children) {
    switch (o.type) {
      case 'node_stmt':
        console.log('node')
        break
      case 'edge_stmt':
        const edgeList: any[] = o.edge_list
        for (let i = 0; i < edgeList.length - 1; i++)
          parseEdge(edgeList[i], edgeList[i + 1], nc)
        console.log('edge')
        break
      case 'subgraph':
        const cl = new Cluster(o.id)
        graph.clusters.push(cl)
        parseCluster(o, cl)
    }
  }
}

export function parseDotGraph(fileName: string): Graph {
  const ast = parse(readFileSync(fileName, 'utf-8'))
  if (ast == null) return null
  const graph = new Graph()
  parseDotGraphOnNodeCollection(ast[0].children, graph.nodeCollection, graph)
  return graph
}
