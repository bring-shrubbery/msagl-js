import { Interval } from "../../../core/geometry/Interval"

test('interval add', () => {
  const i = new Interval(0, 1)
  const j = new Interval(1, 2)
  expect(i.Contains(0.5)).toBeTruthy()
  expect(j.GetInRange(2.1)).toBe(2)
  const k = Interval.mkInterval(i, j)
  expect(k.End).toBe(2)
  expect(i.Intersects(j)).toBeTruthy()
})
