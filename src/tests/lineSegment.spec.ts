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
test('lineSegment mindist test', () => {
	const a = new Point(0, 0);
	const b = new Point(2, 4);
	const perp = b.minus(a).rotate(Math.PI / 2);
	const t = 0.2;
	const ls = LineSegment.lineSegmentPointPoint(a, b);
	const ls0start = ls.value(t).add(perp);

	const ls0dir = b.minus(a).rotate(0.1);
	const ls0 = LineSegment.lineSegmentPointPoint(ls0start, ls0start.add(ls0dir));
	const md = LineSegment.MinDistBetweenLineSegments(ls.Start(), ls.End(), ls0.Start(), ls0.End());
	expect(Point.closeD(md.dist, perp.length())).toBe(true);
	expect(Point.closeD(md.parab, t)).toBeTruthy();
	expect(Point.closeD(md.parcd, 0)).toBeTruthy();
});
test('lineSegment mindist test1', () => {
	const a = new Point(0, 0);
	const b = new Point(2, 4);
	const perp = b.minus(a).rotate(Math.PI / 2);
	const t = 0.2;
	const ls = LineSegment.lineSegmentPointPoint(a, b);
	const ls0start = ls.value(t).add(perp);

	const ls0dir = b.minus(a).rotate(-0.001);
	const ls0 = LineSegment.lineSegmentPointPoint(ls0start, ls0start.add(ls0dir));
	const md = LineSegment.MinDistBetweenLineSegments(ls.Start(), ls.End(), ls0.Start(), ls0.End());
	expect(md.dist < perp.length()).toBeTruthy();
	expect(Point.closeD(md.parab, 1)).toBeTruthy();

	const lsPoint = ls.value(md.parab);
	const ls0Point = ls0.value(md.parcd);

	const minPerp = lsPoint.minus(ls0Point);

	expect(Point.closeD(minPerp.dot(ls0dir), 0)).toBeTruthy();
});
