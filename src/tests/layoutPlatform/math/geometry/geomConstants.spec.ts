import {GeomConstants} from '../../../../layoutPlatform/math/geometry/geomConstants'

test('round', () => {
  let rp = GeomConstants.RoundDouble(1.2222225)
  expect(rp).toBe(1.222223)
  rp = GeomConstants.RoundDouble(1.2222224)
  expect(rp).toBe(1.222222)
  expect(GeomConstants.RoundDouble(1.9999996)).toBe(2)
})
