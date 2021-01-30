import {Node} from './../../../structs/node'
import {Edge} from './../../../structs/edge'
import {GeomNode} from './../../../layout/core/geomNode'
import {GeomEdge} from './../../../layout/core/geomEdge'
import {Arrowhead} from './../../../layout/core/arrowhead'
import {CurveFactory} from './../../../math/geometry/curveFactory'
import {Point} from './../../../math/geometry/point'
import {LineSegment} from './../../../math/geometry/lineSegment'
import {SvgDebugWriter} from './../../../math/geometry/svgDebugWriter'

describe('arrowhead', () => {
  test('trim edge no arrowheads', () => {
    const a = new Node('a')
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b')
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b)
    const gab = new GeomEdge(ab)
    const curve = LineSegment.mkLinePP(ga.center, gb.center)
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    SvgDebugWriter.dumpICurves('/tmp/gab.svg', [
      gab.curve,
      ga.boundaryCurve,
      gb.boundaryCurve,
    ])
  })
  test('trim edge with arrowheads', () => {
    const a = new Node('a')
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b')
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b)
    const gab = new GeomEdge(ab)
    const curve = LineSegment.mkLinePP(ga.center, gb.center)
    gab.edgeGeometry.targetArrowhead = new Arrowhead()
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    const xw = new SvgDebugWriter('/tmp/gabTargetArrow.svg')
    xw.writeEdges([gab])
    xw.close()
  })
})
