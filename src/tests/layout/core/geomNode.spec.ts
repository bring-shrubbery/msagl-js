import {GeomNode} from './../../../layout/core/geomNode'
import {CurveFactory} from './../../../math/geometry/curveFactory'
import {Point} from './../../../math/geometry/point'
import {Rectangle} from './../../../math/geometry/rectangle'
import {SvgDebugWriter} from './../../../math/geometry/svgDebugWriter'
import {DebugCurve} from './../../../math/geometry/debugCurve'
import {Node} from './../../../structs/node'
test('node fit', () => {
  const boundary = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    50,
    10,
    30,
    new Point(12, 12),
  )
  const n = GeomNode.mkNode(boundary, new Node('node'))
  const rect = new Rectangle(70, 111, 111, 0)

  n.boundingBox = rect
  const w = new SvgDebugWriter('/tmp/fit.svg')
  w.writeDebugCurves([
    DebugCurve.mkDebugCurveI(boundary),
    DebugCurve.mkDebugCurveCI('Red', n.boundaryCurve),
  ])
  w.close()
  const p = new Point(50, 90)
  n.center = p

  expect(Point.closeDistEps(n.center, p)).toBe(true)
  expect(Point.closeD(n.width, rect.width)).toBe(true)
  expect(Point.closeD(n.height, rect.height)).toBe(true)
})