import {ICurve} from './icurve';
import {PN} from './parallelogramNode';
import {PlaneTransformation} from './planeTransformation';
import {Point} from './point';
import {Rectangle} from './rectangle';
import {PolylinePoint} from './polylinePoint';
import {GeomConstants} from './geomConstants';
import {Assert} from './../assert';

type AdjustedPar = {
  a: Point;
  b: Point;
  t: number;
};

export class Polyline implements ICurve {
  startPoint: PolylinePoint;
  endPoint: PolylinePoint;
  requireInit_: boolean;
  private isClosed_: boolean;
  pBNode: PN;
  boundingBox: Rectangle;
  count: number;
  requireInit() {
    this.requireInit_ = true;
  }

  *polylinePoints(count: number): IterableIterator<PolylinePoint> {
    while (true) yield count++;
  }

  init() {
    this.boundingBox = Rectangle.rectanglePoint(this.startPoint.point);
    this.count = 1;
    for (const p of this.skip(1)) {
      this.boundingBox.add(p);
      this.count++;
    }

    CalculatePbNode();

    NeedToInit = false;
  }

  isClosed() {
    return this.isClosed_;
  }
  setIsClosed(val: boolean) {
    this.isClosed_ = val;
  }

  value(t: number): Point {
    if (this.requireInit_) this.init();
    const p = this.getAdjustedParamAndStartEndPoints(t);
    return Point.convSum(p.t, p.a, p.b);
  }

  getAdjustedParamAndStartEndPoints(t: number): AdjustedPar {
    Assert.assert(t >= -GeomConstants.tolerance);
    Assert.assert(this.startPoint != null);
    let s = this.startPoint;

    while (s.next != null) {
      if (t <= 1) {
        return {
          a: s.point,
          b: s.next.point,
          t: t,
        };
      }
      s = s.next;
      t -= 1;
    }

    if (this.isClosed()) {
      if (t <= 1) {
        return {
          a: this.endPoint.point,
          b: this.startPoint.point,
          t: t,
        };
      }
    }
    throw new Error('out of the parameter domain');
  }

  derivative(t: number): Point {
    const ap = this.getAdjustedParamAndStartEndPoints(t);
    return ap.b.minus(ap.a);
  }

  secondDerivative(t: number): Point {
    return new Point(0, 0);
  }
  thirdDerivative(t: number): Point {
    return new Point(0, 0);
  }
  pNodeOverICurve(): PN {
    if (this.requireInit_) this.init();
    return this.pBNode;
  }
  boundingBox(): Rectangle {
    throw new Error('Method not implemented.');
  }
  parStart(): number {
    throw new Error('Method not implemented.');
  }
  parEnd(): number {
    throw new Error('Method not implemented.');
  }
  trim(start: number, end: number): ICurve {
    throw new Error('Method not implemented.');
  }
  trimWithWrap(start: number, end: number): ICurve {
    throw new Error('Method not implemented.');
  }
  translate(delta: Point): void {
    throw new Error('Method not implemented.');
  }
  scaleFromOrigin(xScale: number, yScale: number): ICurve {
    throw new Error('Method not implemented.');
  }
  start(): Point {
    throw new Error('Method not implemented.');
  }
  end(): Point {
    throw new Error('Method not implemented.');
  }
  reverse(): ICurve {
    throw new Error('Method not implemented.');
  }
  offsetCurve(offset: number, dir: Point): ICurve {
    throw new Error('Method not implemented.');
  }
  lengthPartial(start: number, end: number): number {
    throw new Error('Method not implemented.');
  }
  length(): number {
    throw new Error('Method not implemented.');
  }
  getParameterAtLength(length: number): number {
    throw new Error('Method not implemented.');
  }
  transform(transformation: PlaneTransformation): ICurve {
    throw new Error('Method not implemented.');
  }
  closestParameterWithinBounds(targetPoint: Point, low: number, high: number): number {
    throw new Error('Method not implemented.');
  }
  closestParameter(targetPoint: Point): number {
    throw new Error('Method not implemented.');
  }
  clone(): ICurve {
    throw new Error('Method not implemented.');
  }
  leftDerivative(t: number): Point {
    throw new Error('Method not implemented.');
  }
  rightDerivative(t: number): Point {
    throw new Error('Method not implemented.');
  }
  curvature(t: number): number {
    throw new Error('Method not implemented.');
  }
  curvatureDerivative(t: number): number {
    throw new Error('Method not implemented.');
  }
  curvatureSecondDerivative(t: number): number {
    throw new Error('Method not implemented.');
  }
}
