import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Ellipse} from '../../../utils/geometry/ellipse';
import {Point} from './../../../utils/geometry/point';
import {Curve} from './../../../utils/geometry/curve';
import {PlaneTransformation} from './../../../utils/geometry/planeTransformation';
import {CurveFactory} from './../../../utils/geometry/curveFactory';
import {SvgDebugWriter} from './../../../utils/geometry/svgDebugWriter';
import {DebugCurve} from './../../../utils/geometry/debugCurve';

function exp(b: boolean) {
  expect(b).toBeTruthy();
}

function intersectOnDiameter(a: Point, b: Point) {
  const ls = LineSegment.mkLinePP(a, b);
  const circ = Ellipse.mkCircle(b.minus(a).length() / 2, Point.middle(a, b));
  let xx = Curve.getAllIntersections(ls, circ, false);
  expect(xx.length == 2).toBeTruthy();
  expect(Point.closeD(xx[0].x.minus(xx[1].x).length(), b.minus(a).length())).toBeTruthy();
  for (const x of xx) {
    expect(Point.closeDistEps(x.x, a) || Point.closeDistEps(x.x, b)).toBeTruthy();
  }
  const rad = ls.length() / 2;
  ls.translate(new Point(0, rad));
  xx = Curve.getAllIntersections(ls, circ, false);
  expect(xx.length > 0 && xx.length <= 2).toBeTruthy();
}

test('rounded rectangle', () => {
  const rr0 = CurveFactory.createRectangleWithRoundedCorners(50, 40, 5, 4, new Point(0, 0));
  const w = new SvgDebugWriter('/tmp/curve.svg');
  w.writeDebugCurves([DebugCurve.mkDebugCurveI(rr0)]);
  w.close();
});

function intersectTwoRoundedRects(rr: Curve, rr0: Curve, i: number): void {
  const xx = Curve.getAllIntersections(rr, rr0, true);
  const dc = [DebugCurve.mkDebugCurveI(rr0), DebugCurve.mkDebugCurveI(rr)];
  for (const inters of xx) {
    dc.push(DebugCurve.mkDebugCurveCI('Red', CurveFactory.mkCircle(5, inters.x)));
  }

  const w = new SvgDebugWriter('/tmp/rectIntersect' + i + '.svg');
  w.writeDebugCurves(dc);
  w.close();
  exp(xx.length == 2);
}

test('intersect rounded rect', () => {
  const rr: Curve = CurveFactory.createRectangleWithRoundedCorners(100, 52, 7, 7, new Point(0, 0));
  const rc: Curve = rr.clone();
  rc.translate(new Point(13, 3));
  intersectTwoRoundedRects(rr, rc, 2);
});

test('curve intersect line circle', () => {
  const a = new Point(1, 0);
  const b = new Point(2, 0);
  intersectOnDiameter(a, b);
  const degree = Math.PI / 180;
  for (let i = 0; i < 90; i++) {
    const angle = i * degree;
    const m = PlaneTransformation.rotation(angle);
    const ac = m.multiplyPoint(a);
    const bc = m.multiplyPoint(b);
    intersectOnDiameter(ac, bc);
  }
});
