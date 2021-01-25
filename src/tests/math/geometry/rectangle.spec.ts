import {Rectangle} from './../../../math/geometry/rectangle'
import {Point} from './../../../math/geometry/point'

test('rectangle test', () => {
  const r = new Rectangle(0, 1, 1, 0)
  const p = new Point(0.3, 0.3)
  expect(r.contains(p)).toBe(true)
  const r0 = new Rectangle(1, 4, 1, 0)
  expect(r.intersects(r0)).toBe(true)
  r0.center = new Point(12, 0)
  expect(r.intersects(r0)).toBe(false)
})
