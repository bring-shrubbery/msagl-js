import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Point} from './../../../utils/geometry/point';
import {Polyline} from './../../../utils/geometry/polyline';
import {Curve} from './../../../utils/geometry/curve';
import {PlaneTransformation} from './../../../utils/geometry/planeTransformation';
import {SvgDebugWriter} from './../../../utils/geometry/svgDebugWriter';
import {DebugCurve} from './../../../utils/geometry/debugCurve';
import {CurveFactory} from './../../../utils/geometry/curveFactory';
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
  const w = new SvgDebugWriter('/tmp/polyline.svg');
  w.writeDebugCurves([DebugCurve.mkDebugCurveWCI(5, 'Green', poly)]);
  w.close();
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

test('polyline test intersection one', () => {
  const poly = new Polyline();
  const ps = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of ps) {
    poly.addPoint(p);
  }
  const ls = LineSegment.mkLinePP(new Point(10, 0), new Point(10, 40));
  const x = Curve.intersectionOne(ls, poly, true);
  expect(x != undefined).toBe(true);
});

test('polyline test all intersection', () => {
  const poly = new Polyline();
  const ps = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of ps) {
    poly.addPoint(p);
  }
  let ls = LineSegment.mkLinePP(new Point(10, 0), new Point(10, 40));
  let xx = Curve.getAllIntersections(ls, poly, true);
  expect(xx.length == 1).toBe(true);
  ls = LineSegment.mkLinePP(new Point(0, 5), new Point(40, 6));
  xx = Curve.getAllIntersections(ls, poly, true);
  expect(xx.length == 3).toBe(true);
  for (const i of xx) {
    expect(i.x.y > 5 && i.x.y < 6).toBeTruthy();
    expect(i.x.x > 0 && i.x.x < 30).toBeTruthy();
  }
});

test('polyline test all intersection with polyline', () => {
  const poly = new Polyline();
  const points = [new Point(0, 0), new Point(10, 20), new Point(20, 0), new Point(30, 10)];
  for (const p of points) {
    poly.addPoint(p);
  }

  const trans = new PlaneTransformation(1, 0, 0, 0, -1, 5);
  const polyFlipped = poly.transform(trans);
  expect(polyFlipped.end().x == poly.start().x).toBeTruthy();
  expect(polyFlipped.end().y == 5 - poly.start().y).toBeTruthy();
  const xx = Curve.getAllIntersections(poly, polyFlipped, false);
  const dc = [DebugCurve.mkDebugCurveTWCI(90, 0.1, 'Black', poly), DebugCurve.mkDebugCurveTWCI(90, 0.1, 'Green', polyFlipped)];
  for (const inters of xx) {
    dc.push(DebugCurve.mkDebugCurveCI('Red', CurveFactory.mkCircle(0.05, inters.x)));
  }
  const w = new SvgDebugWriter('/tmp/pylylineIntersectionOne.svg');
  w.writeDebugCurves(dc);
  w.close();
  expect(xx.length == 3).toBe(true);
});
