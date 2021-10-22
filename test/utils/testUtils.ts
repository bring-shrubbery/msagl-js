import {from} from 'linq-to-typescript'
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
} from '@/src'
import {EdgeRoutingMode} from '@/src/routing/EdgeRoutingMode'
import {SvgDebugWriter} from './svgDebugWriter'
import {parseDotGraph} from '@/src/utils/dotparser'
// import {Assert} from '@/src/utils/assert'
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
  layoutGraph(gg, null, () => settings)
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
  layoutGraph(gg, null, () => settings)
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
export function nodeBoundaryFunc(id: string): ICurve {
  return CurveFactory.mkRectangleWithRoundedCorners(
    40.1, // tsize.width,
    30.2, // tsize.height,
    40.1 / 10, // tsize.width / 10,
    30.2 / 10, // tsize.height / 10,
    new Point(0, 0),
  )
}
export function labelRectFunc(text: string): Rectangle {
  return Rectangle.mkPP(new Point(0, 0), new Point(text.length * 10, 10.5))
}

export function createGeometry(
  g: Graph,
  nodeBoundaryFunc: (s: string) => ICurve,
  labelRect: (s: string) => Rectangle,
): GeomGraph {
  for (const n of g.shallowNodes) {
    if (n.isGraph) {
      const subG = n as unknown as Graph
      new GeomGraph(subG, nodeBoundaryFunc(n.id).boundingBox.size)
      createGeometry(subG, nodeBoundaryFunc, labelRect)
    } else {
      const gn = new GeomNode(n)
      //const tsize = getTextSize(drawingNode.label.text, drawingNode.fontname)
      gn.boundaryCurve = nodeBoundaryFunc(n.id)
    }
  }
  for (const e of g.edges) {
    const ge = new GeomEdge(e)
    if (e.label) {
      /*Assert.assert(e.label != null)*/
      ge.label = new GeomLabel(labelRect(e.label.text), e.label)
    }
  }
  return new GeomGraph(g, nodeBoundaryFunc(g.id).boundingBox)
}
