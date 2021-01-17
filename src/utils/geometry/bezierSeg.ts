// Cubic Bezier Segment
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
import {Assert} from './../assert';
export class BezierSeg implements ICurve {
  leftDerivative(t: number) {
    return this.derivative(t);
  }

  rightDerivative(t: number) {
    return this.derivative(t);
  }

  // control points
  b: Point[] = new Array(4);

  // coefficients
  l: Point;
  e: Point;
  c: Point;

  // get a control point
  B(controlPointIndex: number) {
    return this.b[controlPointIndex];
  }

  pBoxNode: PN;
  // A tree of ParallelogramNodes covering the curve.
  // This tree is used in curve intersections routines.
  // <value></value>
  pNodeOverICurve() {
    if (this.pBoxNode != null) return this.pBoxNode;
    return (this.pBoxNode = ParallelogramNode.createParallelogramNodeForCurveSeg(this));
  }
  // Returns the point on the curve corresponding to parameter t
  value(t: number) {
    const t2 = t * t;
    const t3 = t2 * t;
    //    return l * t3 + e * t2 + c * t + b[0];
    return this.l.mult(t3).add(this.e.mult(t2).add(this.c.mult(t)).add(this.b[0]));
  }

  static adjustParamTo01(u: number): number {
    if (u > 1) return 1;
    else if (u < 0) return 0;
    return u;
  }

  //throw away the segments [0,u] and [v,1] of the segment
  // Returns the trimmed curve
  trim(u: number, v: number) {
    u = BezierSeg.adjustParamTo01(u);
    v = BezierSeg.adjustParamTo01(v);

    if (u > v) return this.trim(v, u);

    if (u > 1.0 - GeomConstants.tolerance) return new BezierSeg(this.b[3], this.b[3], this.b[3], this.b[3]);

    const b1: Point[] = new Point[3]();
    const b2: Point[] = new Point[2]();
    const pv = this.casteljau(u, b1, b2);

    //this will be the trim to [v,1]
    const trimByU = new BezierSeg(pv, b2[1], b1[2], this.b[3]);

    //1-v is not zero here because we have handled already the case v=1
    const pu = trimByU.casteljau((v - u) / (1.0 - u), b1, b2);

    return new BezierSeg(trimByU.b[0], b1[0], b2[0], pu);
  }

  // Not Implemented: Returns the trimmed curve, wrapping around the end if start is greater than end.
  trimWithWrap(start: number, end: number) {
    throw 'NotImplementedException()';
    return null;
  }

  //array for casteljau method
  casteljau(t: number, b1: Point[], b2: Point[]): Point {
    const f = 1.0 - t;
    for (let i = 0; i < 3; i++) b1[i] = Point.mkPoint(f, this.b[i], t, this.b[i + 1]);

    for (let i = 0; i < 2; i++) b2[i] = Point.mkPoint(f, b1[i], t, b1[i + 1]);

    return Point.mkPoint(f, b2[0], t, b2[1]);
  }
  // first derivative
  derivative(t: number) {
    return this.l
      .mult(3 * t * t)
      .add(this.e)
      .mult(2 * t)
      .add(this.c);
  }
  // second derivative
  secondDerivative(t: number) {
    return Point.mkPoint(6 * t, this.l, 2, this.e);
  }

  // third derivative
  thirdDerivative(t: number) {
    return this.l.mult(6);
  }
  // the constructor
  constructor(b0: Point, b1: Point, b2: Point, b3: Point) {
    this.b[0] = b0;
    this.b[1] = b1;
    this.b[2] = b2;
    this.b[3] = b3;
    this.c = this.b[1].minus(this.b[0]).mult(3);
    this.e = this.b[2].minus(this.b[1]).mult(3).minus(this.c);
    this.l = this.b[3].minus(this.b[0]).minus(this.c).minus(this.e);
  }

  start() {
    return this.b[0];
  }

  end() {
    return this.b[3];
  }

  ParStart() {
    return 0;
  }
  ParEnd() {
    return 1;
  }

  // this[Reverse[t]]=this[ParEnd+ParStart-t]
  reverse() {
    return new BezierSeg(this.b[3], this.b[2], this.b[1], this.b[0]);
  }

  // Returns the curved moved by delta
  translate(delta: Point) {
    this.b[0].move(delta);
    this.b[1].move(delta);
    this.b[2].move(delta);
    this.b[3].move(delta);
    this.c = this.b[1].minus(this.b[0]).mult(3);
    this.e = this.b[2].minus(this.b[1]).mult(3).minus(this.c);
    this.l = this.b[3].minus(this.b[0]).minus(this.c).minus(this.e);
    this.pBoxNode = null;
  }

  // Returns the curved scaled by x and y
  scaleFromOrigin(xScale: number, yScale: number) {
    return new BezierSeg(
      this.b[0].scale(xScale, yScale),
      this.b[1].scale(xScale, yScale),
      this.b[2].scale(xScale, yScale),
      this.b[3].scale(xScale, yScale),
    );
  }

  // Offsets the curve in the direction of dir
  offsetCurve(offset: number, dir: Point) {
    return null;
  }

  // return length of the curve segment [start,end]
  lengthPartial(start: number, end: number) {
    return this.trim(start, end).Length;
  }
  // Get the length of the curve
  length() {
    return BezierSeg.lengthOnControlPolygon(this.b[0], this.b[1], this.b[2], this.b[3]);
  }

  //
  static lengthOnControlPolygon(b0: Point, b1: Point, b2: Point, b3: Point) {
    const innerCordLength = b3.minus(b0).length();
    const controlPointPolygonLength = b1.minus(b0).length() + b2.minus(b1).length() + b3.minus(b2).length();
    if (controlPointPolygonLength - innerCordLength > GeomConstants.lineSegmentThreshold) {
      const mb0 = Point.middle(b0, b1);
      const mb1 = Point.middle(b1, b2);
      const mb2 = Point.middle(b2, b3);
      const mmb0 = Point.middle(mb0, mb1);
      const mmb1 = Point.middle(mb2, mb1);
      const mmmb0 = Point.middle(mmb0, mmb1);
      //                LayoutAlgorithmSettings.ShowDebugCurves(new DebugCurve(100, 2, "blue", new BezierSeg(b0, b1, b2, b3)), new DebugCurve(100, 1, "red", new BezierSeg(b0, mb0, mmb0, mmmb0)), new DebugCurve(100, 1, "green", new BezierSeg(mmmb0, mmb1, mb2, b3)));
      return BezierSeg.lengthOnControlPolygon(b0, mb0, mmb0, mmmb0) + BezierSeg.lengthOnControlPolygon(mmmb0, mmb1, mb2, b3);
    }

    return (controlPointPolygonLength + innerCordLength) / 2;
  }

  // the segment bounding box
  boundingBox() {
    const ret = Rectangle.RectanglePointPoint(this.b[0], this.b[1]);
    ret.add(this.b[2]);
    ret.add(this.b[3]);
    return ret;
  }

  // Return the transformed curve
  transform(transformation: PlaneTransformation) {
    return new BezierSeg(
      transformation.multiplyPoint(this.b[0]),
      transformation.multiplyPoint(this.b[1]),
      transformation.multiplyPoint(this.b[2]),
      transformation.multiplyPoint(this.b[3]),
    );
  }

  // returns a parameter t such that the distance between curve[t] and targetPoint is minimal
  // and t belongs to the closed segment [low,high]
  closestParameterWithinBounds(targetPoint: Point, low: number, high: number) {
    Assert.assert(high <= 1 && low >= 0);
    Assert.assert(low <= high);
    const t = (high - low) / 8;
    let closest = 0;
    let minDist = Number.MAX_VALUE;
    for (let i = 0; i < 9; i++) {
      const p = targetPoint.minus(this.value(i * t + low));
      const d = p.dot(p);
      if (d < minDist) {
        minDist = d;
        closest = i * t + low;
      }
    }
    return ClosestPointOnCurve.closestPoint(this, targetPoint, closest, low, high);
  }

  // clones the curve.
  clone() {
    return new BezierSeg(this.b[0], this.b[1], this.b[2], this.b[3]);
  }

  parStart() {
    return 0;
  }
  parEnd() {
    return 1;
  }

  // the signed curvature of the segment at t
  curvature(t: number) {
    Assert.assert(t >= this.parStart() && t <= this.parEnd());

    const den = this.G(t);

    Assert.assert(Math.abs(den) > 0.00001);

    return this.F(t) / den;
  }

  F(t: number) {
    return this.Xp(t) * this.Ypp(t) - this.Yp(t) * this.Xpp(t);
  }

  // G(t) is the denomenator of the curvature
  G(t: number) {
    const xp = this.Xp(t);
    const yp = this.Yp(t);
    const den = xp * xp + yp * yp;
    return Math.sqrt(den * den * den);
  }

  // the first derivative of x-coord
  Xp(t: number) {
    return 3 * this.l.x * t * t + 2 * this.e.x * t + this.c.x;
  }

  // the second derivativ of y-coordinate
  Ypp(t: number) {
    return 6 * this.l.y * t + 2 * this.e.y;
  }

  // the first derivative of y-coord
  Yp(t: number) {
    return 3 * this.l.y * t * t + 2 * this.e.y * t + this.c.y;
  }

  // the seconde derivative of x coord
  Xpp(t: number) {
    return 6 * this.l.x * t + 2 * this.e.x;
  }
  // the third derivative of x coordinate
  Xppp(t: number) {
    return 6 * this.l.x;
  }

  // the third derivative of y coordinate
  Yppp(t: number) {
    return 6 * this.l.y;
  }

  // the derivative of the curvature at t
  curvatureDerivative(t: number) {
    // we need to calculate the derivative of f/g where f=xp* ypp-yp*xpp and g=(xp*xp+yp*yp)^(3/2)
    const h = this.G(t);
    return (this.Fp(t) * h - this.Gp(t) * this.F(t)) / (h * h);
  }

  Fp(t: number) {
    return this.Xp(t) * this.Yppp(t) - this.Yp(t) * this.Xppp(t);
  }

  Fpp(t: number) {
    return (
      this.Xpp(t) * this.Yppp(t) - // + Xp(t) * Ypppp(t)=0
      this.Ypp(t) * this.Xppp(t)
    ); //- Yp(t) * Xpppp(t)=0
  }

  // returns a parameter t such that the distance between curve[t] and a is minimal
  closestParameter(targetPoint: Point) {
    const t = 1.0 / 8;
    let closest = 0;
    let minDist = Number.MAX_VALUE;
    for (let i = 0; i < 9; i++) {
      const p = targetPoint.minus(this.value(i * t));
      const d = p.dot(p);
      if (d < minDist) {
        minDist = d;
        closest = i * t;
      }
    }
    return ClosestPointOnCurve.closestPoint(this, targetPoint, closest, 0, 1);
  }

  //
  curvatureSecondDerivative(t: number) {
    const g = this.G(t);
    return (this.Qp(t) * g - 2 * this.Q(t) * this.Gp(t)) / (g * g * g);
  }

  Q(t: number) {
    return this.Fp(t) * this.G(t) - this.Gp(t) * this.F(t);
  }

  Qp(t: number) {
    return this.Fpp(t) * this.G(t) - this.Gpp(t) * this.F(t);
  }

  Gpp(t: number) {
    const xp = this.Xp(t);
    const yp = this.Yp(t);
    const xpp = this.Xpp(t);
    const ypp = this.Ypp(t);
    const xppp = this.Xppp(t);
    const yppp = this.Yppp(t);
    const u = Math.sqrt(xp * xp + yp * yp);
    const v = xp * xpp + yp * ypp;
    return 3 * ((v * v) / u + u * (xpp * xpp + xp * xppp + ypp * ypp + yp * yppp));
  }

  Gp(t: number) {
    const xp = this.Xp(t);
    const yp = this.Yp(t);
    const xpp = this.Xpp(t);
    const ypp = this.Ypp(t);
    return 3 * Math.sqrt(xp * xp + yp * yp) * (xp * xpp + yp * ypp);
  }

  getParameterAtLength(length: number) {
    let low = 0;
    let upper = 1;
    while (upper - low > GeomConstants.tolerance) {
      const middle = (upper + low) / 2;
      const err = this.evaluateError(length, middle);
      if (err > 0) upper = middle;
      else if (err < 0) low = middle;
      else return middle;
    }

    return (low + upper) / 2;
  }

  evaluateError(length: number, t: number) {
    //todo: this is a slow version!
    const f = 1 - t;
    const mb0 = Point.mkPoint(f, this.b[0], t, this.b[1]);
    const mb1 = Point.mkPoint(f, this.b[1], t, this.b[2]);
    const mb2 = Point.mkPoint(f, this.b[2], t, this.b[3]);
    const mmb0 = Point.mkPoint(f, mb0, t, mb1);
    const mmb1 = Point.mkPoint(f, mb1, t, mb2);
    const mmmb0 = Point.mkPoint(f, mmb0, t, mmb1);

    const lengthAtT = BezierSeg.lengthOnControlPolygon(this.b[0], mb0, mmb0, mmmb0);

    if (lengthAtT > length + GeomConstants.distanceEpsilon) return 1;

    if (lengthAtT < length - GeomConstants.distanceEpsilon) return -1;

    return 0;
  }
}
