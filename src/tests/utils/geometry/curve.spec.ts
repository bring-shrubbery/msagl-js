import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Ellipse} from '../../../utils/geometry/ellipse';
import {Point} from './../../../utils/geometry/point';
import {Curve} from './../../../utils/geometry/curve';
import {PlaneTransformation} from './../../../utils/geometry/planeTransformation';

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
    console.log(i);
    intersectOnDiameter(ac, bc);
  }
});
