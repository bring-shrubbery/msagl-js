﻿//  Basic geomedge router for producing straight edges.

import {from, IEnumerable} from 'linq-to-typescript'
import {GeomGraph} from '../..'
import {Arrowhead} from '../layout/core/arrowhead'
import {EdgeGeometry} from '../layout/core/edgeGeometry'
import {GeomEdge} from '../layout/core/geomEdge'
import {RelativeFloatingPort} from '../layout/core/relativeFloatingPort'
import {CornerSite} from '../math/geometry/cornerSite'
import {Curve} from '../math/geometry/curve'
import {GeomConstants} from '../math/geometry/geomConstants'
import {ICurve} from '../math/geometry/icurve'
import {IntersectionInfo} from '../math/geometry/intersectionInfo'
import {LineSegment} from '../math/geometry/lineSegment'
import {Point} from '../math/geometry/point'
import {Rectangle} from '../math/geometry/rectangle'
import {SmoothedPolyline} from '../math/geometry/smoothedPolyline'
import {Algorithm} from '../utils/algorithm'
import {SplineRouter} from './splineRouter'

export class StraightLineEdges extends Algorithm {
  private edges: IEnumerable<GeomEdge>

  private padding: number

  //  Constructs a basic straight geomedge router.
  public constructor(edges: IEnumerable<GeomEdge>, padding: number) {
    super(null)
    this.edges = edges
    this.padding = padding
  }

  //  Executes the algorithm.
  run() {
    SplineRouter.CreatePortsIfNeeded(this.edges)
    for (const geomedge of this.edges) {
      StraightLineEdges.RouteEdge(geomedge, this.padding)
    }
  }

  //  populate the geometry including curve and arrowhead positioning for the given geomedge using simple
  //  straight line routing style.  Self edges will be drawn as a loop, padding is used to control the
  //  size of the loop.
  static RouteEdge(geomedge: GeomEdge, padding: number) {
    const eg = geomedge.edgeGeometry
    if (eg.sourcePort == null) {
      eg.sourcePort = RelativeFloatingPort.mk(
        () => geomedge.source.boundaryCurve,
        () => geomedge.source.center,
      )
    }

    if (eg.targetPort == null) {
      eg.targetPort = RelativeFloatingPort.mk(
        () => geomedge.target.boundaryCurve,
        () => geomedge.target.center,
      )
    }

    if (!StraightLineEdges.ContainmentLoop(eg, padding)) {
      eg.curve = StraightLineEdges.GetEdgeLine(geomedge)
    }

    Arrowhead.trimSplineAndCalculateArrowheadsII(
      eg,
      eg.sourcePort.Curve,
      eg.targetPort.Curve,
      geomedge.curve,
      false,
    )
  }

  static ContainmentLoop(eg: EdgeGeometry, padding: number): boolean {
    const sourceCurve = eg.sourcePort.Curve
    const targetCurve = eg.targetPort.Curve
    if (sourceCurve == null || targetCurve == null) {
      return false
    }

    const targetBox: Rectangle = sourceCurve.boundingBox
    const sourceBox: Rectangle = targetCurve.boundingBox
    const targetInSource: boolean = targetBox.containsRect(sourceBox)
    const sourceInTarget: boolean =
      !targetInSource && sourceBox.containsRect(targetBox)
    if (targetInSource || sourceInTarget) {
      eg.curve = StraightLineEdges.CreateLoop(
        targetBox,
        sourceBox,
        sourceInTarget,
        padding,
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
    const center = sourceBox.center
    const closestPoint = StraightLineEdges.FindClosestPointOnBoxBoundary(
      sourceBox.center,
      targetBox,
    )
    let dir = closestPoint.sub(center)
    const vert = Math.abs(dir.x) < GeomConstants.distanceEpsilon
    const maxWidth =
      (vert
        ? Math.min(center.y - targetBox.bottom, targetBox.top - center.y)
        : Math.min(center.x - targetBox.left, targetBox.right - center.x)) / 2 //divide over 2 to not miss the rect

    const width = Math.min(howMuchToStickOut, maxWidth)
    if (dir.length <= GeomConstants.distanceEpsilon) {
      dir = new Point(1, 0)
    }

    const hookDir = dir.normalize()
    const hookPerp = hookDir.rotate(Math.PI / 2)
    const p1 = closestPoint.add(hookDir.mul(howMuchToStickOut))
    const p2 = p1.add(hookPerp.mul(width))
    const p3 = closestPoint.add(hookPerp.mul(width))
    const end = center.add(hookPerp.mul(width))
    const smoothedPoly = reverse
      ? SmoothedPolyline.mkFromPoints([end, p3, p2, p1, closestPoint, center])
      : SmoothedPolyline.mkFromPoints([center, closestPoint, p1, p2, p3, end])
    return smoothedPoly.createCurve()
  }

  static FindClosestPointOnBoxBoundary(c: Point, targetBox: Rectangle): Point {
    const x =
      c.x - targetBox.left < targetBox.right - c.x
        ? targetBox.left
        : targetBox.right
    const y =
      c.y - targetBox.bottom < targetBox.top - c.y
        ? targetBox.bottom
        : targetBox.top
    return Math.abs(x - c.x) < Math.abs(y - c.y)
      ? new Point(x, c.y)
      : new Point(c.x, y)
  }

  //  Returns a line segment for the given geomedge.
  static GetEdgeLine(geomedge: GeomEdge): LineSegment {
    let sourcePoint: Point
    let sourceBox: ICurve
    if (geomedge.sourcePort == null) {
      sourcePoint = geomedge.source.center
      sourceBox = geomedge.source.boundaryCurve
    } else {
      sourcePoint = geomedge.sourcePort.Location
      sourceBox = geomedge.sourcePort.Curve
    }

    let targetPoint: Point
    let targetBox: ICurve
    if (geomedge.targetPort == null) {
      targetPoint = geomedge.target.center
      targetBox = geomedge.target.boundaryCurve
    } else {
      targetPoint = geomedge.targetPort.Location
      targetBox = geomedge.targetPort.Curve
    }

    let line: LineSegment = LineSegment.mkPP(sourcePoint, targetPoint)
    let intersects = Curve.getAllIntersections(sourceBox, line, false)
    if (intersects.length > 0) {
      let trimmedLine = <LineSegment>line.trim(intersects[0].par1, 1)
      if (trimmedLine != null) {
        line = trimmedLine
        intersects = Curve.getAllIntersections(targetBox, line, false)
        if (intersects.length > 0) {
          trimmedLine = <LineSegment>line.trim(0, intersects[0].par1)
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
    const a = geomedge.source.center
    const b = geomedge.target.center
    if (geomedge.source == geomedge.target) {
      const dx = 2 / (3 * geomedge.source.boundaryCurve.boundingBox.width)
      const dy = geomedge.source.boundingBox.height / 4
      geomedge.underlyingPolyline = StraightLineEdges.CreateUnderlyingPolylineForSelfEdge(
        a,
        dx,
        dy,
      )
      geomedge.curve = geomedge.underlyingPolyline.createCurve()
    } else {
      geomedge.underlyingPolyline = SmoothedPolyline.mkFromPoints([a, b])
      geomedge.curve = geomedge.underlyingPolyline.createCurve()
    }

    Arrowhead.trimSplineAndCalculateArrowheadsII(
      geomedge.edgeGeometry,
      geomedge.source.boundaryCurve,
      geomedge.target.boundaryCurve,
      geomedge.curve,
      false,
    )
  }

  private static CreateUnderlyingPolylineForSelfEdge(
    p0: Point,
    dx: number,
    dy: number,
  ): SmoothedPolyline {
    const p1 = p0.add(new Point(0, dy))
    const p2 = p0.add(new Point(dx, dy))
    const p3 = p0.add(new Point(dx, dy * -1))
    const p4 = p0.add(new Point(0, dy * -1))
    let site = CornerSite.mkSiteP(p0)
    const polyline = new SmoothedPolyline(site)
    site = CornerSite.mkSiteSP(site, p1)
    site = CornerSite.mkSiteSP(site, p2)
    site = CornerSite.mkSiteSP(site, p3)
    site = CornerSite.mkSiteSP(site, p4)
    CornerSite.mkSiteSP(site, p0)
    return polyline
  }

  static SetStraightLineEdgesWithUnderlyingPolylines(graph: GeomGraph) {
    SplineRouter.CreatePortsIfNeeded(from(graph.edges()))
    for (const geomedge of graph.edges()) {
      StraightLineEdges.CreateSimpleEdgeCurveWithUnderlyingPolyline(geomedge)
    }
  }
}
