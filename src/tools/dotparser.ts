import parse = require('dotparser')
import {readFileSync} from 'fs'
import {Color} from '../drawing/color'
import {DrawingGraph} from '../drawing/drawingGraph'
import {DrawingNode} from '../drawing/drawingNode'
import {Edge} from '../layoutPlatform/structs/edge'
import {Graph} from '../layoutPlatform/structs/graph'
import {Node} from '../layoutPlatform/structs/node'

import colorParser = require('parse-color')
import {StyleEnum} from '../drawing/styleEnum'
import {ShapeEnum} from '../drawing/shapeEnum'
import {DrawingObject} from '../drawing/drawingObject'
import {DrawingEdge} from '../drawing/drawingEdge'
import {ArrowTypeEnum} from '../drawing/arrawTypeEnum'
import {RankDirEnum} from '../drawing/rankDirEnum'
import {RankEnum} from '../drawing/rankEnum'

export enum OrderingEnum {
  in,
  out,
}

export enum DirTypeEnum {
  forward,

  back,

  both,

  none,
}

function parseEdge(s: string, t: string, dg: DrawingGraph, o: any) {
  let sn: Node
  const nc = dg.graph.nodeCollection
  if (!nc.hasNode(s)) {
    nc.addNode((sn = new Node(s)))
    const dn = new DrawingNode(sn)
    dn.labelText = s
  } else {
    sn = nc.getNode(s)
  }
  let tn: Node
  if (!nc.hasNode(t)) {
    nc.addNode((tn = new Node(t)))
    const dn = new DrawingNode(tn)
    dn.labelText = t
  } else {
    tn = nc.getNode(t)
  }
  const geomEdge = new Edge(sn, tn)
  nc.addEdge(geomEdge)
  const drawingEdge = new DrawingEdge(geomEdge)
  fillDrawingObjectAttrs(o, drawingEdge)
}

function parseGraph(o: any, dg: DrawingGraph) {
  parseUnderGraph(o.children, dg)
}

function parseNode(o: any, dg: DrawingGraph) {
  const node = new Node(o.node_id.id)
  dg.graph.nodeCollection.addNode(node)
  const drawingNode = new DrawingNode(node)
  fillDrawingObjectAttrs(o, drawingNode)
}
function fillDrawingObjectAttrs(o: any, drawingObj: DrawingObject) {
  for (const attr of o.attr_list) {
    if (attr.type == 'attr') {
      const str = attr.eq
      switch (attr.id) {
        case 'color':
          drawingObj.color = parseColor(str)
          break
        case 'pencolor':
          drawingObj.pencolor = parseColor(str)
          break
        case 'labelfontcolor':
          drawingObj.labelfontcolor = parseColor(str)
          break
        case 'fontcolor':
          drawingObj.fontColor = parseColor(str)
          break
        case 'fillcolor':
          drawingObj.fillColor = parseColor(str)
          break
        case 'style':
          drawingObj.styleEnum = styleEnumFromString(str)
          break
        case 'shape':
          drawingObj.shapeEnum = shapeEnumFromString(str)
          break
        case 'peripheries':
          drawingObj.peripheries = parseInt(str)
          break
        case 'headlabel':
          drawingObj.headlabel = str
          break
        case 'label':
          drawingObj.labelText = str
          break
        case 'size':
          drawingObj.size = parseSize(str)
          break
        case 'rankdir':
          drawingObj.rankdir = rankDirEnumFromString(str)
          break
        case 'fontname':
          drawingObj.fontname = str
          break
        case 'fontsize':
          drawingObj.fontsize = parseFloat(str)
          break
        case 'width':
          drawingObj.width = parseFloat(str)
          break
        case 'height':
          drawingObj.height = parseFloat(str)
          break
        case 'margin':
          drawingObj.margin = parseFloat(str)
          break
        case 'len':
          drawingObj.len = parseFloat(str)
          break
        case 'minlen':
          drawingObj.minlen = parseFloat(str)
          break
        case 'rank':
          drawingObj.rank = rankEnumFromString(str)
          break
        case 'charset':
          drawingObj.charset = str
          break
        case 'orientation':
          drawingObj.orientation = str
          break
        case 'ratio':
          drawingObj.ratio = str
          break
        case 'weight':
          drawingObj.weight = parseFloat(str)
          break
        case 'ranksep':
          drawingObj.ranksep = parseFloat(str)
          break
        case 'splines':
          drawingObj.splines = str == 'true'
          break
        case 'overlap':
          drawingObj.overlap = str == 'true'
          break
        case 'arrowtail':
          drawingObj.arrowtail = arrowTypeEnumFromString(str)
          break
        case 'taillabel':
          drawingObj.taillabel = str
          break
        case 'arrowhead':
          drawingObj.arrowhead = arrowTypeEnumFromString(str)
          break
        case 'ordering':
          drawingObj.ordering = orderingEnumFromString(str)
          break
        case 'URL':
          drawingObj.URL = str
          break
        case 'dir':
          drawingObj.dir = dirTypeEnumFromString(str)
          break

        default:
          throw new Error('not implemented for ' + attr.id)
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
        {
          const edgeList: any[] = o.edge_list
          for (let i = 0; i < edgeList.length - 1; i++)
            parseEdge(edgeList[i].id, edgeList[i + 1].id, dg, o)
        }
        break
      case 'subgraph':
        // is it really a subgraph?
        if (!process_same_rank(o, dg)) {
          const subg = Graph.mkGraph(o.id)
          dg.graph.nodeCollection.addNode(subg)
          const sdg = new DrawingGraph(subg)
          parseGraph(o, sdg)
        }
        break
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
    return new Color(p.rgba[3] * 255, p.rgba[0], p.rgba[1], p.rgba[2])
  }
  if (p.rdg != null) {
    return Color.mkRGB(p.rgb[0], p.rgb[1], p.rgb[2])
  }
  return Color.Black
}
function parseGraphAttr(o: any, dg: DrawingGraph) {
  if (dg.defaultNode == null && o.target == 'node') {
    dg.defaultNode = new DrawingNode(null)
    fillDrawingObjectAttrs(o, dg.defaultNode)
  } else if (o.target == 'graph') {
    fillDrawingObjectAttrs(o, dg)
  }
}

function styleEnumFromString(t: string): StyleEnum {
  const typedStyleString = t as keyof typeof StyleEnum
  return StyleEnum[typedStyleString]
}
function shapeEnumFromString(t: string): ShapeEnum {
  const typedStyleString = t as keyof typeof ShapeEnum
  return ShapeEnum[typedStyleString]
}
function parseSize(str: string): [number, number] {
  const p = str.split(',')
  return [parseFloat(p[0]), parseFloat(p[1])]
}

function rankDirEnumFromString(t: string): RankDirEnum {
  const typedStyleString = t as keyof typeof RankDirEnum
  return RankDirEnum[typedStyleString]
}
function rankEnumFromString(t: string): RankEnum {
  const typedStyleString = t as keyof typeof RankEnum
  return RankEnum[typedStyleString]
}
function arrowTypeEnumFromString(t: string): ArrowTypeEnum {
  const typedStyleString = t as keyof typeof ArrowTypeEnum
  return ArrowTypeEnum[typedStyleString]
}

function orderingEnumFromString(t: string): OrderingEnum {
  const typedStyleString = t as keyof typeof OrderingEnum
  return OrderingEnum[typedStyleString]
}
function dirTypeEnumFromString(t: string): DirTypeEnum {
  const typedStyleString = t as keyof typeof DirTypeEnum
  return DirTypeEnum[typedStyleString]
}
