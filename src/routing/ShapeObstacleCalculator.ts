﻿//  The class calculates obstacles under the shape.
//  We assume that the boundaries are not set for the shape children yet

import {Point} from '..'
import {Curve, PointLocation} from '../math/geometry'
import {ConvexHull} from '../math/geometry/convexHull'
import {Polyline} from '../math/geometry/polyline'
import {
  CreateRectangleNodeOnEnumeration,
  mkRectangleNode,
  RectangleNode,
} from '../math/geometry/RTree/RectangleNode'
import {CrossRectangleNodes} from '../math/geometry/RTree/RectangleNodeUtils'
import {flatMap} from '../utils/setOperations'
import {InteractiveObstacleCalculator} from './interactiveObstacleCalculator'
import {Shape} from './shape'
import {TightLooseCouple} from './TightLooseCouple'

export class ShapeObstacleCalculator {
  tightHierarchy: RectangleNode<Polyline, Point>

  coupleHierarchy: RectangleNode<TightLooseCouple, Point>

  RootOfLooseHierarchy: RectangleNode<Shape, Point>

  constructor(
    shape: Shape,
    tightPadding: number,
    loosePadding: number,
    shapeToTightLooseCouples: Map<Shape, TightLooseCouple>,
  ) {
    this.MainShape = shape
    this.TightPadding = tightPadding
    this.LoosePadding = loosePadding
    this.ShapesToTightLooseCouples = shapeToTightLooseCouples
  }

  ShapesToTightLooseCouples: Map<Shape, TightLooseCouple>
  TightPadding: number

  LoosePadding: number
  MainShape: Shape
  OverlapsDetected: boolean

  Calculate() {
    if (this.MainShape.Children.length == 0) {
      return
    }

    this.CreateTightObstacles()
    this.CreateTigthLooseCouples()
    this.FillTheMapOfShapeToTightLooseCouples()
  }

  FillTheMapOfShapeToTightLooseCouples() {
    const childrenShapeHierarchy = CreateRectangleNodeOnEnumeration(
      this.MainShape.Children.map((s) => mkRectangleNode(s, s.BoundingBox)),
    )
    CrossRectangleNodes(
      childrenShapeHierarchy,
      this.coupleHierarchy,
      this.TryMapShapeToTightLooseCouple.bind(this),
    )
  }

  TryMapShapeToTightLooseCouple(
    shape: Shape,
    tightLooseCouple: TightLooseCouple,
  ) {
    if (
      ShapeObstacleCalculator.ShapeIsInsideOfPoly(
        shape,
        tightLooseCouple.TightPolyline,
      )
    ) {
      this.ShapesToTightLooseCouples.set(shape, tightLooseCouple)
    }
  }

  //  this test is valid in our situation where the tight polylines are disjoint and the shape can cross only one of them
  static ShapeIsInsideOfPoly(shape: Shape, tightPolyline: Polyline): boolean {
    return (
      Curve.PointRelativeToCurveLocation(
        shape.BoundaryCurve.start,
        tightPolyline,
      ) == PointLocation.Inside
    )
  }

  CreateTigthLooseCouples() {
    const couples = new Array<TightLooseCouple>()
    for (const tightPolyline of this.tightHierarchy.GetAllLeaves()) {
      const distance =
        InteractiveObstacleCalculator.FindMaxPaddingForTightPolyline(
          this.tightHierarchy,
          tightPolyline,
          this.LoosePadding,
        )
      const loosePoly =
        InteractiveObstacleCalculator.LoosePolylineWithFewCorners(
          tightPolyline,
          distance,
        )
      couples.push(
        TightLooseCouple.mk(tightPolyline, new Shape(loosePoly), distance),
      )
    }

    this.coupleHierarchy = CreateRectangleNodeOnEnumeration(
      couples.map((c) =>
        mkRectangleNode<TightLooseCouple, Point>(
          c,
          c.TightPolyline.boundingBox,
        ),
      ),
    )
  }

  CreateTightObstacles() {
    const tightObstacles = new Set<Polyline>(
      this.MainShape.Children.map(this.InitialTightPolyline.bind(this)),
    )
    const initialNumberOfTightObstacles: number = tightObstacles.size
    this.tightHierarchy =
      InteractiveObstacleCalculator.RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(
        tightObstacles,
      )
    this.OverlapsDetected = initialNumberOfTightObstacles > tightObstacles.size
  }

  InitialTightPolyline(shape: Shape): Polyline {
    const poly = InteractiveObstacleCalculator.PaddedPolylineBoundaryOfNode(
      shape.BoundaryCurve,
      this.TightPadding,
    )
    const stickingPointsArray = flatMap(
      this.LoosePolylinesUnderShape(shape),
      (p) => Array.from(p),
    ).filter(
      (p) =>
        Curve.PointRelativeToCurveLocation(p, poly) == PointLocation.Outside,
    )

    if (stickingPointsArray.length <= 0) {
      return poly
    }
    const pts = Array.from(poly).concat(stickingPointsArray)
    return Polyline.mkClosedFromPoints(ConvexHull.CalculateConvexHull(pts))
  }

  LoosePolylinesUnderShape(shape: Shape): Array<Polyline> {
    return shape.Children.map(
      (child) =>
        <Polyline>(
          this.ShapesToTightLooseCouples.get(child).LooseShape.BoundaryCurve
        ),
    )
  }
}
