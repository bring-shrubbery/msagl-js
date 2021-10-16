import {Node} from '@/src/structs/node'

import {Edge} from '@/src/structs/edge'
import {Graph} from '@/src/structs/graph'
import {GeomNode} from '@/src/layout/core/geomNode'
import {GeomEdge} from '@/src/layout/core/geomEdge'
import {GeomLabel} from '@/src/layout/core/geomLabel'
import {GeomGraph} from '@/src/layout/core/GeomGraph'
import {Arrowhead} from '@/src/layout/core/arrowhead'
import {Rectangle} from '@/src/math/geometry/rectangle'
import {CurveFactory} from '@/src/math/geometry/curveFactory'
import {Point} from '@/src/math/geometry/point'
import {LineSegment} from '@/src/math/geometry/lineSegment'
import {SvgDebugWriter} from '@/test/utils/svgDebugWriter'
import {Label} from '@/src/structs/label'

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
    const curve = LineSegment.mkPP(ga.center, gb.center)
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
    const label = new Label('ab')
    label.parent = ab
    gab.label = new GeomLabel(
      Rectangle.mkPP(new Point(0, 0), new Point(10, 5)),
      label,
    )
    const m = Point.middle(ga.center, gb.center)

    gab.label.boundingBox = Rectangle.mkPP(m, m.add(new Point(10, 10)))
    const curve = LineSegment.mkPP(ga.center, gb.center)
    gab.edgeGeometry.sourceArrowhead = new Arrowhead()
    gab.edgeGeometry.targetArrowhead = new Arrowhead()
    Arrowhead.trimSplineAndCalculateArrowheads(gab, curve, true)
    const g = new Graph()
    g.addEdge(ab)
    const gg = new GeomGraph(g, Rectangle.mkEmpty())
    const xw = new SvgDebugWriter('/tmp/gg.svg')
    xw.writeGeomGraph(gg)
    xw.close()
  })
})
