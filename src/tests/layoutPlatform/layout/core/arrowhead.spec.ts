import {Node, Label} from './../../../../layoutPlatform/structs/node'
import {Edge} from './../../../../layoutPlatform/structs/edge'
import {Graph} from './../../../../layoutPlatform/structs/graph'
import {GeomNode} from './../../../../layoutPlatform/layout/core/geomNode'
import {GeomEdge} from './../../../../layoutPlatform/layout/core/geomEdge'
import {GeomLabel} from './../../../../layoutPlatform/layout/core/geomLabel'
import {GeomGraph} from '../../../../layoutPlatform/layout/core/GeomGraph'
import {Arrowhead} from './../../../../layoutPlatform/layout/core/arrowhead'
import {Rectangle} from './../../../../layoutPlatform/math/geometry/rectangle'
import {CurveFactory} from './../../../../layoutPlatform/math/geometry/curveFactory'
import {Point} from './../../../../layoutPlatform/math/geometry/point'
import {LineSegment} from './../../../../layoutPlatform/math/geometry/lineSegment'
import {SvgDebugWriter} from './../../../../layoutPlatform/math/geometry/svgDebugWriter'

describe('arrowhead', () => {
  test('trim edge no arrowheads', () => {
    const a = new Node('a', null)
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b', null)
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b, null)
    const gab = new GeomEdge(ab)
    const curve = LineSegment.mkPP(ga.center, gb.center)
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    SvgDebugWriter.dumpICurves('/tmp/gab.svg', [
      gab.curve,
      ga.boundaryCurve,
      gb.boundaryCurve,
    ])
  })
  test('trim edge with arrowheads', () => {
    const a = new Node('a', null)
    const ga = new GeomNode(a)
    ga.boundaryCurve = CurveFactory.mkCircle(20, new Point(0, 0))
    const b = new Node('b', null)
    const gb = new GeomNode(b)
    gb.boundaryCurve = CurveFactory.mkCircle(20, new Point(100, 100))

    const ab = new Edge(a, b, null)
    const gab = new GeomEdge(ab)
    const label = new Label('ab', ab)
    label.parent = ab
    gab.label = new GeomLabel(label)
    const m = Point.middle(ga.center, gb.center)

    gab.label.boundingBox = Rectangle.mkPP(m, m.add(new Point(10, 10)))
    const curve = LineSegment.mkPP(ga.center, gb.center)
    gab.edgeGeometry.sourceArrowhead = new Arrowhead()
    gab.edgeGeometry.targetArrowhead = new Arrowhead()
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    const g = new Graph(null)
    g.addEdge(ab)
    const gg = new GeomGraph(g, Rectangle.mkEmpty())
    const xw = new SvgDebugWriter('/tmp/gg.svg')
    xw.writeGraph(gg)
    xw.close()
  })
})
