import { PlaneTransformation } from "./utils/geometry/planeTransformation";
import { Point } from "./utils/geometry/point"

test("plane transform test", () => {
    let m = new PlaneTransformation();

    expect(m.IsIdentity()).toBe(true);

    let p = new Point(2, 3);
    let m0 = PlaneTransformation.getPlaneTransformation(
        1, 2, 3, 4, 5, 6);
    let m1 = PlaneTransformation.getPlaneTransformation(
        2, 3, 4, 5, 6, 7);

    let m1m0p = m1.Multiply(m0).MultiplyPoint(p)
    let m1m0p_ = m1.MultiplyPoint(m0.MultiplyPoint(p))
    expect(Point.close(m1m0p, m1m0p_, 0.00001)).toBe(true)

    let invm0 = m0.Inverse()
    expect(invm0.Multiply(m0).IsIdentity()).toBe(true)
    expect(m0.Multiply(invm0).IsIdentity()).toBe(true)

});