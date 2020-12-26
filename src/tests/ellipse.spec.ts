// import {ICurve} from '../utils/geometry/icurve';
import {LineSegment} from '../utils/geometry/lineSegment';
import {Point} from '../utils/geometry/point';
import {svgDebugWriter} from '../utils/geometry/svgDebugWriter';
import {Ellipse} from '../utils/geometry/ellipse';
import {GeomConstants} from '../utils/geometry/geomConstants';
test('ellipse value test', () => {
	const a = new Point(1, 0);
	const b = new Point(0, 2);
	const cen = new Point(0, 0);
	const ell = Ellipse.getEllipse(a, b, cen);
	const t = 0.3;
	expect(Point.close(ell.value(t), a.mult(Math.cos(t)).add(b.mult(Math.sin(t))), GeomConstants.distanceEpsilon)).toBeTruthy;
});
