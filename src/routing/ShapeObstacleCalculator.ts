//  The class calculates obstacles under the shape.
//  We assume that the boundaries are not set for the shape children yet

import { IEnumerable } from 'linq-to-typescript'
import { Dictionary } from 'lodash'
import { RectangleNode } from '../core/geometry/RTree/RectangleNode'
import { Curve } from '../math/geometry/curve'
import { Polyline } from '../math/geometry/polyline'
import { Shape } from './Shape'
import { TightLooseCouple } from './TightLooseCouple'

//  </summary>
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
    MainShape = shape
    TightPadding = tightPadding
    LoosePadding = loosePadding
    ShapesToTightLooseCouples = shapeToTightLooseCouples
  }

  ShapesToTightLooseCouples: Map<Shape, TightLooseCouple>
  TightPadding: number

  LoosePadding: number
  MainShape: Shape
  OverlapsDetected: boolean

  private /* internal */ Calculate() {
    if (this.MainShape.Children.Count() == 0) {
      return
    }

    this.CreateTightObstacles()
    this.CreateTigthLooseCouples()
    this.FillTheMapOfShapeToTightLooseCouples()
  }
  /*
    FillTheMapOfShapeToTightLooseCouples() {
      let childrenShapeHierarchy = RectangleNode.CreateRectangleNodeOnEnumeration(this.MainShape.Children.Select(() => { }, new RectangleNode<Shape, Point>(s, s.BoundingBox)));
      RectangleNodeUtils.CrossRectangleNodes(childrenShapeHierarchy, this.coupleHierarchy, TryMapShapeToTightLooseCouple);
    }
  
    TryMapShapeToTightLooseCouple(shape: Shape, tightLooseCouple: TightLooseCouple) {
      if (ShapeObstacleCalculator.ShapeIsInsideOfPoly(shape, tightLooseCouple.TightPolyline)) {
        this.ShapesToTightLooseCouples[shape] = tightLooseCouple;
      }
  
      // #if(TEST_MSAGL)
      // tightLooseCouple.LooseShape.UserData = ((<string>(shape.UserData)) + "x");
      // #endif
    }
  
    //  <summary>
    //  this test is valid in our situation were the tight polylines are disjoint and the shape can cross only one of them
    //  </summary>
    //  <param name="shape"></param>
    //  <param name="tightPolyline"></param>
    //  <returns></returns>
    static ShapeIsInsideOfPoly(shape: Shape, tightPolyline: Polyline): boolean {
      return (Curve.PointRelativeToCurveLocation(shape.BoundaryCurve.Start, tightPolyline) == PointLocation.Inside);
    }
  
    CreateTigthLooseCouples() {
      let couples = new List<TightLooseCouple>();
      for (let tightPolyline of this.tightHierarchy.GetAllLeaves()) {
        let distance = InteractiveObstacleCalculator.FindMaxPaddingForTightPolyline(this.tightHierarchy, tightPolyline, this.LoosePadding);
        let loosePoly = InteractiveObstacleCalculator.LoosePolylineWithFewCorners(tightPolyline, distance);
        couples.Add(new TightLooseCouple(tightPolyline, new Shape(loosePoly), distance));
      }
  
      this.coupleHierarchy = RectangleNode.CreateRectangleNodeOnEnumeration(couples.Select(() => { }, new RectangleNode<TightLooseCouple, Point>(c, c.TightPolyline.BoundingBox)));
    }
  
    CreateTightObstacles() {
      let tightObstacles = new Set<Polyline>(this.MainShape.Children.Select(InitialTightPolyline));
      let initialNumberOfTightObstacles: number = tightObstacles.Count;
      this.tightHierarchy = InteractiveObstacleCalculator.RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(tightObstacles);
      this.OverlapsDetected = (initialNumberOfTightObstacles > tightObstacles.Count);
    }
  
    InitialTightPolyline(shape: Shape): Polyline {
      let poly = InteractiveObstacleCalculator.PaddedPolylineBoundaryOfNode(shape.BoundaryCurve, this.TightPadding);
      let stickingPointsArray = this.LoosePolylinesUnderShape(shape).SelectMany(() => { }, l).Where(() => { }, (Curve.PointRelativeToCurveLocation(p, poly) == PointLocation.Outside)).ToArray();
      if ((stickingPointsArray.length <= 0)) {
        return poly;
      }
  
      return new Polyline(ConvexHull.CalculateConvexHull(poly.Concat(stickingPointsArray)));
    }
  
    LoosePolylinesUnderShape(shape: Shape): IEnumerable<Polyline> {
      return shape.Children.Select(() => { }, (<Polyline>(this.ShapesToTightLooseCouples[child].LooseShape.BoundaryCurve)));
    }*/
}
