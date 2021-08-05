import {GeomConstants} from '../../../../layoutPlatform/math/geometry/geomConstants'
import {PointComparer} from '../../../../layoutPlatform/routing/rectilinear/PointComparer'

test('equal', () => {
  expect(PointComparer.Equal(1.0, 1.0000001)).toBe(true)
  expect(PointComparer.Equal(1.0, 1.00001)).toBe(false)
  expect(PointComparer.Equal(1.0, 1.000001)).toBe(false)
})
