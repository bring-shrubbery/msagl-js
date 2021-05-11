import {GeomNode} from './../../../../layoutPlatform/layout/core/geomNode'
import {CurveFactory} from './../../../../layoutPlatform/math/geometry/curveFactory'
import {Point} from './../../../../layoutPlatform/math/geometry/point'
import {Rectangle} from './../../../../layoutPlatform/math/geometry/rectangle'
import {SvgDebugWriter} from './../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {DebugCurve} from './../../../../layoutPlatform/math/geometry/debugCurve'
import {Node} from './../../../../layoutPlatform/structs/node'
xtest('node fit', () => {
  const boundary = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    50,
    10,
    30,
    new Point(12, 12),
  )
  const n = GeomNode.mkNode(boundary, new Node('node'))
  const rect = new Rectangle({left: 70, right: 111, top: 111, bottom: 0})

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
