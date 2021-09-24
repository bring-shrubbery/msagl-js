import {StringBuilder} from 'typescript-string-operations'
import {
  ICurve,
  Rectangle,
  GeomGraph,
  GeomNode,
  GeomEdge,
  GeomLabel,
  Graph,
  CurveFactory,
  Point,
  layoutGraph,
  MdsLayoutSettings,
} from '../../../..'
import {EdgeRoutingMode} from '../../../../layoutPlatform/core/routing/EdgeRoutingMode'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {Assert} from '../../../../layoutPlatform/utils/assert'
import {parseDotGraph} from '../../../../tools/dotparser'
import {edgeString} from './layeredLayout.spec'

export function runMDSLayout(
  fname: string,
  edgeRoutingMode = EdgeRoutingMode.StraightLine,
) {
  const dg = parseDotGraph(fname)
  if (dg == null) return null
  const gg = createGeometry(dg.graph, nodeBoundaryFunc, labelRectFunc)
  const settings = new MdsLayoutSettings()
  settings.edgeRoutingMode = edgeRoutingMode
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
  t.writeGraph(g)
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
      const subG = (n as unknown) as Graph
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
      Assert.assert(e.label != null)
      ge.label = new GeomLabel(labelRect(e.label.text), e.label)
    }
  }
  return new GeomGraph(g, nodeBoundaryFunc(g.id).boundingBox)
}
