import {Rectangle} from './../../../utils/geometry/rectangle';
import {Point} from './../../../utils/geometry/point';

test('rectangle test', () => {
  const r = new Rectangle(0, 1, 1, 0);
  const p = new Point(0.3, 0.3);
  expect(r.Contains(p)).toBe(true);
  const r0 = new Rectangle(1, 4, 1, 0);
  expect(r.Intersects(r0)).toBe(true);
  r0.Center = new Point(12, 0);
  console.log(r0);
  expect(r.Intersects(r0)).toBe(false);
});
