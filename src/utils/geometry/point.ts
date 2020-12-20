import {LinearSystem2} from './linearSystem';
export class Point {
	static distanceEpsilon = Math.pow(10, -6);
	static tolerance = 1.0e-8;
	dot(a: Point): number {
		return this.x * a.x + this.y * a.y;
	}
	x: number;
	y: number;

	static close(a: Point, b: Point, tol: number): boolean {
		return a.minus(b).length() <= tol;
	}
	static closeD(a: number, b: number): boolean {
		const d = a - b;
		return -Point.distanceEpsilon <= d && Point.distanceEpsilon >= d;
	}
	normalize() {
		const l = this.length();
		return new Point(this.x / l, this.y / l);
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
	move(a: Point): void {
		this.x += a.x;
		this.y += a.y;
	}
	scale(sx: number, sy: number): Point {
		return new Point(this.x * sx, this.y * sy);
	}
	add(a: Point) {
		return new Point(this.x + a.x, this.y + a.y);
	}
	minus(a: Point) {
		return new Point(this.x - a.x, this.y - a.y);
	}
	mult(c: number) {
		return new Point(this.x * c, this.y * c);
	}
	div(c: number) {
		return new Point(this.x / c, this.y / c);
	}
	equal(a: Point) {
		return a.x == this.x && a.y == this.y;
	}
	neg() {
		return new Point(-this.x, -this.y);
	}

	static lineLineIntersection(a: Point, b: Point, c: Point, d: Point): Point | undefined {
		//look for the solution in the form a+u*(b-a)=c+v*(d-c)
		const ba = b.minus(a);
		const cd = c.minus(d);
		const ca = c.minus(a);
		const eps = Point.tolerance;
		const ret = LinearSystem2.Solve(ba.x, cd.x, ca.x, ba.y, cd.y, ca.y);
		if (ret != undefined && ret.x > -eps && ret.x < 1.0 + eps && ret.y > -eps && ret.y < 1.0 + eps) {
			return a.add(ba.mult(ret.x));
		} else {
			return;
		}
	}

	static parallelWithinEpsilon(a: Point, b: Point, eps: number) {
		const alength = a.length();
		const blength = b.length();
		if (alength < eps || blength < eps) return true;

		a = a.div(alength);
		b = b.div(blength);

		return Math.abs(-a.x * b.y + a.y * b.x) < eps;
	}

	static crossProduct(point0: Point, point1: Point) {
		return point0.x * point1.y - point0.y * point1.x;
	}
	static dot(a: Point, b: Point) {
		return a.x * b.x + a.y * b.y;
	}
	static add(a: Point, b: Point) {
		return a.add(b);
	}
	/// returns this rotated by the angle counterclockwise; does not change "this" value
	rotate(angle: number): Point {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		return new Point(c * this.x - s * this.y, s * this.x + c * this.y);
	}
}
