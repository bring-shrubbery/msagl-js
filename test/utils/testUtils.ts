import {from} from 'linq-to-typescript'
import * as fs from 'fs'
import {StringBuilder} from 'typescript-string-operations'
import {
  GeomEdge,
  Point,
  interpolateICurve,
  MdsLayoutSettings,
  layoutGraph,
  GeomGraph,
  ICurve,
  CurveFactory,
  Rectangle,
  GeomNode,
  GeomLabel,
  Graph,
  Size,
  Node,
} from '../../src'
import {SvgDebugWriter} from './svgDebugWriter'
import {EdgeRoutingMode} from '../../src/routing/EdgeRoutingMode'
import {parseDotString} from '../../src/drawing/dotparser'
import {DrawingGraph} from '../../src/drawing'
import {layoutGraphGraphWithMds} from '../../src/layout/mds/PivotMDS'
import {DrawingObject} from '../../src/drawing/drawingObject'
import {measureTextSize} from '../drawing/drawingGraph.spec'
export function edgeString(e: GeomEdge, edgesAsArrays: boolean): string {
  const s = e.source.id + '->' + e.target.id
  return (
    s +
    ', curve(' +
    (edgesAsArrays
      ? interpolateEdgeAsString()
      : SvgDebugWriter.curveString(e.curve)) +
    ')'
  )
  function interpolateEdgeAsString(): string {
    const ps = interpolateEdge(e)
    let s = '[' + ps[0].toString()
    for (let i = 1; i < ps.length; i++) {
      s += ' ' + ps[i].toString()
    }
    return s + ']'
  }
}

function interpolateEdge(edge: GeomEdge): Point[] {
  if (edge.edgeGeometry == null) return []
  let ret = new Array<Point>()
  if (edge.edgeGeometry.sourceArrowhead != null)
    ret = ret.concat(
      addArrow(
        edge.curve.start,
        edge.edgeGeometry.sourceArrowhead.tipPosition,
        25,
      ),
    )
  ret = ret.concat(interpolateICurve(edge.curve, 1))
  if (edge.edgeGeometry.targetArrowhead != null) {
    ret = ret.concat(
      addArrow(
        edge.curve.end,
        edge.edgeGeometry.targetArrowhead.tipPosition,
        25,
      ),
    )
  }
  return ret
}
function addArrow(start: Point, end: Point, arrowAngle: number): Point[] {
  let dir = end.sub(start)
  const l = dir.length
  dir = dir.div(l).rotate90Ccw()
  dir = dir.mul(l * Math.tan(arrowAngle * 0.5 * (Math.PI / 180.0)))
  return [start, start.add(dir), end, start.sub(dir), start]
}

export function runMDSLayout(
  fname: string,
  edgeRoutingMode = EdgeRoutingMode.StraightLine,
) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const settings = new MdsLayoutSettings()
  settings.edgeRoutingSettings.edgeRoutingMode = edgeRoutingMode
  gg.layoutSettings = settings
  layoutGraphGraphWithMds(gg, null)
  return dg
}

export function runMDSLayoutNoSubgraphs(
  fname: string,
  edgeRoutingMode: EdgeRoutingMode,
) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  if (from(dg.graph.subgraphs()).any()) return null

  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const settings = new MdsLayoutSettings()
  settings.edgeRoutingSettings.edgeRoutingMode = edgeRoutingMode
  gg.layoutSettings = settings
  layoutGraphGraphWithMds(gg, null)
  return dg
}

export function outputGraph(g: GeomGraph, name: string) {
  const strB = new StringBuilder()
  for (const n of g.shallowNodes()) {
    const s = n.id + ', center = ' + n.center
    strB.AppendLine(s)
  }
  strB.AppendLine('edges')
  for (const e of g.edges()) {
    strB.AppendLine(edgeString(e, true)) // true to get an array of poins
  }

  //  console.log(strB.ToString())
  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + name + '.svg')
  t.writeGeomGraph(g)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function nodeBoundaryFunc(label: string): ICurve {
  const size = measureTextSize(label)
  return CurveFactory.mkRectangleWithRoundedCorners(
    size.width,
    size.height,
    size.width / 10,
    size.height / 10,
    new Point(0, 0),
  )
}

export function parseDotGraph(fileName: string): DrawingGraph {
  try {
    const graphStr = fs.readFileSync(fileName, 'utf-8')
    return parseDotString(graphStr)
  } catch (Error) {
    // console.log('file = ' + fileName + ' error:' + Error.message)
    return null
  }
}
export function labelRectFunc(text: string): Rectangle {
  return Rectangle.mkPP(new Point(0, 0), new Point(text.length * 10, 10.5))
}

function measureTextSizeOfNode(n: Node): Size {
  const drawingObject = DrawingObject.getDrawingObj(n)

  const labelText = drawingObject ? drawingObject.labelText ?? n.id : n.id

  return measureTextSize(labelText)
}

export function createGeometry(
  g: Graph,
  nodeBoundaryFunc: (s: string) => ICurve,
  labelRect: (s: string) => Rectangle,
): GeomGraph {
  for (const n of g.shallowNodes) {
    if (n.isGraph) {
      const subG = n as unknown as Graph
      GeomGraph.mkWithGraphAndLabel(subG, measureTextSizeOfNode(subG))
      createGeometry(subG, nodeBoundaryFunc, labelRect)
    } else {
      const gn = new GeomNode(n)
      //const tsize = getTextSize(drawingNode.label.text, drawingNode.fontname)
      const drawingObject = DrawingObject.getDrawingObj(n)
      const text = drawingObject ? drawingObject.labelText ?? n.id : n.id
      gn.boundaryCurve = nodeBoundaryFunc(text)
    }
  }
  for (const e of g.edges) {
    const ge = new GeomEdge(e)
    if (e.label) {
      /*Assert.assert(e.label != null)*/
      ge.label = new GeomLabel(labelRect(e.label.text), e.label)
    }
  }
  return GeomGraph.mkWithGraphAndLabel(g, measureTextSizeOfNode(g))
}
