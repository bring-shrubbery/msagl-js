import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Point} from './../../../utils/geometry/point';
import {Polyline} from './../../../utils/geometry/polyline';
import {Curve} from './../../../utils/geometry/curve';

test('polyline test iterator', () => {
  const poly = new Polyline();
  const ps = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of ps) {
    poly.addPoint(p);
  }
  let i = ps.length;
  for (const pp of poly.polylinePoints()) {
    expect(pp.point.equal(ps[--i])).toBe(true); // the points are added at the start of the polyline
  }
});
test('polyline test skip', () => {
  const poly = new Polyline();
  const ps = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of ps) {
    poly.addPoint(p);
  }
  const skip = 2;
  let i = ps.length - skip;
  for (const pp of poly.skip(skip)) {
    expect(pp.point.equal(ps[--i])).toBe(true); // the points are added at the start of the polyline, skipping first two
  }
});

test('polyline test intersection', () => {
  const poly = new Polyline();
  const ps = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of ps) {
    poly.addPoint(p);
  }
  const ls = LineSegment.lineSegmentStartEnd(new Point(10, 0), new Point(10, 40));
  const x = Curve.curveCurveIntersectionOne(ls, poly, true);
  expect(x != undefined).toBe(true);
});
