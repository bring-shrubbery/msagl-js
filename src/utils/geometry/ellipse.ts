import {ICurve} from './icurve';
import {LineSegment} from './lineSegment';
import {Curve} from './curve';
import {Rectangle} from './rectangle';
import {PN, PNInternal, PNLeaf, createPNLeaf, ParallelogramNode} from './parallelogramNode';
import {Point} from './point';
import {Parallelogram} from './parallelogram';
import {GeomConstants} from './geomConstants';
import {PlaneTransformation} from './planeTransformation';
import {ClosestPointOnCurve} from './closestPointOnCurve';
export class Ellipse implements ICurve {
	box: Rectangle;

	pNode: PN;
	aAxis: Point;
	bAxis: Point;
	center: Point;
	parStart: number;
	parEnd: number;

	// remove later
	ParStart() {
		return this.parStart;
	}
	ParEnd() {
		return this.parEnd;
	}

	// offsets the curve in the given direction
	offsetCurve(offset: number, dir: Point): ICurve {
		//is dir inside or outside of the ellipse
		const d = dir.minus(this.center);
		const angle = Point.angle(this.aAxis, d);
		const s = this.aAxis.mult(Math.cos(angle)).add(this.bAxis.mult(Math.sin(angle)));
		if (s.length() < d.length()) {
			const al = this.aAxis.length();
			const bl = this.bAxis.length();
			return Ellipse.getEllipse(this.aAxis.normalize().mult(al + offset), this.bAxis.normalize().mult(bl + offset), this.center);
		}
		{
			const al = this.aAxis.length();
			const bl = this.bAxis.length();
			return Ellipse.getEllipse(this.aAxis.normalize().mult(al - offset), this.bAxis.normalize().mult(bl - offset), this.center);
		}
	}

	// Reverse the ellipe: not implemented.
	reverse() {
		return null; // throw new Exception("not implemented");
	}

	static getEllipse(a: Point, b: Point, center: Point) {
		return new Ellipse(0, Math.PI * 2, a, b, center);
	}
	// The point on the ellipse corresponding to the parameter t is calculated by
	// the formula center + cos(t)*axis0 + sin(t) * axis1.
	// To get an ellipse rotating clockwise use, for example,
	// axis0=(-1,0) and axis1=(0,1)
	constructor(parStart: number, parEnd: number, axis0: Point, axis1: Point, center: Point) {
		//    assert(parStart <= parEnd);
		this.parStart = parStart;
		this.parEnd = parEnd;
		this.aAxis = axis0;
		this.bAxis = axis1;
		this.center = center;
		this.pNode = null;
		this.SetBoundingBox();
	}

	start() {
		return this.value(this.parStart);
	}
	end() {
		return this.value(this.parEnd);
	}

	// Trims the curve
	trim(start: number, end: number): ICurve {
		// Debug.Assert(start <= end);
		// Debug.Assert(start >= ParStart - ApproximateComparer.Tolerance);
		// Debug.Assert(end <= ParEnd + ApproximateComparer.Tolerance);
		return new Ellipse(Math.max(start, this.parStart), Math.min(end, this.parEnd), this.aAxis, this.bAxis, this.center);
	}

	// Not Implemented: Returns the trimmed curve, wrapping around the end if start is greater than end.
	trimWithWrap(start: number, end: number): ICurve {
		return null;
	}

	// The bounding box of the ellipse
	boundingBox() {
		return this.box;
	}

	// Returns the point on the curve corresponding to parameter t
	value(t: number) {
		return this.center.add(Point.mkPoint(Math.cos(t), this.aAxis, Math.sin(t), this.bAxis));
	}

	// first derivative
	derivative(t: number) {
		return Point.mkPoint(-Math.sin(t), this.aAxis, Math.cos(t), this.bAxis);
	}

	// second derivative
	secondDerivative(t: number) {
		return Point.mkPoint(-Math.cos(t), this.aAxis, -Math.sin(t), this.bAxis);
	}

	// third derivative
	thirdDerivative(t: number) {
		return Point.mkPoint(Math.sin(t), this.aAxis, -Math.cos(t), this.bAxis);
	}

	// a tree of ParallelogramNodes covering the edge
	pNodeOverICurve() {
		if (this.pNode != null) return this.pNode;
		return (this.pNode = Ellipse.createParallelogramNodeForCurveSeg(this));
	}

	static CreateNodeWithSegmentSplit(start: number, end: number, ell: Ellipse, eps: number) {
		const pBNode: PN = {
			parallelogram: null,
			seg: ell,
			leafBoxesOffset: 1,
			node: {children: []},
		};

		const intNode: PNInternal = pBNode.node as PNInternal;

		intNode.children.push(Ellipse.CreateParallelogramNodeForCurveSeg(start, 0.5 * (start + end), ell, eps));
		intNode.children.push(Ellipse.CreateParallelogramNodeForCurveSeg(0.5 * (start + end), end, ell, eps));
		const boxes: Parallelogram[] = [];
		boxes.push(intNode.children[0].parallelogram);
		boxes.push(intNode.children[1].parallelogram);
		pBNode.parallelogram = Parallelogram.parallelogramOfTwo(boxes[0], boxes[1]);
		return pBNode;
	}

	static CreateParallelogramNodeForCurveSeg(start: number, end: number, seg: Ellipse, eps: number): PN {
		const closedSeg = start == seg.parStart && end == seg.parEnd && Point.close(seg.start(), seg.end(), Point.distanceEpsilon);
		if (closedSeg) return Ellipse.CreateNodeWithSegmentSplit(start, end, seg, eps);

		const s = seg[start];
		const e = seg[end];
		const w = e.minus(s);
		const middle = seg.value((start + end) / 2);

		if (
			ParallelogramNode.distToSegm(middle, s, e) <= Point.intersectionEpsilon &&
			w * w < GeomConstants.lineSegmentThreshold * GeomConstants.lineSegmentThreshold &&
			end - start < GeomConstants.lineSegmentThreshold
		) {
			const ls = LineSegment.lineSegmentStartEnd(s, e);
			const pn: PN = ls.pNodeOverICurve();
			pn.seg = seg as ICurve;
			const leaf = pn.node as PNLeaf;
			leaf.low = start;
			leaf.high = end;
			leaf.chord = ls;
			return pn;
		}

		const we = Ellipse.WithinEpsilon(seg, start, end, eps);
		const box = new Parallelogram();
		if (we && Ellipse.CreateParallelogramOnSubSeg(start, end, seg, box)) {
			return createPNLeaf(start, end, box, seg, eps);
		} else {
			return Ellipse.CreateNodeWithSegmentSplit(start, end, seg, eps);
		}
	}

	static CreateParallelogramOnSubSeg(start: number, end: number, seg: Ellipse, box: Parallelogram): boolean {
		let tan1 = seg.derivative(start);
		const tan2 = seg.derivative(end);
		const tan2Perp = new Point(-tan2.y, tan2.x);
		const corner = seg[start];
		const e = seg[end];
		const p = e.minus(corner);

		const numerator = p.dot(tan2Perp);
		const denumerator = tan1.dot(tan2Perp);
		//x  = (p * tan2Perp) / (tan1 * tan2Perp);
		// x*tan1 will be a side of the parallelogram

		const numeratorTiny = Math.abs(numerator) < Point.distanceEpsilon;
		if (!numeratorTiny && Math.abs(denumerator) < Point.distanceEpsilon) {
			//it is degenerated; the adjacent sides would parallel, but
			//since p * tan2Perp is big the parallelogram would not contain e
			return false;
		}

		const x = numeratorTiny ? 0 : numerator / denumerator;

		tan1 = tan1.mult(x);

		box = Parallelogram.parallelogramByCornerSideSide(corner, tan1, e.minus(corner).minus(tan1));
		// assert(box.Contains(seg[end] && box.contain(seg((start + end)/2)

		return true;
	}

	static WithinEpsilon(seg: Ellipse, start: number, end: number, eps: number) {
		const n = 3; //hack !!!! but maybe can be proven for Bezier curves and other regular curves
		const d = (end - start) / n;
		const s = seg[start];
		const e = seg[end];

		const d0 = ParallelogramNode.distToSegm(seg[start + d], s, e);
		if (d0 > eps) return false;

		const d1 = ParallelogramNode.distToSegm(seg[start + d * (n - 1)], s, e);

		return d1 <= eps;
	}

	static createParallelogramNodeForCurveSeg(seg: Ellipse) {
		return Ellipse.CreateParallelogramNodeForCurveSeg(seg.parStart, seg.parEnd, seg, GeomConstants.defaultLeafBoxesOffset);
	}

	SetBoundingBox() {
		if (Point.closeD(this.parStart, 0) && Point.closeD(this.parEnd, Math.PI * 2)) this.box = this.FullBox();
		else {
			//the idea is that the box of an arc staying in one quadrant is just the box of the start and the end point of the arc
			this.box = Rectangle.RectanglePointPoint(this.start(), this.end());
			//now Start and End are in the box, we need just add all k*P/2 that are in between
			let t: number;
			for (let i = Math.ceil(this.parStart / (Math.PI / 2)); (t = (i * Math.PI) / 2) < this.parEnd; i++)
				if (t > this.parStart) this.box.Add(this.value(t));
		}
	}

	getEllipse(parStart: number, parEnd: number, axis0: Point, axis1: Point, centerX: number, centerY: number) {
		return new Ellipse(parStart, parEnd, axis0, axis1, new Point(centerX, centerY));
	}

	// Construct a full ellipse by two axes
	fullEllipse(axis0: Point, axis1: Point, center: Point) {
		return new Ellipse(0, Math.PI * 2, axis0, axis1, center);
	}

	// Constructs a full ellipse with axes aligned to X and Y directions
	getAlignedEllipse(axisA: number, axisB: number, center: Point) {
		return new Ellipse(0, Math.PI * 2, new Point(axisA, 0), new Point(0, axisB), center);
	}

	// Moves the ellipse to the delta vector
	translate(delta: Point) {
		this.center.move(delta);
		this.box.Center = this.box.Center.add(delta);
		this.pNode = null;
	}

	// Scales the ellipse by x and by y
	scaleFromOrigin(xScale: number, yScale: number) {
		return new Ellipse(this.parStart, this.parEnd, this.aAxis.mult(xScale), this.bAxis.mult(yScale), this.center.scale(xScale, yScale));
	}

	//
	getParameterAtLength(length: number) {
		//todo: slow version!
		const eps = 0.001;

		let l = this.parStart;
		let u = this.parEnd;
		const lenplus = length + eps;
		const lenminsu = length - eps;
		while (u - l > Point.distanceEpsilon) {
			const m = 0.5 * (u + l);
			const len = this.lengthPartial(this.parStart, m);
			if (len > lenplus) u = m;
			else if (len < lenminsu) l = m;
			else return m;
		}
		return (u + l) / 2;
	}

	// Transforms the ellipse
	transform(transformation: PlaneTransformation) {
		if (transformation != null) {
			const ap = transformation.MultiplyPoint(this.aAxis).minus(transformation.Offset());
			const bp = transformation.MultiplyPoint(this.bAxis).minus(transformation.Offset());
			return new Ellipse(this.parStart, this.parEnd, ap, bp, transformation.MultiplyPoint(this.center));
		}
		return this;
	}

	// returns a parameter t such that the distance between curve[t] and targetPoint is minimal
	// and t belongs to the closed segment [low,high]
	closestParameterWithinBounds(targetPoint: Point, low: number, high: number) {
		const numberOfTestPoints = 8;
		const t = (high - low) / (numberOfTestPoints + 1);
		let closest = low;
		let minDist = Number.MAX_VALUE;
		for (let i = 0; i <= numberOfTestPoints; i++) {
			const par = low + i * t;
			const p = targetPoint.minus(this[par]);
			const d = p.dot(p);
			if (d < minDist) {
				minDist = d;
				closest = par;
			}
		}
		if (closest == 0 && high == Math.PI * 2) low = -Math.PI;
		let ret = ClosestPointOnCurve.closestPoint(this, targetPoint, closest, low, high);
		if (ret < 0) ret += 2 * Math.PI;
		return ret;
	}

	// return length of the curve segment [start,end] : not implemented
	lengthPartial(start: number, end: number) {
		return Curve.LengthWithInterpolationAndThreshold(this.trim(start, end), GeomConstants.lineSegmentThreshold / 100);
	}

	length() {
		return Curve.LengthWithInterpolation(this);
	}

	// clones the curve.
	clone() {
		return new Ellipse(this.parStart, this.parEnd, this.aAxis, this.bAxis, this.center);
	}

	// returns a parameter t such that the distance between curve[t] and a is minimal
	closestParameter(targetPoint: Point) {
		let savedParStart = 0;
		const numberOfTestPoints = 8;
		const t = (this.parEnd - this.parStart) / (numberOfTestPoints + 1);
		let closest = this.parStart;
		let minDist = Number.MAX_VALUE;
		for (let i = 0; i <= numberOfTestPoints; i++) {
			const par = this.parStart + i * t;
			const p = targetPoint.minus(this.value(par));
			const d = p.dot(p);
			if (d < minDist) {
				minDist = d;
				closest = par;
			}
		}
		let parStartWasChanged = false;
		if (closest == 0 && this.parEnd == Math.PI * 2) {
			parStartWasChanged = true;
			savedParStart = this.parStart;
			this.parStart = -Math.PI;
		}
		let ret = ClosestPointOnCurve.closestPoint(this, targetPoint, closest, this.parStart, this.parEnd);
		if (ret < 0) ret += 2 * Math.PI;
		if (parStartWasChanged) this.parStart = savedParStart;
		return ret;
	}

	// left derivative at t
	leftDerivative(t: number) {
		return this.derivative(t);
	}

	// right derivative at t
	rightDerivative(t: number) {
		return this.derivative(t);
	}

	//
	curvature(t: number) {
		throw 'NotImplementedException()';
		return 0;
	}

	curvatureDerivative(t: number) {
		throw 'NotImplementedException();';
		return 0;
	}

	curvatureSecondDerivative(t: number) {
		throw 'NotImplementedException()';
		return 0;
	}

	// returns true if the ellipse goes counterclockwise
	OrientedCounterclockwise() {
		return Point.crossProduct(this.aAxis, this.bAxis) > 0;
	}

	//returns the box of the ellipse that this ellipse is a part of
	FullBox(): Rectangle {
		const del = this.aAxis.add(this.bAxis);
		return Rectangle.RectanglePointPoint(this.center.add(del), this.center.minus(del));
	}

	//is it a proper arc?
	IsArc() {
		return this.aAxis.x == this.bAxis.y && this.aAxis.y == -this.bAxis.x;
	}
}
