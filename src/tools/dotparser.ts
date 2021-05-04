import parse = require('dotparser')
import {readFileSync} from 'fs'
import {Color} from '../drawing/color'
import {DrawingGraph} from '../drawing/DrawingGraph'
import {DrawingNode, NodeAttr} from '../drawing/drawingNode'
import {Edge} from '../layoutPlatform/structs/edge'
import {Graph} from '../layoutPlatform/structs/graph'
import {Node} from '../layoutPlatform/structs/node'

import colorParser = require('parse-color')

function parseEdge(s: string, t: string, dg: DrawingGraph) {
  let sn: Node
  const nc = dg.graph.nodeCollection
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

function parseGraph(o: any, dg: DrawingGraph) {
  parseUnderGraph(o.children, dg)
}

function parseNode(o: any, dg: DrawingGraph) {
  const node = new Node(o.node_id.id)
  dg.graph.nodeCollection.addNode(node)
  const drawingNode = new DrawingNode(node)
  for (const attr of o.attr_list) {
    if (attr.type == 'attr') {
      switch (attr.id) {
        case 'color':
          drawingNode.color = parseColor(attr.eq)
          break
        case 'fontcolor':
          drawingNode.label.fontColor = parseColor(attr.eq)
          break
        case 'fillcolor':
          drawingNode.attr.fillColor = parseColor(attr.eq)
          break
      }
    } else {
      throw new Error('unexpected type ' + attr.type)
    }
  }
}
function parseUnderGraph(children: any, dg: DrawingGraph) {
  for (const o of children) {
    switch (o.type) {
      case 'node_stmt':
        parseNode(o, dg)
        break
      case 'edge_stmt':
        const edgeList: any[] = o.edge_list
        for (let i = 0; i < edgeList.length - 1; i++)
          parseEdge(edgeList[i].id, edgeList[i + 1].id, dg)
        break
      case 'subgraph':
        // is it really a subgraph?
        if (!process_same_rank(o, dg)) {
          const subg = Graph.mkGraph(o.id)
          dg.graph.nodeCollection.addNode(subg)
          const sdg = new DrawingGraph(subg)
          parseGraph(o, sdg)
        }
      case 'attr_stmt':
        parseGraphAttr(o, dg)
        break
      default:
        throw new Error('not implemented')
    }
  }
}

export function parseDotString(graphStr: string): DrawingGraph {
  const ast = parse(graphStr)
  if (ast == null) return null
  const graph = new Graph()
  const drawingGraph = new DrawingGraph(graph)
  parseUnderGraph(ast[0].children, drawingGraph)
  return drawingGraph
}
export function parseDotGraph(fileName: string): DrawingGraph {
  const graphStr = readFileSync(fileName, 'utf-8')
  return parseDotString(graphStr)
}

function process_same_rank(o: any, dg: DrawingGraph): boolean {
  const attr = o.children[0]
  if (attr == undefined) return false
  if (attr.type != 'attr_stmt') return false
  const attr_list = attr.attr_list
  if (attr_list == undefined) return false
  if (attr_list.length == 0) return false
  const attr_0 = attr_list[0]
  if (attr_0.type != 'attr') return false
  if (attr_0.id != 'rank') return false
  if (attr_0.eq != 'same') {
    throw new Error('not implemented')
  }

  const sameRankIds = []
  for (let i = 1; i < o.children.length; i++) {
    const e = o.children[i]
    sameRankIds.push(e.id)
  }
  dg.graphVisData.sameRanks.push(sameRankIds)

  return true
}
function parseColor(s: string): Color {
  const p = colorParser(s)
  if (p.rgba != null) {
    return new Color(p[3] * 255, p[0], p[1], p[2])
  }
  return Color.mkRGB(p[0], p[1], p[2])
}
function parseGraphAttr(o: any, dg: DrawingGraph) {
  if (dg.defaultNodeAttr == null) dg.defaultNodeAttr = new NodeAttr()
  parseNodeAttr(o, dg.defaultNodeAttr)
}
function parseNodeAttr(o: any, defaultNodeAttr: NodeAttr) {
  throw new Error('Function not implemented.')
}
