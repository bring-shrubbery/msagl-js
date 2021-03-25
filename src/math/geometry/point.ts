import { LinearSystem2 } from './linearSystem'
import { GeomConstants } from './geomConstants'
export enum TriangleOrientation {
  Clockwise,
  Counterclockwise,
  Collinear,
}

export function compareTo(a: number, b: number) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export class Point {
  dot(a: Point): number {
    return this.x * a.x + this.y * a.y
  }
  private x_: number
  private y_: number

  get x() {
    return this.x_
  }
  get y() {
    return this.y_
  }

  compareTo(other: Point): number {
    const r = compareTo(this.x, other.x)
    if (r != 0) return r
    return compareTo(this.y, other.y)
  }

  toString() {
    return '(' + this.x + ',' + this.y + ')'
  }

  static close(a: Point, b: Point, tol: number): boolean {
    return a.sub(b).length <= tol
  }

  static closeSquare(a: Point, b: Point, tol: number): boolean {
    const d = b.sub(a)
    return d.dot(d) <= tol
  }
  static closeDistEps(a: Point, b: Point): boolean {
    return a.sub(b).length <= GeomConstants.distanceEpsilon
  }

  static closeD(a: number, b: number): boolean {
    const d = a - b
    return (
      -GeomConstants.distanceEpsilon <= d && d <= GeomConstants.distanceEpsilon
    )
  }
  normalize() {
    const l = this.length
    return new Point(this.x / l, this.y / l)
  }
  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  get lengthSquared() {
    return this.x * this.x + this.y * this.y
  }

  constructor(x: number, y: number) {
    this.x_ = x
    this.y_ = y
  }

  static middle(a: Point, b: Point) {
    return a.add(b).div(2)
  }

  scale(sx: number, sy: number): Point {
    return new Point(this.x * sx, this.y * sy)
  }
  add(a: Point) {
    return new Point(this.x + a.x, this.y + a.y)
  }
  sub(a: Point) {
    return new Point(this.x - a.x, this.y - a.y)
  }
  mul(c: number) {
    return new Point(this.x * c, this.y * c)
  }
  div(c: number) {
    return new Point(this.x / c, this.y / c)
  }
  equal(a: Point) {
    return a.x == this.x && a.y == this.y
  }
  neg() {
    return new Point(-this.x, -this.y)
  }

  static lineLineIntersection(
    a: Point,
    b: Point,
    c: Point,
    d: Point,
  ): Point | undefined {
    //look for the solution in the form a+u*(b-a)=c+v*(d-c)
    const ba = b.sub(a)
    const cd = c.sub(d)
    const ca = c.sub(a)
    const eps = GeomConstants.tolerance
    const ret = LinearSystem2.solve(ba.x, cd.x, ca.x, ba.y, cd.y, ca.y)
    if (
      ret != undefined &&
      ret.x > -eps &&
      ret.x < 1.0 + eps &&
      ret.y > -eps &&
      ret.y < 1.0 + eps
    ) {
      return a.add(ba.mul(ret.x))
    } else {
      return
    }
  }

  static parallelWithinEpsilon(a: Point, b: Point, eps: number) {
    const alength = a.length
    const blength = b.length
    if (alength < eps || blength < eps) return true

    a = a.div(alength)
    b = b.div(blength)

    return Math.abs(-a.x * b.y + a.y * b.x) < eps
  }

  static crossProduct(point0: Point, point1: Point) {
    return point0.x * point1.y - point0.y * point1.x
  }
  static dot(a: Point, b: Point) {
    return a.x * b.x + a.y * b.y
  }
  static add(a: Point, b: Point) {
    return a.add(b)
  }

  rotate90Ccw() {
    return new Point(-this.y, this.x)
  }

  rotate90Cw() {
    return new Point(this.y, -this.x)
  }

  clone() {
    return new Point(this.x, this.y)
  }

  /// returns this rotated by the angle counterclockwise; does not change "this" value
  rotate(angle: number): Point {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return new Point(c * this.x - s * this.y, s * this.x + c * this.y)
  }
  static anglePointCenterPoint(
    point1: Point,
    center: Point,
    point3: Point,
  ): number {
    return Point.angle(point1.sub(center), point3.sub(center))
  }

  static mkPoint(x: number, a: Point, y: number, b: Point) {
    return a.mul(x).add(b.mul(y))
  }

  static convSum(x: number, a: Point, b: Point) {
    return a.add(b.sub(a).mul(x))
  }

  /// The angle you need to turn "side0" counterclockwise to make it collinear with "side1"
  static angle(side0: Point, side1: Point): number {
    const ax = side0.x
    const ay = side0.y
    const bx = side1.x
    const by = side1.y

    const cross = ax * by - ay * bx
    const dot = ax * bx + ay * by

    if (Math.abs(dot) < GeomConstants.tolerance) {
      if (Math.abs(cross) < GeomConstants.tolerance) return 0

      if (cross < -GeomConstants.tolerance) return (3 * Math.PI) / 2
      return Math.PI / 2
    }

    if (Math.abs(cross) < GeomConstants.tolerance) {
      if (dot < -GeomConstants.tolerance) return Math.PI
      return 0.0
    }

    const atan2 = Math.atan2(cross, dot)
    if (cross >= -GeomConstants.tolerance) return atan2
    return Math.PI * 2.0 + atan2
  }

  static signedDoubledTriangleArea(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
  }

  static getTriangleOrientation(
    cornerA: Point,
    cornerB: Point,
    cornerC: Point,
  ) {
    const area = Point.signedDoubledTriangleArea(cornerA, cornerB, cornerC)
    if (area > GeomConstants.distanceEpsilon)
      return TriangleOrientation.Counterclockwise
    if (area < -GeomConstants.distanceEpsilon)
      return TriangleOrientation.Clockwise
    return TriangleOrientation.Collinear
  }

  static ClosestPointAtLineSegment(point: Point, segmentStart: Point, segmentEnd: Point): Point {
    const bc = segmentEnd.sub(segmentStart);
    const ba = point.sub(segmentStart)
    const c1 = bc.dot(ba)
    const c2 = bc.dot(bc)
    if (c1 <= 0.0 + GeomConstants.tolerance)
      return segmentStart;

    if (c2 <= c1 + GeomConstants.tolerance)
      return segmentEnd;

    return segmentStart.add(bc.mul(c1 / c2));
  }

}
