import {ConvexHull} from '../math/geometry/convexHull'
import {Curve} from '../math/geometry/curve'
import {GeomConstants} from '../math/geometry/geomConstants'
import {ICurve} from '../math/geometry/icurve'
import {Point, TriangleOrientation} from '../math/geometry/point'
import {Polyline} from '../math/geometry/polyline'
import {PolylinePoint} from '../math/geometry/polylinePoint'
import {Assert} from '../utils/assert'

export class InteractiveObstacleCalculator {
  private static PadCorner(
    poly: Polyline,
    p0: PolylinePoint,
    p1: PolylinePoint,
    p2: PolylinePoint,
    padding: number,
  ): boolean {
    const padInfo = InteractiveObstacleCalculator.GetPaddedCorner(
      p0,
      p1,
      p2,
      padding,
    )
    if (padInfo.numberOfPoints == -1) {
      return false
    }

    poly.addPoint(padInfo.a)
    if (padInfo.numberOfPoints == 2) {
      poly.addPoint(padInfo.b)
    }

    return true
  }

  static PaddedPolylineBoundaryOfNode(
    curve: ICurve,
    padding: number,
  ): Polyline {
    return InteractiveObstacleCalculator.CreatePaddedPolyline(
      Curve.polylineAroundClosedCurve(curve),
      padding,
    )
  }

  static GetPaddedCorner(
    first: PolylinePoint,
    second: PolylinePoint,
    third: PolylinePoint,
    padding: number,
  ): {a: Point; b: Point; numberOfPoints: number} {
    const u: Point = first.point
    const v: Point = second.point
    const w: Point = third.point
    if (
      Point.getTriangleOrientation(u, v, w) ==
      TriangleOrientation.Counterclockwise
    ) {
      return {a: undefined, b: undefined, numberOfPoints: -1}
    }
    let uvPerp: Point = v
      .sub(u)
      .rotate(Math.PI / 2)
      .normalize()
    if (InteractiveObstacleCalculator.CornerIsNotTooSharp(u, v, w)) {
      // the angle is not too sharp: just continue the offset lines of the sides and return their intersection
      uvPerp = uvPerp.mul(padding)
      const vwPerp: Point = w
        .sub(v)
        .normalize()
        .mul(padding)
        .rotate(Math.PI / 2)
      const a = Point.lineLineIntersection(
        u.add(uvPerp),
        v.add(uvPerp),
        v.add(vwPerp),
        w.add(vwPerp),
      )
      Assert.assert(a != undefined)
      return {a: a, b: a, numberOfPoints: 1}
    }

    const l: Point = v.sub(u).normalize().add(v.sub(w).normalize())
    if (l.length < GeomConstants.intersectionEpsilon) {
      const a = v.add(uvPerp.mul(padding))
      return {a: a, b: a, numberOfPoints: 1}
    }

    const d: Point = l.normalize().mul(padding)
    const dp: Point = d.rotate(Math.PI / 2)
    // look for a in the form d+x*dp
    // we have:  Padding=(d+x*dp)*uvPerp
    const xp: number = (padding - d.dot(uvPerp)) / dp.dot(uvPerp)
    const dpxp = dp.mul(xp)
    return {a: d.add(dpxp).add(v), b: d.sub(dpxp).add(v), numberOfPoints: 2}
  }

  static CornerIsNotTooSharp(u: Point, v: Point, w: Point): boolean {
    const a: Point = u
      .sub(v)
      .rotate(Math.PI / 4)
      .add(v)
    return (
      Point.getTriangleOrientation(v, a, w) ==
      TriangleOrientation.Counterclockwise
    )
    //    return Point.Angle(u, v, w) > Math.PI / 4;
  }
  static CreatePaddedPolyline(poly: Polyline, padding: number): Polyline {
    Assert.assert(
      Point.getTriangleOrientation(
        poly.start,
        poly.startPoint.next.point,
        poly.startPoint.next.next.point,
      ) == TriangleOrientation.Clockwise,
      'Unpadded polyline is not clockwise',
    )
    const ret = new Polyline()
    if (
      !InteractiveObstacleCalculator.PadCorner(
        ret,
        poly.endPoint.prev,
        poly.endPoint,
        poly.startPoint,
        padding,
      )
    ) {
      return InteractiveObstacleCalculator.CreatePaddedPolyline(
        Polyline.mkFromPoints(
          Array.from(ConvexHull.CalculateConvexHull(poly.points())),
        ),
        padding,
      )
    }

    if (
      !InteractiveObstacleCalculator.PadCorner(
        ret,
        poly.endPoint,
        poly.startPoint,
        poly.startPoint.next,
        padding,
      )
    ) {
      return InteractiveObstacleCalculator.CreatePaddedPolyline(
        Polyline.mkFromPoints(
          Array.from(ConvexHull.CalculateConvexHull(poly.points())),
        ),
        padding,
      )
    }

    for (let pp = poly.startPoint; pp.next.next != null; pp = pp.next) {
      if (
        !InteractiveObstacleCalculator.PadCorner(
          ret,
          pp,
          pp.next,
          pp.next.next,
          padding,
        )
      ) {
        return InteractiveObstacleCalculator.CreatePaddedPolyline(
          Polyline.mkFromPoints(
            Array.from(ConvexHull.CalculateConvexHull(poly.points())),
          ),
          padding,
        )
      }
    }

    Assert.assert(
      Point.getTriangleOrientation(
        ret.start,
        ret.startPoint.next.point,
        ret.startPoint.next.next.point,
      ) != TriangleOrientation.Counterclockwise,
      'Padded polyline is counterclockwise',
    )
    ret.closed = true
    return ret
  }
}
