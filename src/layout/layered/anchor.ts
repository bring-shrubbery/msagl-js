// Defines the anchors for a node; anchors can be not symmetrical in general
//
//           |TopAnchor
//Left anchor|
// ======Origin==================RightAnchor
//           |
//           |
//           |BottomAnchor
import { Point } from './../../math/geometry/point'
import { Polyline } from './../../math/geometry/polyline'
import { PolylinePoint } from './../../math/geometry/polylinePoint'
import { Curve } from './../../math/geometry/curve'
import { GeomConstants } from './../../math/geometry/geomConstants'
import { GeomNode } from './../core/geomNode'
export class Anchor {
  // ToString
  toString() {
    return (
      'la:ra ' +
      this.la +
      ' ' +
      this.ra +
      ' ta:ba ' +
      this.ta +
      ' ' +
      this.ba +
      ' x:y ' +
      this.x_ +
      ' ' +
      this.y_
    )
  }

  la: number
  ra: number
  ta: number
  ba: number
  private x_: number
  private y_: number
  polygonalBoundary_: Polyline
  labelCornersPreserveCoefficient: number
  node_: GeomNode
  alreadySitsOnASpline = false
  // An anchor for an edge label with the label to the left of the spline has its height equal to the one of the label
  // Its rightAnchor is a reserved space for the spline and the leftAnchor is equal to the label width.
  labelIsToTheLeftOfTheSpline: boolean
  padding = 0
  // An anchor for an edge label with the label to the right of the spline has its height equal to the one of the label
  // Its leftAnchor is a reserved space for the spline and the rightAnchor is equal to the label width.
  labelIsToTheRightOfTheSpline: boolean

  // distance for the center of the node to its left boundary
  get leftAnchor() {
    return this.la
  }

  set leftAnchor(value) {
    //the absence of this check allows a situation when an edge crosses its label or
    // a label which does not belong to the edge
    //       if(value<-Curve.DistEps)
    //       throw new Exception("assigning negative value to a anchor");
    this.la = Math.max(value, 0)
  }

  // distance from the center of the node to its right boundary
  get rightAnchor() {
    return this.ra
  }

  set rightAnchor(value) {
    //   if(value<-Curve.DistEps)
    //   throw new Exception("assigning negative value to a anchor: "+value );
    this.ra = Math.max(value, 0)
  }

  // distance from the center of the node to its top boundary
  get topAnchor() {
    return this.ta
  }

  set topAnchor(value) {
    //if(value<-Curve.DistEps)
    //throw new Exception("assigning negative value to a anchor");
    this.ta = Math.max(value, 0)
  }

  get bottomAnchor() {
    return this.ba
  }

  set bottomAnchor(value) {
    //if(value<-Curve.DistEps)
    //throw new InvalidOperationException();//"assigning negative value to a anchor");
    this.ba = Math.max(value, 0)
  }

  // Left boundary of the node
  get left() {
    return this.x_ - this.la
  }

  // right boundary of the node
  get right() {
    return this.x_ + this.ra
  }

  // top boundary of the node
  get top() {
    return this.y_ + this.ta
  }
  set top(value) {
    this.y_ += value - this.ta
  }

  // bottom of the node
  get bottom() {
    return this.y_ - this.ba
  }
  set bottom(value) {
    this.y_ += value - this.ba
  }

  get leftTop() {
    return new Point(this.left, this.top)
  }

  get leftBottom() {
    return new Point(this.left, this.bottom)
  }

  // this.right bottom of the node
  get rightBottom() {
    return new Point(this.right, this.bottom)
  }

  get node() {
    return this.node_
  }
  set node(value) {
    this.node_ = value
    this.polygonalBoundary_ = null
  }

  // Right top of the node
  get rightTop() {
    return new Point(this.right, this.top)
  }

  constructor(labelCornersPreserveCoefficient: number) {
    this.labelCornersPreserveCoefficient = labelCornersPreserveCoefficient
  }
  // constructor
  static mkAnchor(
    leftAnchor: number,
    rightAnchor: number,
    topAnchor: number,
    bottomAnchor: number,
    node: GeomNode,
    labelCornersPreserveCoefficient: number
  ) {
    const a = new Anchor(labelCornersPreserveCoefficient)
    a.la = leftAnchor
    a.ra = rightAnchor
    a.ta = topAnchor
    a.ba = bottomAnchor
    a.node = node
    return a
  }

  // the x position
  get x() {
    return this.x_
  }

  set x(value) {
    this.polygonalBoundary_ = null
    this.x_ = value
  }

  get y() {
    return this.y_
  }

  set y(value) {
    this.polygonalBoundary_ = null
    this.y_ = value
  }

  // Center of the node
  get origin() {
    return new Point(this.x, this.y)
  }

  get width() {
    return this.la + this.ra
  }

  get height() {
    return this.ta + this.ba
  }
  // set to true if the anchor has been introduced for a label

  get hasLabel() {
    return this.labelIsToTheLeftOfTheSpline || this.labelIsToTheLeftOfTheSpline
  }

  get labelWidth(): number {
    if (this.labelIsToTheLeftOfTheSpline) return this.leftAnchor
    if (this.labelIsToTheRightOfTheSpline) return this.rightAnchor

    throw new Error()
  }

  // the polygon representing the boundary of a node
  get polygonalBoundary(): Polyline {
    if (this.polygonalBoundary_ != null) return this.polygonalBoundary_
    return (this.polygonalBoundary_ = Anchor.pad(
      this.creatPolygonalBoundaryWithoutPadding(),
      this.padding,
    ))
  }

  static pad(curve: Polyline, padding: number): Polyline {
    if (padding == 0) return curve

    if (Anchor.curveIsConvex(curve)) {
      return Anchor.padConvexCurve(curve, padding)
    } else return Anchor.padConvexCurve(curve.boundingBox.perimeter(), padding)
  }

  static padCorner(
    poly: Polyline,
    p0: PolylinePoint,
    p1: PolylinePoint,
    p2: PolylinePoint,
    padding: number,
  ) {
    const cornerInfo = Anchor.getPaddedCorner(p0, p1, p2, padding)
    poly.addPoint(cornerInfo.a)
    if (cornerInfo.numberOfPoints == 2) poly.addPoint(cornerInfo.b)
  }

  static padConvexCurve(poly: Polyline, padding: number) {
    const ret = new Polyline()

    Anchor.padCorner(
      ret,
      poly.endPoint.prev,
      poly.endPoint,
      poly.startPoint,
      padding,
    )
    Anchor.padCorner(
      ret,
      poly.endPoint,
      poly.startPoint,
      poly.startPoint.next,
      padding,
    )

    for (let pp = poly.startPoint; pp.next.next != null; pp = pp.next)
      Anchor.padCorner(ret, pp, pp.next, pp.next.next, padding)

    ret.closed = true
    return ret
  }

  static getPaddedCorner(
    first: PolylinePoint,
    second: PolylinePoint,
    third: PolylinePoint,
    padding: number,
  ): {
    a: Point
    b: Point
    numberOfPoints: number
  } {
    const u = first.point
    const v = second.point
    const w = third.point
    // System.Diagnostics.Debug.Assert(Point.GetTriangleOrientation(u, v, w) == TriangleOrientation.Clockwise);

    const uvPerp = v
      .sub(u)
      .rotate(Math.PI / 2)
      .normalize()
    ///uvPerp has to look outside of the curve
    //if (uvPerp * (v - Origin) < 0)
    //    uvPerp *= -1;

    const l = v.sub(u).normalize().add(v.sub(w).normalize())
    if (l.length < GeomConstants.intersectionEpsilon) {
      return {
        a: v.add(uvPerp.mult(padding)),
        b: null,
        numberOfPoints: 1,
      }
    }
    const d = l.normalize().mult(padding)
    const dp = d.rotate(Math.PI / 2)

    //look for a in the form d+x*dp
    //we have:  Padding=(d+x*dp)*uvPerp
    const xp = (padding - d.dot(uvPerp)) / dp.dot(uvPerp)
    return {
      a: d.add(dp.mult(xp)).add(v),
      b: d.sub(dp.mult(xp)).add(v),
      numberOfPoints: 1, //number of points to add
    }
  }

  static curveIsConvex(poly: Polyline) {
    const orientation = Point.getTriangleOrientation(
      poly.endPoint.point,
      poly.startPoint.point,
      poly.startPoint.next.point,
    )
    if (
      Point.getTriangleOrientation(
        poly.endPoint.prev.point,
        poly.endPoint.point,
        poly.startPoint.point,
      ) != orientation
    )
      return false
    let pp = poly.startPoint
    while (pp.next.next != null) {
      if (
        Point.getTriangleOrientation(
          pp.point,
          pp.next.point,
          pp.next.next.point,
        ) != orientation
      )
        return false
      pp = pp.next
    }
    return true
  }

  //private static number TurnAfterSeg(Curve curve, int i) {
  //    return Point.SignedDoubledTriangleArea(curve.Segments[i].Start, curve.Segments[i].End, curve.Segments[(i + 1) / curve.Segments.Count].End);
  //}

  creatPolygonalBoundaryWithoutPadding(): Polyline {
    if (this.hasLabel)
      return this.labelIsToTheLeftOfTheSpline
        ? this.polygonOnLeftLabel()
        : this.polygonOnRightLabel()
    else if (this.nodeBoundary == null) return this.standardRectBoundary()
    else return Curve.polylineAroundClosedCurve(this.nodeBoundary)
  }

  get nodeBoundary() {
    return this.node == null ? null : this.node.boundaryCurve
  }

  standardRectBoundary() {
    const poly = new Polyline()
    poly.addPoint(this.leftTop)
    poly.addPoint(this.rightTop)
    poly.addPoint(this.rightBottom)
    poly.addPoint(this.leftBottom)
    poly.closed = true
    return poly
  }

  polygonOnLeftLabel(): Polyline {
    const t =
      this.left + (1 - this.labelCornersPreserveCoefficient) * this.labelWidth
    const poly = Polyline.mkFromPoints([
      new Point(t, this.top),
      this.rightTop,
      this.rightBottom,
      new Point(t, this.bottom),
      new Point(this.left, this.y),
    ])
    poly.closed = true
    return poly
  }

  polygonOnRightLabel() {
    const t =
      this.right - (1 - this.labelCornersPreserveCoefficient) * this.labelWidth
    const poly = Polyline.mkFromPoints([
      new Point(t, this.top),
      new Point(this.right, this.y),
      new Point(t, this.bottom),
      this.leftBottom,
      this.leftTop,
    ])
    poly.closed = true
    return poly
  }

  move(p: Point) {
    this.x += p.x
    this.y += p.y
  }
}
