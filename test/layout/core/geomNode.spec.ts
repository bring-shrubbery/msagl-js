import {GeomNode, CurveFactory, Point, Rectangle, Node} from '../../../src'
import {DebugCurve} from '../../../src/math/geometry/debugCurve'
import {closeDistEps} from '../../../src/utils/compare'
import {SvgDebugWriter} from '../../utils/svgDebugWriter'

test('no boundary curve', () => {
  const gn = new GeomNode(null)
  const bb = gn.boundingBox
  expect(bb != null && bb != undefined).toBe(true)
  expect(bb.width < 0).toBe(true)
})
test('node fit', () => {
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
  expect(closeDistEps(n.width, rect.width)).toBe(true)
  expect(closeDistEps(n.height, rect.height)).toBe(true)
})
