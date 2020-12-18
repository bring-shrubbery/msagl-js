import {PlaneTransformation} from './utils/geometry/planeTransformation';
import {Point} from './utils/geometry/point';

test('plane transform test', () => {
	const m = new PlaneTransformation();

	expect(m.IsIdentity()).toBe(true);

	const p = new Point(2, 3);
	const m0 = PlaneTransformation.getPlaneTransformation(1, 2, 3, 4, 5, 6);
	const m1 = PlaneTransformation.getPlaneTransformation(2, 3, 4, 5, 6, 7);

	const m1m0p = m1.Multiply(m0).MultiplyPoint(p);
	const m1m0p_ = m1.MultiplyPoint(m0.MultiplyPoint(p));
	expect(Point.close(m1m0p, m1m0p_, 0.00001)).toBe(true);

	const invm0 = m0.Inverse();
	expect(invm0.Multiply(m0).IsIdentity()).toBe(true);
	expect(m0.Multiply(invm0).IsIdentity()).toBe(true);
});
