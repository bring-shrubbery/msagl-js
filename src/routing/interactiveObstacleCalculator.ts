import {from} from 'linq-to-typescript'
import {ConvexHull} from '../math/geometry/convexHull'
import {Curve, PointLocation} from '../math/geometry/curve'
import {GeomConstants} from '../math/geometry/geomConstants'
import {ICurve} from '../math/geometry/icurve'
import {Point, TriangleOrientation} from '../math/geometry/point'
import {Polyline} from '../math/geometry/polyline'
import {PolylinePoint} from '../math/geometry/polylinePoint'
import {
  CreateRectangleNodeOnListOfNodes,
  mkRectangleNode,
  RectangleNode,
} from '../math/geometry/RTree/RectangleNode'
import {
  CrossRectangleNodes,
  CrossRectangleNodesSameType,
} from '../math/geometry/RTree/RectangleNodeUtils'
import {GetConnectedComponents} from '../math/graphAlgorithms/ConnectedComponentCalculator'
import {mkGraphOnEdgesArray} from '../structs/basicGraphOnEdges'
import {Assert} from '../utils/assert'
import {IntPair} from '../utils/IntPair'
import {Polygon} from './visibility/Polygon'
// import {Assert} from '../utils/assert'

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

  static CurveIsClockwise(iCurve: ICurve, pointInside: Point): boolean {
    return (
      Point.getTriangleOrientation(
        pointInside,
        iCurve.start,
        iCurve.start.add(iCurve.derivative(iCurve.parStart)),
      ) == TriangleOrientation.Clockwise
    )
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

  static LoosePolylineWithFewCorners(
    tightPolyline: Polyline,
    p: number,
  ): Polyline {
    if (p < GeomConstants.distanceEpsilon) {
      return tightPolyline
    }

    return InteractiveObstacleCalculator.CreateLoosePolylineOnBisectors(
      tightPolyline,
      p,
    )
  }

  static CreateLoosePolylineOnBisectors(
    tightPolyline: Polyline,
    offset: number,
  ): Polyline {
    return Polyline.mkClosedFromPoints(
      ConvexHull.CalculateConvexHull(
        InteractiveObstacleCalculator.BisectorPoints(tightPolyline, offset),
      ),
    )
  }
  static CreateRectNodeOfPolyline(
    polyline: Polyline,
  ): RectangleNode<Polyline, Point> {
    return mkRectangleNode<Polyline, Point>(
      polyline,
      (<ICurve>polyline).boundingBox,
    )
  }

  static CalculateHierarchy(
    polylines: Array<Polyline>,
  ): RectangleNode<Polyline, Point> {
    const rectNodes = polylines.map((polyline) =>
      InteractiveObstacleCalculator.CreateRectNodeOfPolyline(polyline),
    )

    return CreateRectangleNodeOnListOfNodes(rectNodes)
  }
  static RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(
    tightObstacleSet: Set<Polyline>,
  ): RectangleNode<Polyline, Point> {
    let hierarchy = InteractiveObstacleCalculator.CalculateHierarchy(
      Array.from(tightObstacleSet),
    )
    let overlappingPairSet: Set<[Polyline, Polyline]>
    while (
      (overlappingPairSet =
        InteractiveObstacleCalculator.GetOverlappedPairSet(hierarchy)).size > 0
    ) {
      hierarchy =
        InteractiveObstacleCalculator.ReplaceTightObstaclesWithConvexHulls(
          tightObstacleSet,
          Array.from(overlappingPairSet),
        )
    }

    return hierarchy
  }

  static MapToInt<T>(objects: T[]): Map<T, number> {
    const ret = new Map<T, number>()
    for (let i = 0; i < objects.length; i++) {
      ret.set(objects[i], i)
    }

    return ret
  }

  static ReplaceTightObstaclesWithConvexHulls(
    tightObsts: Set<Polyline>,
    overlappingPairSet: Array<[Polyline, Polyline]>,
  ): RectangleNode<Polyline, Point> {
    const overlapping = new Set<Polyline>()
    for (const pair of overlappingPairSet) {
      overlapping.add(pair[0])
      overlapping.add(pair[1])
    }

    const intToPoly = Array.from(overlapping)
    const polyToInt = InteractiveObstacleCalculator.MapToInt(intToPoly)
    const graph = mkGraphOnEdgesArray(
      Array.from(overlappingPairSet).map(
        (pair) => new IntPair(polyToInt.get(pair[0]), polyToInt.get(pair[1])),
      ),
    )
    const connectedComponents = GetConnectedComponents(graph)
    for (const component of connectedComponents) {
      const polys = component.map((i) => intToPoly[i])
      const points = from(polys).selectMany((p) => Array.from(p.points()))
      const convexHull = ConvexHull.createConvexHullAsClosedPolyline(points)
      for (const poly of polys) {
        tightObsts.delete(poly)
      }

      tightObsts.add(convexHull)
    }

    return InteractiveObstacleCalculator.CalculateHierarchy(
      Array.from(tightObsts),
    )
  }

  static OneCurveLiesInsideOfOther(polyA: ICurve, polyB: ICurve): boolean {
    Assert.assert(
      !Curve.CurvesIntersect(polyA, polyB),
      'The curves should not intersect',
    )
    return (
      Curve.PointRelativeToCurveLocation(polyA.start, polyB) !=
        PointLocation.Outside ||
      Curve.PointRelativeToCurveLocation(polyB.start, polyA) !=
        PointLocation.Outside
    )
  }

  static PolylinesIntersect(a: Polyline, b: Polyline): boolean {
    const ret =
      Curve.CurvesIntersect(a, b) ||
      InteractiveObstacleCalculator.OneCurveLiesInsideOfOther(a, b)
    return ret
  }
  static GetOverlappedPairSet(
    rootOfObstacleHierarchy: RectangleNode<Polyline, Point>,
  ): Set<[Polyline, Polyline]> {
    const overlappingPairSet = new Set<[Polyline, Polyline]>()
    CrossRectangleNodesSameType(
      rootOfObstacleHierarchy,
      rootOfObstacleHierarchy,
      (a, b) => {
        if (InteractiveObstacleCalculator.PolylinesIntersect(a, b)) {
          overlappingPairSet.add([a, b])
        }
      },
    )
    return overlappingPairSet
  }
  static BisectorPoints(tightPolyline: Polyline, offset: number): Array<Point> {
    const ret: Array<Point> = new Array<Point>()
    for (
      let pp: PolylinePoint = tightPolyline.startPoint;
      pp != null;
      pp = pp.next
    ) {
      const t = {skip: false}
      const currentSticking: Point =
        InteractiveObstacleCalculator.GetStickingVertexOnBisector(pp, offset, t)
      if (!t.skip) {
        ret.push(currentSticking)
      }
    }

    return ret
  }

  static GetStickingVertexOnBisector(
    pp: PolylinePoint,
    p: number,
    t: {skip: boolean},
  ): Point {
    const u: Point = pp.polyline.prev(pp).point
    const v: Point = pp.point
    const w: Point = pp.polyline.next(pp).point
    let z = v.sub(u).normalize().add(v.sub(w).normalize())
    const zLen = z.length
    if (zLen < GeomConstants.tolerance) {
      t.skip = true
    } else {
      t.skip = false
      z = z.div(zLen)
    }

    return z.mul(p).add(v)
  }
  static LooseDistCoefficient = 2.1
  static FindMaxPaddingForTightPolyline(
    hierarchy: RectangleNode<Polyline, Point>,
    polyline: Polyline,
    desiredPadding: number,
  ): number {
    let dist = desiredPadding
    const polygon = new Polygon(polyline)
    const boundingBox = polyline.boundingBox.clone()
    boundingBox.pad(2 * desiredPadding)
    for (const poly of from(
      hierarchy.GetNodeItemsIntersectingRectangle(boundingBox),
    ).where((p) => p != polyline)) {
      const separation = Polygon.Distance(polygon, new Polygon(poly)).dist
      dist = Math.min(
        dist,
        separation / InteractiveObstacleCalculator.LooseDistCoefficient,
      )
    }

    return dist
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
      /*Assert.assert(a != undefined)*/
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
    /*Assert.assert(
      Point.getTriangleOrientation(
        poly.start,
        poly.startPoint.next.point,
        poly.startPoint.next.next.point,
      ) == TriangleOrientation.Clockwise,
      'Unpadded polyline is not clockwise',
    )*/
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
        Polyline.mkClosedFromPoints(
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
        Polyline.mkClosedFromPoints(
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
          Polyline.mkClosedFromPoints(
            Array.from(ConvexHull.CalculateConvexHull(poly.points())),
          ),
          padding,
        )
      }
    }

    /*Assert.assert(
      Point.getTriangleOrientation(
        ret.start,
        ret.startPoint.next.point,
        ret.startPoint.next.next.point,
      ) != TriangleOrientation.Counterclockwise,
      'Padded polyline is counterclockwise',
    )*/
    ret.closed = true
    return ret
  }
}
