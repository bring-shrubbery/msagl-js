import {Point} from './point';

// 2 by 3 matrix of plane affine transformations
export class PlaneTransformation {
	// the identity transform
	elements: number[][] = [
		[1, 0, 0],
		[0, 1, 0],
	];

	// the matrix elements
	get Elements() {
		return this.elements;
	}
	// i,j th element
	getElem(i: number, j: number) {
		return this.elements[i][j];
	}

	setElem(i: number, j: number, v: number) {
		this.elements[i][j] = v;
	}

	// Divid matrix by a matrix
	static Divide(m0: PlaneTransformation, m1: PlaneTransformation) {
		return m0.Multiply(m1.Inverse());
	}

	IsIdentity(): boolean {
		return (
			Point.closeD(this.elements[0][0], 1) &&
			Point.closeD(this.elements[0][1], 0) &&
			Point.closeD(this.elements[0][2], 0) &&
			Point.closeD(this.elements[1][0], 0) &&
			Point.closeD(this.elements[1][1], 1) &&
			Point.closeD(this.elements[1][2], 0)
		);
	}

	// returns the point of the matrix offset
	Offset(): Point {
		return new Point(this.getElem(0, 2), this.getElem(1, 2));
	}
	static getPlaneTransformation(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number) {
		const r = new PlaneTransformation();
		r.elements[0][0] = m00;
		r.elements[0][1] = m01;
		r.elements[0][2] = m02;
		r.elements[1][0] = m10;
		r.elements[1][1] = m11;
		r.elements[1][2] = m12;
		return r;
	}
	// Rotation matrix
	static Rotation(angle: number): PlaneTransformation {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return PlaneTransformation.getPlaneTransformation(cos, -sin, 0, sin, cos, 0);
	}

	static ScaleAroundCenterTransformation(xScale: number, yScale: number, center: Point): PlaneTransformation {
		/*var toOrigin = new PlaneTransformation(1, 0, -center.x, 0, 1, -center.y);
          var scaconstr = new PlaneTransformation(scale, 0, 0,
          0, scale, 0);
          var toCenter = new PlaneTransformation(1, 0, center.x, 0, 1, center.y);
          var t = toCenter*scaconstr*toOrigin;
          return t;*/
		const dX = 1 - xScale;
		const dY = 1 - yScale;
		return PlaneTransformation.getPlaneTransformation(xScale, 0, dX * center.x, 0, yScale, dY * center.y);
	}

	// Point by matrix multiplication
	MultiplyPoint(p: Point): Point {
		return new Point(
			this.getElem(0, 0) * p.x + this.getElem(0, 1) * p.y + this.getElem(0, 2),
			this.getElem(1, 0) * p.x + this.getElem(1, 1) * p.y + this.getElem(1, 2),
		);
	}

	// matrix matrix multiplication
	Multiply(b: PlaneTransformation): PlaneTransformation {
		if (b != null)
			return PlaneTransformation.getPlaneTransformation(
				this.getElem(0, 0) * b.getElem(0, 0) + this.getElem(0, 1) * b.getElem(1, 0),
				this.getElem(0, 0) * b.getElem(0, 1) + this.getElem(0, 1) * b.getElem(1, 1),
				this.getElem(0, 0) * b.getElem(0, 2) + this.getElem(0, 1) * b.getElem(1, 2) + this.getElem(0, 2),
				this.getElem(1, 0) * b.getElem(0, 0) + this.getElem(1, 1) * b.getElem(1, 0),
				this.getElem(1, 0) * b.getElem(0, 1) + this.getElem(1, 1) * b.getElem(1, 1),
				this.getElem(1, 0) * b.getElem(0, 2) + this.getElem(1, 1) * b.getElem(1, 2) + this.getElem(1, 2),
			);
		return null;
	}

	// returns the inversed matrix
	Inverse() {
		const det = this.getElem(0, 0) * this.getElem(1, 1) - this.getElem(1, 0) * this.getElem(0, 1);

		const a00 = this.getElem(1, 1) / det;
		const a01 = -this.getElem(0, 1) / det;
		const a10 = -this.getElem(1, 0) / det;
		const a11 = this.getElem(0, 0) / det;
		const a02 = -a00 * this.getElem(0, 2) - a01 * this.getElem(1, 2);
		const a12 = -a10 * this.getElem(0, 2) - a11 * this.getElem(1, 2);
		return PlaneTransformation.getPlaneTransformation(a00, a01, a02, a10, a11, a12);
	}
}
