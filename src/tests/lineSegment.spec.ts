import {LineSegment} from '../utils/geometry/lineSegment';
import {Point} from '../utils/geometry/point';
test('lineSegment case', () => {
	const a = new LineSegment(0, 0, 1, 1);

	expect(a.value(0)).toStrictEqual(new Point(0, 0));
	expect(a.value(0)).toStrictEqual(a.Start());
	expect(a.value(1)).toStrictEqual(a.End());
	expect(Point.close(a.value(0.5), a.Start().add(a.End()).div(2), Point.distanceEpsilon)).toBe(true);
	const t = 0.2;
	expect(Point.close(a.value(t), a.Start().add(a.End().minus(a.Start()).mult(t)), Point.distanceEpsilon)).toBe(true);
	const p0 = new Point(1, 1);
	const p1 = new Point(10, 10);
	const p2 = new Point(10, -10);
	const intersection = LineSegment.IntersectPPPP(p0, p1, p0, p2);
	expect(Point.close(intersection, p0, Point.distanceEpsilon)).toBe(true);
	const inters0 = LineSegment.IntersectPPPP(new Point(1, 1.1), p1, p0, p2);
	console.log('intersection = ');
	console.log(inters0);
	expect(inters0).toBe(undefined);
});
