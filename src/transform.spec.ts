import { MultiplyPoint, PlaneTransformation } from "./utils/geometry/planeTransformation";
import { Point } from "./utils/geometry/point"
import { Multiply } from "./utils/geometry/planeTransformation"

test("plane transform test", () => {
    let m = new PlaneTransformation();

    expect(m.IsIdentity()).toBe(true);

    let p = new Point(2, 3);
    let m0 = PlaneTransformation.getPlaneTransformation(
        1, 2, 3, 4, 5, 6);
    let m1 = PlaneTransformation.getPlaneTransformation(
        2, 3, 4, 5, 6, 7);
    let m1m0p = MultiplyPoint(Multiply(m1, m0), p)
    let m1m0p_ = MultiplyPoint(m1, MultiplyPoint(m0, p))
    expect(Point.close(m1m0p, m1m0p_, 0.00001)).toBe(true)
});