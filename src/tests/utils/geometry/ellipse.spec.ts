// import {ICurve} from '../utils/geometry/icurve';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {LineSegment} from '../../../utils/geometry/lineSegment';
import {Point} from '../../../utils/geometry/point';
import {DebugCurve} from '../../../utils/geometry/debugCurve';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {SvgDebugWriter} from '../../../utils/geometry/svgDebugWriter';
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
