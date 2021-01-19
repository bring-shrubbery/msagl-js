// import {ICurve} from '../utils/geometry/icurve';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Point} from '../../../utils/geometry/point';
import {DebugCurve} from '../../../utils/geometry/debugCurve';
import {Curve} from '../../../utils/geometry/curve';
import {CurveFactory} from '../../../utils/geometry/curveFactory';
import {SvgDebugWriter} from '../../../utils/geometry/svgDebugWriter';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Ellipse} from '../../../utils/geometry/ellipse';
import {GeomConstants} from '../../../utils/geometry/geomConstants';
test('ellipse value test', () => {
  const a = new Point(100, 0);
  const b = new Point(0, 200);
  const cen = new Point(-100, 0);
  const ell = Ellipse.mkEllipsePPP(a, b, cen);
  const t = 0.3;
  expect(Point.close(ell.value(t), a.mult(Math.cos(t)).add(b.mult(Math.sin(t))), GeomConstants.distanceEpsilon)).toBeTruthy;
  const w = new SvgDebugWriter('/tmp/ellipse.svg');
  w.writeDebugCurves([DebugCurve.mkDebugCurveI(ell)]);
  w.close();
});

function exp(b: boolean) {
  expect(b).toBeTruthy();
}

test('intersect quarters', () => {
  const rr = new Ellipse(0, Math.PI / 2, new Point(100, 0), new Point(0, 100), new Point(0, 0));
  const rc = rr.clone();
  rc.translate(new Point(-3, 3));
  const xx = Curve.getAllIntersections(rr, rc, true);
  expect(xx.length == 1).toBeTruthy();
  expect(Point.close(rr.value(xx[0].par0), xx[0].x, GeomConstants.intersectionEpsilon)).toBe(true);
});
