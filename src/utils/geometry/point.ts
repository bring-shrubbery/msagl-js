export class Point {
	static distanceEpsilon = Math.pow(10, -6);
	dot(a: Point): number {
		return dot(this, a);
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
}
export function dot(a: Point, b: Point) {
	return a.x * b.x + a.y * b.y;
}
export function add(a: Point, b: Point) {
	return a.add(b);
}
export function parallelWithinEpsilon(a: Point, b: Point, eps: number) {
	const alength = a.length();
	const blength = b.length();
	if (alength < eps || blength < eps) return true;

	a = a.div(alength);
	b = b.div(blength);

	return Math.abs(-a.x * b.y + a.y * b.x) < eps;
}
