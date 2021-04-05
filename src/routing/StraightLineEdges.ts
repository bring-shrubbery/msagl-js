//  Basic geomedge router for producing straight edges.

import { IEnumerable } from 'linq-to-typescript'
import { EdgeGeometry } from '../layout/core/edgeGeometry'
import { GeomEdge } from '../layout/core/geomEdge'
import { GeomGraph } from '../layout/core/GeomGraph'
import { Curve } from '../math/geometry/curve'
import { ICurve } from '../math/geometry/icurve'
import { IntersectionInfo } from '../math/geometry/intersectionInfo'
import { LineSegment } from '../math/geometry/lineSegment'
import { Point } from '../math/geometry/point'
import { Rectangle } from '../math/geometry/rectangle'
import { SmoothedPolyline } from '../math/geometry/smoothedPolyline'
import { Algorithm } from '../utils/algorithm'
import { SplineRouter } from './SplineRouter'

export class StraightLineEdges extends Algorithm {
  private edges: IEnumerable<GeomEdge>

  private padding: number

  //  Constructs a basic straight geomedge router.
  public constructor(edges: IEnumerable<GeomEdge>, padding: number) {
    super(null)
    this.edges = this.edges
    this.padding = this.padding
  }

  //  Executes the algorithm.
  protected run() {
    SplineRouter.CreatePortsIfNeeded(this.edges)
    for (const geomedge: GeomEdge of this.edges) {
      StraightLineEdges.RouteEdge(geomedge, this.padding)
    }
  }

  //  populate the geometry including curve and arrowhead positioning for the given geomedge using simple
  //  straight line routing style.  Self edges will be drawn as a loop, padding is used to control the
  //  size of the loop.
  static RouteEdge(geomedge: GeomEdge, padding: number) {
    const eg = geomedge.edgeGeometry
    if (eg.SourcePort == null) {
      new RelativeFloatingPort(
        (eg) => eg.Source.BoundaryCurve,
        (eg) => eg.Source.Center,
      )
    }

    if (eg.TargetPort == null) {
      new RelativeFloatingPort(
        (eg) => eg.Target.BoundaryCurve,
        (eg) => eg.Target.Center,
      )
    }

    if (!StraightLineEdges.ContainmentLoop(eg, this.padding)) {
      eg.Curve = StraightLineEdges.GetEdgeLine(geomedge)
    }

    Arrowheads.TrimSplineAndCalculateArrowheads(
      eg,
      eg.SourcePort.Curve,
      eg.TargetPort.Curve,
      geomedge.Curve,
      false,
      false,
    )
  }

  static ContainmentLoop(eg: EdgeGeometry, padding: number): boolean {
    const sourceCurve = eg.SourcePort.Curve
    const targetCurve = eg.TargetPort.Curve
    if (sourceCurve == null || targetCurve == null) {
      return false
    }

    const targetBox: Rectangle = sourceCurve.BoundingBox
    const sourceBox: Rectangle = targetCurve.BoundingBox
    const targetInSource: boolean = targetBox.Contains(sourceBox)
    const sourceInTarget: boolean =
      !targetInSource && sourceBox.Contains(targetBox)
    if (targetInSource || sourceInTarget) {
      eg.Curve = StraightLineEdges.CreateLoop(
        targetBox,
        sourceBox,
        sourceInTarget,
        this.padding,
      )
      return true
    }

    return false
  }

  static CreateLoop(
    targetBox: Rectangle,
    sourceBox: Rectangle,
    sourceContainsTarget: boolean,
    padding: number,
  ): Curve {
    return sourceContainsTarget
      ? StraightLineEdges.CreateLoop_(targetBox, sourceBox, padding, false)
      : StraightLineEdges.CreateLoop_(sourceBox, targetBox, padding, true)
  }

  //  creates a loop from sourceBox center to the closest point on the targetBox boundary
  static CreateLoop_(
    sourceBox: Rectangle,
    targetBox: Rectangle,
    howMuchToStickOut: number,
    reverse: boolean,
  ): Curve {
    const center = sourceBox.Center
    const closestPoint = StraightLineEdges.FindClosestPointOnBoxBoundary(
      sourceBox.Center,
      targetBox,
    )
    const dir = closestPoint - center
    const vert = Math.Abs(dir.x) < GeomConstants.distanceEpsilon
    const maxWidth =
      (vert
        ? Math.Min(center.y - targetBox.bottom, targetBox.top - center.y)
        : Math.Min(center.x - targetBox.Left, targetBox.Right - center.x)) / 2 //divide over 2 to not miss the rect

    const width = Math.Min(howMuchToStickOut, maxWidth)
    if (dir.length <= GeomConstants.distanceEpsilon) {
      dir = new Point(1, 0)
    }

    const hookDir = dir.Normalize()
    const hookPerp = hookDir.Rotate(Math.PI / 2)
    const p1 = closestPoint + hookDir * howMuchToStickOut
    const p2 = p1 + hookPerp * width
    const p3 = closestPoint + hookPerp * width
    const end = center + hookPerp * width
    const smoothedPoly = reverse
      ? SmoothedPolyline.FromPoints([end, p3, p2, p1, closestPoint, center])
      : SmoothedPolyline.FromPoints([center, closestPoint, p1, p2, p3, end])
    return smoothedPoly.CreateCurve()
  }

  static FindClosestPointOnBoxBoundary(c: Point, targetBox: Rectangle): Point {
    const x =
      c.x - targetBox.Left < targetBox.Right - c.x
        ? targetBox.Left
        : targetBox.Right
    const y =
      c.y - targetBox.bottom < targetBox.top - c.y
        ? targetBox.bottom
        : targetBox.top
    return Math.Abs(x - c.x) < Math.Abs(y - c.y)
      ? new Point(x, c.y)
      : new Point(c.x, y)
  }

  //  Returns a line segment for the given geomedge.
  public static GetEdgeLine(geomedge: GeomEdge): LineSegment {
    ValidateArg.IsNotNull(geomedge, 'geomedge')
    const sourcePoint: Point
    const sourceBox: ICurve
    if (geomedge.SourcePort == null) {
      sourcePoint = geomedge.Source.Center
      sourceBox = geomedge.Source.BoundaryCurve
    } else {
      sourcePoint = geomedge.SourcePort.Location
      sourceBox = geomedge.SourcePort.Curve
    }

    const targetPoint: Point
    const targetBox: ICurve
    if (geomedge.TargetPort == null) {
      targetPoint = geomedge.Target.Center
      targetBox = geomedge.Target.BoundaryCurve
    } else {
      targetPoint = geomedge.TargetPort.Location
      targetBox = geomedge.TargetPort.Curve
    }

    const line: LineSegment = new LineSegment(sourcePoint, targetPoint)
    const intersects: IList<IntersectionInfo> = Curve.GetAllIntersections(
      sourceBox,
      line,
      false,
    )
    if (intersects.Count > 0) {
      const trimmedLine = <LineSegment>line.Trim(intersects[0].Par1, 1)
      if (trimmedLine != null) {
        line = trimmedLine
        intersects = Curve.GetAllIntersections(targetBox, line, false)
        if (intersects.Count > 0) {
          trimmedLine = <LineSegment>line.Trim(0, intersects[0].Par1)
          if (trimmedLine != null) {
            line = trimmedLine
          }
        }
      }
    }

    return line
  }

  //  creates an geomedge curve based only on the source and target geometry
  public static CreateSimpleEdgeCurveWithUnderlyingPolyline(
    geomedge: GeomEdge,
  ) {
    ValidateArg.IsNotNull(geomedge, 'geomedge')
    const a = geomedge.Source.Center
    const b = geomedge.Target.Center
    if (geomedge.Source == geomedge.Target) {
      const dx = 2 / (3 * geomedge.Source.BoundaryCurve.BoundingBox.Width)
      const dy = geomedge.Source.BoundingBox.Height / 4
      geomedge.UnderlyingPolyline = StraightLineEdges.CreateUnderlyingPolylineForSelfEdge(
        a,
        dx,
        dy,
      )
      geomedge.Curve = geomedge.UnderlyingPolyline.CreateCurve()
    } else {
      geomedge.UnderlyingPolyline = SmoothedPolyline.FromPoints([a, b])
      geomedge.Curve = geomedge.UnderlyingPolyline.CreateCurve()
    }

    Arrowheads.TrimSplineAndCalculateArrowheads(
      geomedge.EdgeGeometry,
      geomedge.Source.BoundaryCurve,
      geomedge.Target.BoundaryCurve,
      geomedge.Curve,
      false,
      false,
    )
  }

  private static /*  */ CreateUnderlyingPolylineForSelfEdge(
    p0: Point,
    dx: number,
    dy: number,
  ): SmoothedPolyline {
    const p1 = p0 + new Point(0, dy)
    const p2 = p0 + new Point(dx, dy)
    const p3 = p0 + new Point(dx, dy * -1)
    const p4 = p0 + new Point(0, dy * -1)
    let site = new Site(p0)
    const polyline = new SmoothedPolyline(site)
    site = new Site(site, p1)
    site = new Site(site, p2)
    site = new Site(site, p3)
    site = new Site(site, p4)
    new Site(site, p0)
    return polyline
  }

  static SetStraightLineEdgesWithUnderlyingPolylines(graph: GeomGraph) {
    SplineRouter.CreatePortsIfNeeded(graph.Edges)
    for (const geomedge: GeomEdge of graph.Edges) {
      StraightLineEdges.CreateSimpleEdgeCurveWithUnderlyingPolyline(geomedge)
    }
  }
}
