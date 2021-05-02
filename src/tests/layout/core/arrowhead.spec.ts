import {Node, Label} from './../../../structs/node'
import {Edge} from './../../../structs/edge'
import {Graph} from './../../../structs/graph'
import {GeomNode} from './../../../layout/core/geomNode'
import {GeomEdge} from './../../../layout/core/geomEdge'
import {GeomLabel} from './../../../layout/core/geomLabel'
import {GeomGraph} from '../../../layout/core/GeomGraph'
import {Arrowhead} from './../../../layout/core/arrowhead'
import {Rectangle} from './../../../math/geometry/rectangle'
import {CurveFactory} from './../../../math/geometry/curveFactory'
import {Point} from './../../../math/geometry/point'
import {LineSegment} from './../../../math/geometry/lineSegment'
import {SvgDebugWriter} from './../../../math/geometry/svgDebugWriter'

describe('arrowhead', () => {
  xtest('trim edge no arrowheads', () => {
    const a = new Node('a')
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b')
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b)
    const gab = new GeomEdge(ab)
    const curve = LineSegment.mkPP(ga.center, gb.center)
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    SvgDebugWriter.dumpICurves('/tmp/gab.svg', [
      gab.curve,
      ga.boundaryCurve,
      gb.boundaryCurve,
    ])
  })
  xtest('trim edge with arrowheads', () => {
    const a = new Node('a')
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b')
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b)
    const gab = new GeomEdge(ab)
    const label = new Label('ab')
    label.parent = ab
    gab.label = new GeomLabel(label)
    const m = Point.middle(ga.center, gb.center)

    gab.label.boundingBox = Rectangle.mkPP(m, m.add(new Point(10, 10)))
    const curve = LineSegment.mkPP(ga.center, gb.center)
    gab.edgeGeometry.sourceArrowhead = new Arrowhead()
    gab.edgeGeometry.targetArrowhead = new Arrowhead()
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    const g = new Graph()
    g.addEdge(ab)
    const gg = new GeomGraph(g)
    const xw = new SvgDebugWriter('/tmp/gg.svg')
    xw.writeGraph(gg)
    xw.close()
  })
})
