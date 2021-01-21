import {ICurve} from './icurve';
import {Curve} from './curve';
import {Rectangle} from './rectangle';
import {PN, ParallelogramNode} from './parallelogramNode';
import {Point} from './point';
import {GeomConstants} from './geomConstants';
import {PlaneTransformation} from './planeTransformation';
import {ClosestPointOnCurve} from './closestPointOnCurve';
export class Ellipse implements ICurve {
  box: Rectangle;

  pNode: PN;
  aAxis: Point;
  bAxis: Point;
  center: Point;
  parS: number;
  parE: number;

  parStart() {
    return this.parS;
  }
  parEnd() {
    return this.parE;
  }
  // offsets the curve in the given direction
  offsetCurve(offset: number, dir: Point): ICurve {
    //is dir inside or outside of the ellipse
    const d = dir.minus(this.center);
    const angle = Point.angle(this.aAxis, d);
    const s = this.aAxis.mult(Math.cos(angle)).add(this.bAxis.mult(Math.sin(angle)));
    if (s.length < d.length) {
      const al = this.aAxis.length;
      const bl = this.bAxis.length;
      return Ellipse.mkEllipsePPP(this.aAxis.normalize().mult(al + offset), this.bAxis.normalize().mult(bl + offset), this.center);
    }
    {
      const al = this.aAxis.length;
      const bl = this.bAxis.length;
      return Ellipse.mkEllipsePPP(this.aAxis.normalize().mult(al - offset), this.bAxis.normalize().mult(bl - offset), this.center);
    }
  }

  // Reverse the ellipe: not implemented.
  reverse() {
    return null; // throw new Exception("not implemented");
  }

  static mkEllipsePPP(a: Point, b: Point, center: Point) {
    return new Ellipse(0, Math.PI * 2, a, b, center);
  }
  // The point on the ellipse corresponding to the parameter t is calculated by
  // the formula center + cos(t)*axis0 + sin(t) * axis1.
  // To get an ellipse rotating clockwise use, for example,
  // axis0=(-1,0) and axis1=(0,1)
  constructor(parS: number, parE: number, axis0: Point, axis1: Point, center: Point) {
    //    assert(parS <= parE);
    this.parS = parS;
    this.parE = parE;
    this.aAxis = axis0;
    this.bAxis = axis1;
    this.center = center;
    this.pNode = null;
    this.SetBoundingBox();
  }

  start() {
    return this.value(this.parS);
  }
  end() {
    return this.value(this.parE);
  }

  // Trims the curve
  trim(start: number, end: number): ICurve {
    // Debug.Assert(start <= end);
    // Debug.Assert(start >= ParStart - ApproximateComparer.Tolerance);
    // Debug.Assert(end <= ParEnd + ApproximateComparer.Tolerance);
    return new Ellipse(Math.max(start, this.parS), Math.min(end, this.parE), this.aAxis, this.bAxis, this.center);
  }

  // Not Implemented: Returns the trimmed curve, wrapping around the end if start is greater than end.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    return (this.pNode = ParallelogramNode.createParallelogramNodeForCurveSegDefaultOffset(this));
  }

  SetBoundingBox() {
    if (Point.closeD(this.parS, 0) && Point.closeD(this.parE, Math.PI * 2)) this.box = this.FullBox();
    else {
      //the idea is that the box of an arc staying in one quadrant is just the box of the start and the end point of the arc
      this.box = Rectangle.rectanglePointPoint(this.start(), this.end());
      //now Start and End are in the box, we need just add all k*P/2 that are in between
      let t: number;
      for (let i = Math.ceil(this.parS / (Math.PI / 2)); (t = (i * Math.PI) / 2) < this.parE; i++) if (t > this.parS) this.box.add(this.value(t));
    }
  }

  static mkEllipse(parS: number, parE: number, axis0: Point, axis1: Point, centerX: number, centerY: number) {
    return new Ellipse(parS, parE, axis0, axis1, new Point(centerX, centerY));
  }

  // Construct a full ellipse by two axes
  static mkFullEllipse(axis0: Point, axis1: Point, center: Point) {
    return new Ellipse(0, Math.PI * 2, axis0, axis1, center);
  }

  // Constructs a full ellipse with axes aligned to X and Y directions
  static mkAlignedEllipse(axisA: number, axisB: number, center: Point) {
    return new Ellipse(0, Math.PI * 2, new Point(axisA, 0), new Point(0, axisB), center);
  }

  static mkCircle(radius: number, center: Point) {
    return Ellipse.mkAlignedEllipse(radius, radius, center);
  }

  // Moves the ellipse to the delta vector
  translate(delta: Point) {
    this.center.move(delta);
    this.box.center = this.box.center.add(delta);
    this.pNode = null;
  }

  // Scales the ellipse by x and by y
  scaleFromOrigin(xScale: number, yScale: number) {
    return new Ellipse(this.parS, this.parE, this.aAxis.mult(xScale), this.bAxis.mult(yScale), this.center.scale(xScale, yScale));
  }

  //
  getParameterAtLength(length: number) {
    //todo: slow version!
    const eps = 0.001;

    let l = this.parS;
    let u = this.parE;
    const lenplus = length + eps;
    const lenminsu = length - eps;
    while (u - l > GeomConstants.distanceEpsilon) {
      const m = 0.5 * (u + l);
      const len = this.lengthPartial(this.parS, m);
      if (len > lenplus) u = m;
      else if (len < lenminsu) l = m;
      else return m;
    }
    return (u + l) / 2;
  }

  // Transforms the ellipse
  transform(transformation: PlaneTransformation) {
    if (transformation != null) {
      const ap = transformation.multiplyPoint(this.aAxis).minus(transformation.offset());
      const bp = transformation.multiplyPoint(this.bAxis).minus(transformation.offset());
      return new Ellipse(this.parS, this.parE, ap, bp, transformation.multiplyPoint(this.center));
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
    return Curve.lengthWithInterpolationAndThreshold(this.trim(start, end), GeomConstants.lineSegmentThreshold / 100);
  }

  get length() {
    return Curve.lengthWithInterpolation(this);
  }

  // clones the ellipse .
  clone() {
    return new Ellipse(this.parS, this.parE, this.aAxis.clone(), this.bAxis.clone(), this.center.clone());
  }

  // returns a parameter t such that the distance between curve[t] and a is minimal
  closestParameter(targetPoint: Point) {
    let savedParStart = 0;
    const numberOfTestPoints = 8;
    const t = (this.parE - this.parS) / (numberOfTestPoints + 1);
    let closest = this.parS;
    let minDist = Number.MAX_VALUE;
    for (let i = 0; i <= numberOfTestPoints; i++) {
      const par = this.parS + i * t;
      const p = targetPoint.minus(this.value(par));
      const d = p.dot(p);
      if (d < minDist) {
        minDist = d;
        closest = par;
      }
    }
    let parSWasChanged = false;
    if (closest == 0 && this.parE == Math.PI * 2) {
      parSWasChanged = true;
      savedParStart = this.parS;
      this.parS = -Math.PI;
    }
    let ret = ClosestPointOnCurve.closestPoint(this, targetPoint, closest, this.parS, this.parE);
    if (ret < 0) ret += 2 * Math.PI;
    if (parSWasChanged) this.parS = savedParStart;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  curvature(t: number) {
    throw 'NotImplementedException()';
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  curvatureDerivative(t: number) {
    throw 'NotImplementedException();';
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  curvatureSecondDerivative(t: number) {
    throw 'NotImplementedException()';
    return 0;
  }

  // returns true if the ellipse goes counterclockwise
  orientedCounterclockwise() {
    return Point.crossProduct(this.aAxis, this.bAxis) > 0;
  }

  //returns the box of the ellipse that this ellipse is a part of
  FullBox(): Rectangle {
    const del = this.aAxis.add(this.bAxis);
    return Rectangle.rectanglePointPoint(this.center.add(del), this.center.minus(del));
  }

  //is it a proper arc?
  isArc() {
    return this.aAxis.x == this.bAxis.y && this.aAxis.y == -this.bAxis.x;
  }
}
