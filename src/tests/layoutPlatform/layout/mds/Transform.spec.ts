import {Transform} from '../../../../layoutPlatform/layout/mds/Transform'
import {Point} from '../../../../layoutPlatform/math/geometry/point'

test('transform.rotate', () => {
  const x = [1, 1]
  const y = [0, 0]
  Transform.Rotate(x, y, 30)
  const cos = Math.cos((Math.PI / 180) * 30)
  const sin = Math.sin((Math.PI / 180) * 30)
  expect(Point.closeD(x[0], cos)).toBe(true)
  expect(x[0]).toBe(x[1])
  expect(Point.closeD(y[0], -sin)).toBe(true)
  expect(y[0]).toBe(y[1])
})
