import {Point} from '../../../math/geometry/point'
import {BezierSeg} from '../../../math/geometry/bezierSeg'
import {DebugCurve} from '../../../math/geometry/debugCurve'
import {SvgDebugWriter} from '../../../math/geometry/svgDebugWriter'
test('bezier control points', () => {
  const b = [new Point(0, 0), new Point(1, 0), new Point(1, 2), new Point(3, 0)]
  const bezSeg = new BezierSeg(b[0], b[1], b[2], b[3])
  for (let i = 0; i < 4; i++) {
    expect(bezSeg.B(i).equal(b[i])).toBeTruthy()
  }
})

xtest('bezier accessors', () => {
  const b = [new Point(0, 0), new Point(1, 1), new Point(2, 1), new Point(3, 0)]
  const bezSeg = new BezierSeg(b[0], b[1], b[2], b[3])
  const mid = 0.5
  const del = 0.1
  const pm = bezSeg.value(mid)
  expect(Point.closeD(pm.x, 3 / 2)).toBeTruthy()
  const der = bezSeg.derivative(mid)
  expect(Point.closeD(der.y, 0)).toBeTruthy()
  const t = mid + del
  const otherPoint = bezSeg.value(t)
  expect(otherPoint.y < pm.y).toBeTruthy()
  expect(pm.y < 1).toBeTruthy()
  const dx = 0.001
  const val_t_plus_dx = bezSeg.value(t + dx)
  const approx_val_at_t_plus_dx = bezSeg
    .value(t)
    .add(bezSeg.derivative(t).mult(dx))
  expect(approx_val_at_t_plus_dx.minus(val_t_plus_dx).length < dx).toBe(true)
})

test('bezier length', () => {
  const b = [
    new Point(0, 100),
    new Point(100, 100),
    new Point(200, 100),
    new Point(300, 0),
  ]
  const bezSeg = new BezierSeg(b[0], b[1], b[2], b[3])
  const l = bezSeg.length
  expect(
    l <
      b[1].minus(b[0]).length +
        b[2].minus(b[1]).length +
        b[2].minus(b[3]).length,
  ).toBe(true)
})
