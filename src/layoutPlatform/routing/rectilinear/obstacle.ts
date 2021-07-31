import {Port} from '../../../../layoutPlatform/layout/core/port'
import {CompassVector} from '../../../../layoutPlatform/math/geometry/compassVector'
import {Curve} from '../../../../layoutPlatform/math/geometry/curve'
import {GeomConstants} from '../../../../layoutPlatform/math/geometry/geomConstants'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {Polyline} from '../../../../layoutPlatform/math/geometry/polyline'
import {PolylinePoint} from '../../../../layoutPlatform/math/geometry/polylinePoint'
import {Assert} from '../../../../layoutPlatform/utils/assert'
import {InteractiveObstacleCalculator} from '../interactiveObstacleCalculator'
import {Shape} from '../shape'

export class Obstacle {
  private static readonly FirstSentinelOrdinal = 1

  private static readonly FirstNonSentinelOrdinal = 10
  PaddedPolyline: Polyline
  IsRectangle: boolean
  InputShape: Shape
  Ports: Set<Port>

  ///  <summary>
  ///  Only public to make the compiler happy about the "where TPoly : new" constraint.
  ///  Will be populated by caller.
  ///  </summary>
  public constructor(shape: Shape, makeRect: boolean, padding: number) {
    if (makeRect) {
      const paddedBox = shape.BoundingBox.clone()
      paddedBox.pad(padding)
      this.PaddedPolyline = Curve.polyFromBox(paddedBox)
    } else {
      this.PaddedPolyline = InteractiveObstacleCalculator.PaddedPolylineBoundaryOfNode(
        shape.BoundaryCurve,
        padding,
      )
    }

    Obstacle.RoundVertices(this.PaddedPolyline)
    this.IsRectangle = this.IsPolylineRectangle()

    this.InputShape = shape
    this.Ports = new Set<Port>(this.InputShape.Ports)
  }

  private IsPolylineRectangle(): boolean {
    if (this.PaddedPolyline.count != 4) {
      return false
    }

    let ppt = this.PaddedPolyline.startPoint
    let nextPpt = ppt.nextOnPolyline
    let dir = CompassVector.VectorDirectionPP(ppt.point, nextPpt.point)
    if (!CompassVector.IsPureDirection(dir)) {
      return false
    }

    for (; ppt != this.PaddedPolyline.startPoint; ) {
      ppt = nextPpt
      nextPpt = ppt.nextOnPolyline
      const nextDir = CompassVector.DirectionsFromPointToPoint(
        ppt.point,
        nextPpt.point,
      )
      //  We know the polyline is clockwise.
      if (nextDir != CompassVector.RotateRight(dir)) {
        return false
      }

      dir = nextDir
    }

    return true
  }
  private static RoundVertices(polyline: Polyline) {
    //  Following creation of the padded border, round off the vertices for consistency
    //  in later operations (intersections and event ordering).
    let ppt: PolylinePoint = polyline.startPoint
    for (; ppt != polyline.startPoint; ) {
      ppt.point = GeomConstants.RoundPoint(ppt.point)
      ppt = ppt.nextOnPolyline
    }

    RemoveCloseAndCollinearVerticesInPlace(polyline)
    //  We've modified the points so the BoundingBox may have changed; force it to be recalculated.
    polyline.requireInit()
    //  Verify that the polyline is still clockwise.
    Assert.assert(
      polyline.isClockwise(),
      'Polyline is not clockwise after RoundVertices',
    )
  }
  static RemoveCloseAndCollinearVerticesInPlace(polyline: Polyline): Polyline {
    const epsilon = GeomConstants.intersectionEpsilon * 10
    for (
      let pp: PolylinePoint = polyline.startPoint.next;
      pp != null;
      pp = pp.next
    ) {
      if (Point.close(pp.prev.point, pp.point, epsilon)) {
        if (pp.next == null) {
          polyline.RemoveEndPoint()
        } else {
          pp.prev.next = pp.next
          pp.next.prev = pp.prev
        }
      }
    }

    if (Point.close(polyline.start, polyline.end, epsilon)) {
      polyline.RemoveStartPoint()
    }

    InteractiveEdgeRouter.RemoveCollinearVertices(polyline)
    if (
      polyline.endPoint.prev != null &&
      print.GetTriangleOrientation(
        polyline.endPoint.prev.Point,
        polyline.end,
        polyline.start,
      ) == TriangleOrientation.Collinear
    ) {
      polyline.RemoveEndPoint()
    }

    if (
      polyline.startPoint.next != null &&
      print.GetTriangleOrientation(
        polyline.end,
        polyline.start,
        polyline.startPoint.next.Point,
      ) == TriangleOrientation.Collinear
    ) {
      polyline.RemoveStartPoint()
    }

    return polyline
  }
}
