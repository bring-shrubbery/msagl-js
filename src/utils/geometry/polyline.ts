import {ICurve} from './icurve';
import {PN} from './parallelogramNode';
import {PlaneTransformation} from './planeTransformation';
import {Point} from './point';
import {Rectangle} from './rectangle';
import {PolylinePoint} from './polylinePoint';
import {GeomConstants} from './geomConstants';
import {Assert} from './../assert';
import {Parallelogram} from './parallelogram';
import {LineSegment} from './lineSegment';

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
  bBox: Rectangle;
  count: number;
  requireInit() {
    this.requireInit_ = true;
  }

  addPointXY(x: number, y: number) {
    this.addPoint(new Point(x, y));
  }

  addPoint(p: Point) {
    Assert.assert(this.endPoint == null || !Point.closeDistEps(p, this.endPoint.point));
    const pp = new PolylinePoint();
    pp.polyline = this;
    pp.point = p.clone();
    if (this.startPoint != null) {
      if (!Point.closeDistEps(p, this.startPoint.point)) {
        this.startPoint.prev = pp;
        pp.next = this.startPoint;
        this.startPoint = pp;
      }
    } else {
      this.startPoint = this.endPoint = pp;
    }
    this.requireInit();
  }

  *polylinePoints(): IterableIterator<PolylinePoint> {
    for (let s = this.startPoint; s != null; s = s.next) yield s;
  }

  *skip(skipCount: number): IterableIterator<PolylinePoint> {
    for (let s = this.startPoint; s != null; s = s.next) {
      if (skipCount > 0) skipCount--;
      else yield s;
    }
  }

  static parallelogramOfLineSeg(a: Point, b: Point) {
    const side = b.minus(a).div(2);
    return Parallelogram.parallelogramByCornerSideSide(a, side, side);
  }

  calculatePbNode() {
    const parallelograms: Parallelogram[] = [];
    const children: PN[] = [];
    let pp = this.startPoint;

    let offset = 0;
    while (pp.next != null) {
      const parallelogram = Polyline.parallelogramOfLineSeg(pp.point, pp.next.point);
      parallelograms.push(parallelogram);
      children.push({
        parallelogram: parallelogram,
        seg: this,
        leafBoxesOffset: 0,
        node: {
          low: offset,
          high: offset + 1,
          chord: LineSegment.lineSegmentStartEnd(pp.point, pp.next.point),
        },
      });

      pp = pp.next;
      offset++;
    }

    if (this.isClosed_) {
      const parallelogram = Polyline.parallelogramOfLineSeg(this.endPoint.point, this.startPoint.point);
      parallelograms.push(parallelogram);
      children.push({
        parallelogram: parallelogram,
        seg: this,
        leafBoxesOffset: 0,
        node: {
          low: offset,
          high: offset + 1,
          chord: LineSegment.lineSegmentStartEnd(this.endPoint.point, this.startPoint.point),
        },
      });
    }

    this.pBNode = {
      parallelogram: Parallelogram.getParallelogramOfAGroup(parallelograms),
      seg: this,
      leafBoxesOffset: 0,
      node: {
        children: children,
      },
    };
  }

  init() {
    this.bBox = Rectangle.rectanglePoint(this.startPoint.point);
    for (const p of this.skip(1)) {
      this.bBox.add(p.point);
    }

    this.calculatePbNode();

    this.requireInit_ = false;
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
    return 0;
  }
  parEnd(): number {
    if (this.requireInit_) this.init();
    return this.isClosed ? this.count : this.count - 1;
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
    return this.startPoint.point;
  }
  end(): Point {
    return this.isClosed() ? this.startPoint.point : this.endPoint.point;
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
    const ret = new Polyline();
    for (const p of this.polylinePoints()) {
      ret.addPoint(transformation.multiplyPoint(p.point));
    }
    return ret;
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
