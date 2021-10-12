///  The class is looking for the free space around AxisEdges

import {IEnumerable, from} from 'linq-to-typescript'
import {Point} from '../../../..'
import {CompassVector} from '../../../math/geometry/compassVector'
import {DebugCurve} from '../../../math/geometry/debugCurve'
import {Direction} from '../../../math/geometry/direction'
import {GeomConstants} from '../../../math/geometry/geomConstants'
import {Polyline} from '../../../math/geometry/polyline'
import {PolylinePoint} from '../../../math/geometry/polylinePoint'
import {RBNode} from '../../../structs/RBTree/rbNode'
import {RBTree} from '../../../structs/RBTree/rbTree'
// import {Assert} from '../../../utils/assert'
import {compareNumbers} from '../../../utils/compare'
import {LeftObstacleSide} from '../../spline/coneSpanner/LeftObstacleSide'
import {LeftVertexEvent} from '../../spline/coneSpanner/LeftVertexEvent'
import {RightObstacleSide} from '../../spline/coneSpanner/RightObstacleSide'
import {RightVertexEvent} from '../../spline/coneSpanner/RightVertexEvent'
import {SweepEvent} from '../../spline/coneSpanner/SweepEvent'
import {VertexEvent} from '../../spline/coneSpanner/VertexEvent'
import {LineSweeperBase} from '../../visibility/LineSweeperBase'
import {SegmentBase} from '../../visibility/SegmentBase'
import {AxisEdge} from './AxisEdge'
import {AxisEdgeHighPointEvent} from './AxisEdgeHighPointEvent'
import {AxisEdgeLowPointEvent} from './AxisEdgeLowPointEvent'
import {AxisEdgesContainer} from './AxisEdgesContainer'
import {PathEdge} from './PathEdge'

export class FreeSpaceFinder extends LineSweeperBase {
  static AreaComparisonEpsilon: number = GeomConstants.intersectionEpsilon

  xProjection: (a: Point) => number

  edgeContainersTree: RBTree<AxisEdgesContainer>

  PathOrders: Map<AxisEdge, Array<PathEdge>>

  ///

  ///  <param name="direction"></param>
  ///  <param name="obstacles"></param>
  ///  <param name="axisEdgesToObstaclesTheyOriginatedFrom"></param>
  ///  <param name="pathOrders"></param>
  ///  <param name="axisEdges">edges to find the empty space around</param>
  constructor(
    direction: Direction,
    obstacles: Array<Polyline>,
    axisEdgesToObstaclesTheyOriginatedFrom: Map<AxisEdge, Polyline>,
    pathOrders: Map<AxisEdge, Array<PathEdge>>,
    axisEdges: IEnumerable<AxisEdge>,
  ) {
    super(obstacles, new CompassVector(direction).ToPoint())
    this.DirectionPerp = new CompassVector(direction).Right.ToPoint()
    this.PathOrders = pathOrders
    this.xProjection = direction == Direction.North ? (p) => p.x : (p) => -p.y
    this.edgeContainersTree = new RBTree<AxisEdgesContainer>((a, b) =>
      this.CompareAA(a, b),
    )
    this.SweepPole = CompassVector.VectorDirection(this.SweepDirection)
    /*Assert.assert(CompassVector.IsPureDirection(this.SweepPole))*/
    this.AxisEdges = axisEdges
    this.AxisEdgesToObstaclesTheyOriginatedFrom = axisEdgesToObstaclesTheyOriginatedFrom
  }

  AxisEdgesToObstaclesTheyOriginatedFrom: Map<AxisEdge, Polyline>

  SweepPole: Direction

  //    Array<Path> EdgePaths { get; set; }
  // VisibilityGraph PathVisibilityGraph { get; set; }

  ///  calculates the right offsets

  FindFreeSpace() {
    this.InitTheQueueOfEvents()
    this.ProcessEvents()
    //     ShowAxisEdges();
  }

  ProcessEvents() {
    while (this.EventQueue.Count > 0) {
      this.ProcessEvent(this.EventQueue.Dequeue())
    }
  }

  ProcessEvent(sweepEvent: SweepEvent) {
    if (sweepEvent instanceof VertexEvent) {
      this.ProcessVertexEvent(<VertexEvent>sweepEvent)
    } else {
      this.Z = this.GetZP(sweepEvent.Site)
      if (sweepEvent instanceof AxisEdgeLowPointEvent) {
        this.ProcessLowEdgeEvent(<AxisEdgeLowPointEvent>sweepEvent)
      } else {
        /*Assert.assert(sweepEvent instanceof AxisEdgeHighPointEvent)*/
        this.ProcessHighEdgeEvent(<AxisEdgeHighPointEvent>sweepEvent)
      }
    }
  }

  ProcessHighEdgeEvent(edgeForNudgingHighPointEvent: AxisEdgeHighPointEvent) {
    const edge = edgeForNudgingHighPointEvent.AxisEdge
    this.RemoveEdge(edge)
    this.ConstraintEdgeWithObstaclesAtZ(edge, edge.Target.point)
  }

  ProcessLowEdgeEvent(lowEdgeEvent: AxisEdgeLowPointEvent) {
    const edge = lowEdgeEvent.AxisEdge
    const containerNode = this.GetOrCreateAxisEdgesContainer(edge)
    containerNode.item.AddEdge(edge)
    const prev = this.edgeContainersTree.previous(containerNode)
    if (prev != null) {
      for (const prevEdge of prev.item.edges) {
        for (const ed of containerNode.item.edges) {
          this.TryToAddRightNeighbor(prevEdge, ed)
        }
      }
    }

    const next = this.edgeContainersTree.next(containerNode)
    if (next != null) {
      for (const ed of containerNode.item.Edges) {
        for (const neEdge of next.item.edges) {
          this.TryToAddRightNeighbor(ed, neEdge)
        }
      }
    }

    this.ConstraintEdgeWithObstaclesAtZ(edge, edge.Source.point)
  }

  TryToAddRightNeighbor(leftEdge: AxisEdge, rightEdge: AxisEdge) {
    if (this.ProjectionsOfEdgesOverlap(leftEdge, rightEdge)) {
      leftEdge.AddRightNeighbor(rightEdge)
    }
  }

  ProjectionsOfEdgesOverlap(leftEdge: AxisEdge, rightEdge: AxisEdge): boolean {
    return this.SweepPole == Direction.North
      ? !(
          leftEdge.TargetPoint.y <
            rightEdge.SourcePoint.y - GeomConstants.distanceEpsilon ||
          rightEdge.TargetPoint.y <
            leftEdge.SourcePoint.y - GeomConstants.distanceEpsilon
        )
      : !(
          leftEdge.TargetPoint.x <
            rightEdge.SourcePoint.x - GeomConstants.distanceEpsilon ||
          rightEdge.TargetPoint.x <
            leftEdge.SourcePoint.x - GeomConstants.distanceEpsilon
        )
  }

  // DebShowEdge(edge: AxisEdge, point: Point) {
  //     //  ReSharper restore UnusedMember.Local
  //     //  if (InterestingEdge(edge))
  //     this.ShowEdge(edge, point);
  // }

  // //  ReSharper disable SuggestBaseTypeForParameter
  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // ShowEdge(edge: AxisEdge, point: Point) {
  //     //  ReSharper restore SuggestBaseTypeForParameter
  //     let dd = this.GetObstacleBoundaries("black");
  //     let seg = new DebugCurve(1, "red", new LineSegment(edge.Source.point, edge.Target.point));
  //     LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dd.Concat(new, [));
  //     seg;
  //     new DebugCurve("blue", CurveFactory.CreateEllipse(3, 3, point));
  // }

  GetObstacleBoundaries(color: string): IEnumerable<DebugCurve> {
    return from(this.Obstacles).select((p) =>
      DebugCurve.mkDebugCurveWCI(1, color, p),
    )
  }

  ///

  ///  <param name="edge"></param>
  ///  <param name="point">a point on the edge on Z level</param>
  ConstraintEdgeWithObstaclesAtZ(edge: AxisEdge, point: Point) {
    /*Assert.assert(point == edge.Source.point || point == edge.Target.point)*/
    this.ConstraintEdgeWithObstaclesAtZFromLeft(edge, point)
    this.ConstraintEdgeWithObstaclesAtZFromRight(edge, point)
  }

  ConstraintEdgeWithObstaclesAtZFromRight(edge: AxisEdge, point: Point) {
    const node = this.GetActiveSideFromRight(point)
    if (node == null) {
      return
    }

    if (this.NotRestricting(edge, (<LeftObstacleSide>node.item).Polyline)) {
      return
    }

    const x = this.ObstacleSideComparer.IntersectionOfSideAndSweepLine(
      node.item,
    )
    edge.BoundFromRight(x.dot(this.DirectionPerp))
  }

  GetActiveSideFromRight(point: Point): RBNode<SegmentBase> {
    return this.LeftObstacleSideTree.findFirst((side) =>
      FreeSpaceFinder.PointToTheLeftOfLineOrOnLineLocal(
        point,
        side.Start,
        side.End,
      ),
    )
  }

  ConstraintEdgeWithObstaclesAtZFromLeft(edge: AxisEdge, point: Point) {
    //     ShowNudgedSegAndPoint(point, nudgedSegment);
    const node = this.GetActiveSideFromLeft(point)
    if (node == null) {
      return
    }

    if (this.NotRestricting(edge, (<RightObstacleSide>node.item).Polyline)) {
      return
    }

    const x = this.ObstacleSideComparer.IntersectionOfSideAndSweepLine(
      node.item,
    )
    edge.BoundFromLeft(x.dot(this.DirectionPerp))
  }

  static PointToTheLeftOfLineOrOnLineLocal(
    a: Point,
    linePoint0: Point,
    linePoint1: Point,
  ): boolean {
    return (
      Point.signedDoubledTriangleArea(a, linePoint0, linePoint1) >
      -FreeSpaceFinder.AreaComparisonEpsilon
    )
  }

  static PointToTheRightOfLineOrOnLineLocal(
    a: Point,
    linePoint0: Point,
    linePoint1: Point,
  ): boolean {
    return (
      Point.signedDoubledTriangleArea(linePoint0, linePoint1, a) <
      FreeSpaceFinder.AreaComparisonEpsilon
    )
  }

  GetActiveSideFromLeft(point: Point): RBNode<SegmentBase> {
    return this.RightObstacleSideTree.findLast((side) =>
      FreeSpaceFinder.PointToTheRightOfLineOrOnLineLocal(
        point,
        side.Start,
        side.End,
      ),
    )
  }

  //  ReSharper disable UnusedMember.Local
  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // ShowPointAndEdge(point: Point, edge: AxisEdge) {
  //     //  ReSharper restore UnusedMember.Local
  //     let curves: Array<ICurve> = this.GetCurves(point, edge);
  //     LayoutAlgorithmSettings.Show(curves.ToArray());
  // }

  // //  ReSharper disable UnusedMember.Local
  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // ShowPointAndEdgeWithSweepline(point: Point, edge: AxisEdge) {
  //     //  ReSharper restore UnusedMember.Local
  //     let curves: Array<ICurve> = this.GetCurves(point, edge);
  //     curves.Add(new LineSegment(((this.SweepDirection * this.Z) + (10 * this.DirectionPerp)), ((this.SweepDirection * this.Z) - (10 * this.DirectionPerp))));
  //     LayoutAlgorithmSettings.Show(curves.ToArray());
  // }

  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // GetCurves(point: Point, edge: AxisEdge): Array<ICurve> {
  //     let ellipse = CurveFactory.CreateEllipse(3, 3, point);
  //     let curves = new Array<ICurve>(this.Obstacles.select(() => {  }, (<ICurve>(o))));
  //     if ((edge.RightBound < Number.POSITIVE_INFINITY)) {
  //         let rightOffset: number = edge.RightBound;
  //         let del = (this.DirectionPerp * rightOffset);
  //         curves.Add(new LineSegment((edge.Source.point + del), (edge.Target.point + del)));
  //     }

  //     if ((edge.LeftBound > Number.NEGATIVE_INFINITY)) {
  //         let leftOffset: number = edge.LeftBound;
  //         let del = (this.DirectionPerp * leftOffset);
  //         curves.Add(new LineSegment((edge.Source.point + del), (edge.Target.point + del)));
  //     }

  //     curves.AddRange(from, e, in, this.PathOrders.keys, let, a=e.SourcePoint, let, b=e.TargetPoint, select, new CubicBezierSegment(a, ((a * 0.8)
  //                         + (b * 0.2)), ((a * 0.2)
  //                         + (b * 0.8)), b)).Cast();
  //     return curves;
  // }

  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // GetCurvesTest(point: Point): Array<DebugCurve> {
  //     let ellipse = CurveFactory.CreateEllipse(3, 3, point);
  //     let curves = new Array<DebugCurve>(this.Obstacles.select(() => {  }, new DebugCurve(100, 1, "black", o)));
  //     curves.AddRange(from, e, in, this.edgeContainersTree, from, axisEdge, in, e, let, a=axisEdge.Source.Point, let, b=axisEdge.Target.Point, select, new DebugCurve(100, 1, "green", new LineSegment(a, b)));
  //     curves.AddRange(FreeSpaceFinder.RightNeighborsCurvesTest(this.edgeContainersTree));
  //     return curves;
  // }

  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // static RightNeighborsCurvesTest(rbTree: IEnumerable<AxisEdgesContainer>): IEnumerable<DebugCurve> {
  //     for (let container of rbTree) {
  //         for (let edge of container) {
  //             for (let rn of edge.RightNeighbors) {
  //                 yield;
  //                 return new DebugCurve(100, 1, "brown", new LineSegment(FreeSpaceFinder.EdgeMidPoint(edge), FreeSpaceFinder.EdgeMidPoint(rn)));
  //             }

  //         }

  //     }

  // }

  static EdgeMidPoint(edge: AxisEdge): Point {
    return Point.middle(edge.SourcePoint, edge.TargetPoint)
  }

  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // ShowAxisEdges() {
  //     //  ReSharper restore UnusedMember.Local
  //     let dd = new Array<DebugCurve>(this.GetObstacleBoundaries("black"));
  //     let i: number = 0;
  //     for (let axisEdge of this.AxisEdges) {
  //         let color = DebugCurve.colors[i];
  //         dd.Add(new DebugCurve(200, 1, color, new LineSegment(axisEdge.Source.point, axisEdge.Target.point)));
  //         let perp: Point = new Point(0, 1);
  //         // TODO: Warning!!!, inline IF is not supported ?
  //         (axisEdge.Direction == Direction.East);
  //         new Point(-1, 0);
  //         if ((axisEdge.LeftBound != Number.NEGATIVE_INFINITY)) {
  //             dd.Add(new DebugCurve(200, 0.5, color, new LineSegment((axisEdge.Source.point
  //                                     + (axisEdge.LeftBound * perp)), (axisEdge.Target.point
  //                                     + (axisEdge.LeftBound * perp)))));
  //         }

  //         if ((axisEdge.RightBound != Number.POSITIVE_INFINITY)) {
  //             dd.Add(new DebugCurve(200, 0.5, color, new LineSegment((axisEdge.Source.point
  //                                     - (axisEdge.RightBound * perp)), (axisEdge.Target.point
  //                                     - (axisEdge.RightBound * perp)))));
  //         }

  //         i = ((i + 1)
  //                     % DebugCurve.colors.length);
  //     }

  //     DebugCurveCollection.WriteToFile(dd, "c:/tmp/ae");
  //     LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(dd);
  // }

  // //  ReSharper disable UnusedMember.Local
  // @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")
  // ShowAtPoint(point: Point) {
  //     //  ReSharper restore UnusedMember.Local
  //     let curves = this.GetCurvesTest(point);
  //     LayoutAlgorithmSettings.ShowDebugCurves(curves.ToArray());
  // }

  GetOrCreateAxisEdgesContainer(edge: AxisEdge): RBNode<AxisEdgesContainer> {
    const source = edge.Source.point
    const ret = this.GetAxisEdgesContainerNode(source)
    if (ret != null) {
      return ret
    }

    return this.edgeContainersTree.insert(new AxisEdgesContainer(source))
  }

  ///

  ///  <param name="point">the point has to be on the same line as the container</param>
  ///  <returns></returns>
  GetAxisEdgesContainerNode(point: Point): RBNode<AxisEdgesContainer> {
    const prj = this.xProjection(point)
    const ret = this.edgeContainersTree.findFirst(
      (cont) =>
        this.xProjection(cont.Source) >=
        prj - GeomConstants.distanceEpsilon / 2,
    )
    if (ret != null) {
      if (
        this.xProjection(ret.item.Source) <=
        prj + GeomConstants.distanceEpsilon / 2
      ) {
        return ret
      }
    }

    return null
  }

  ProcessVertexEvent(vertexEvent: VertexEvent) {
    this.Z = this.GetZS(vertexEvent)
    if (vertexEvent instanceof LeftVertexEvent) {
      this.ProcessLeftVertex(
        <LeftVertexEvent>vertexEvent,
        vertexEvent.Vertex.nextOnPolyline,
      )
    } else {
      if (vertexEvent instanceof RightVertexEvent) {
        this.ProcessRightVertex(
          <RightVertexEvent>vertexEvent,
          vertexEvent.Vertex.prevOnPolyline,
        )
      } else {
        this.ProcessLeftVertex(vertexEvent, vertexEvent.Vertex.nextOnPolyline)
        this.ProcessRightVertex(vertexEvent, vertexEvent.Vertex.prevOnPolyline)
      }
    }
  }

  ProcessRightVertex(rightVertexEvent: VertexEvent, nextVertex: PolylinePoint) {
    /*Assert.assert(this.Z == rightVertexEvent.Site.dot(this.SweepDirection))*/
    const site = rightVertexEvent.Site
    this.ProcessPrevSegmentForRightVertex(rightVertexEvent, site)
    const delta = nextVertex.point.sub(rightVertexEvent.Site)
    const deltaX = delta.dot(this.DirectionPerp)
    const deltaZ = delta.dot(this.SweepDirection)
    if (deltaZ <= GeomConstants.distanceEpsilon) {
      if (deltaX > 0 && deltaZ >= 0) {
        this.EnqueueEvent(new RightVertexEvent(nextVertex))
      } else {
        this.RestrictEdgeContainerToTheRightOfEvent(rightVertexEvent.Vertex)
      }
    } else {
      // deltaZ>epsilon
      this.InsertRightSide(new RightObstacleSide(rightVertexEvent.Vertex))
      this.EnqueueEvent(new RightVertexEvent(nextVertex))
      this.RestrictEdgeContainerToTheRightOfEvent(rightVertexEvent.Vertex)
    }
  }

  private RestrictEdgeContainerToTheRightOfEvent(polylinePoint: PolylinePoint) {
    const site = polylinePoint.point
    const siteX = this.xProjection(site)
    const containerNode = this.edgeContainersTree.findFirst(
      (container) => siteX <= this.xProjection(container.Source),
    )
    if (containerNode != null) {
      for (const edge of containerNode.item.Edges) {
        if (!this.NotRestricting(edge, polylinePoint.polyline)) {
          edge.BoundFromLeft(this.DirectionPerp.dot(site))
        }
      }
    }
  }

  NotRestricting(edge: AxisEdge, polyline: Polyline): boolean {
    const p = this.AxisEdgesToObstaclesTheyOriginatedFrom.get(edge)
    return p == polyline
  }

  ProcessPrevSegmentForRightVertex(rightVertexEvent: VertexEvent, site: Point) {
    const prevSite = rightVertexEvent.Vertex.nextOnPolyline.point
    const delta = site.sub(prevSite)
    const deltaZ: number = delta.dot(this.SweepDirection)
    if (deltaZ > GeomConstants.distanceEpsilon) {
      this.RemoveRightSide(
        new RightObstacleSide(rightVertexEvent.Vertex.nextOnPolyline),
      )
    }
  }

  RemoveEdge(edge: AxisEdge) {
    const containerNode = this.GetAxisEdgesContainerNode(edge.Source.point)
    containerNode.item.RemoveAxis(edge)
    if (containerNode.item.IsEmpty()) {
      this.edgeContainersTree.deleteNodeInternal(containerNode)
    }
  }

  ProcessLeftVertex(leftVertexEvent: VertexEvent, nextVertex: PolylinePoint) {
    /*Assert.assert(this.Z == leftVertexEvent.Site.dot(this.SweepDirection))*/
    const site = leftVertexEvent.Site
    this.ProcessPrevSegmentForLeftVertex(leftVertexEvent, site)
    const delta: Point = nextVertex.point.sub(leftVertexEvent.Site)
    const deltaX: number = delta.dot(this.DirectionPerp)
    const deltaZ: number = delta.dot(this.SweepDirection)
    if (deltaZ <= GeomConstants.distanceEpsilon) {
      if (deltaX < 0 && deltaZ >= 0) {
        this.EnqueueEvent(new LeftVertexEvent(nextVertex))
      }
    } else {
      // deltaZ>epsilon
      this.InsertLeftSide(new LeftObstacleSide(leftVertexEvent.Vertex))
      this.EnqueueEvent(new LeftVertexEvent(nextVertex))
    }

    // ShowAtPoint(leftVertexEvent.Site);
    this.RestrictEdgeFromTheLeftOfEvent(leftVertexEvent.Vertex)
  }

  private RestrictEdgeFromTheLeftOfEvent(polylinePoint: PolylinePoint) {
    // ShowAtPoint(site);
    const site: Point = polylinePoint.point
    const containerNode: RBNode<AxisEdgesContainer> = this.GetContainerNodeToTheLeftOfEvent(
      site,
    )
    if (containerNode != null) {
      for (const edge of containerNode.item.Edges) {
        if (!this.NotRestricting(edge, polylinePoint.polyline)) {
          edge.BoundFromRight(site.dot(this.DirectionPerp))
        }
      }
    }
  }

  GetContainerNodeToTheLeftOfEvent(site: Point): RBNode<AxisEdgesContainer> {
    const siteX: number = this.xProjection(site)
    return this.edgeContainersTree.findLast(
      (container) => this.xProjection(container.Source) <= siteX,
    )
    //                 Point.PointToTheRightOfLineOrOnLine(site, container.Source,
    //                                                                                                 container.UpPoint));
  }

  private ProcessPrevSegmentForLeftVertex(
    leftVertexEvent: VertexEvent,
    site: Point,
  ) {
    const prevSite = leftVertexEvent.Vertex.prevOnPolyline.point
    const delta = site.sub(prevSite)
    const deltaZ: number = delta.dot(this.SweepDirection)
    if (deltaZ > GeomConstants.distanceEpsilon) {
      this.RemoveLeftSide(
        new LeftObstacleSide(leftVertexEvent.Vertex.prevOnPolyline),
      )
    }
  }

  InitTheQueueOfEvents() {
    this.InitQueueOfEvents()
    for (const axisEdge of this.AxisEdges) {
      this.EnqueueEventsForEdge(axisEdge)
    }
  }

  AxisEdges: IEnumerable<AxisEdge>

  EnqueueEventsForEdge(edge: AxisEdge) {
    if (this.EdgeIsParallelToSweepDir(edge)) {
      this.EnqueueEvent(
        FreeSpaceFinder.EdgeLowPointEvent(edge, edge.Source.point),
      )
      this.EnqueueEvent(
        FreeSpaceFinder.EdgeHighPointEvent(edge, edge.Target.point),
      )
    }
  }

  EdgeIsParallelToSweepDir(edge: AxisEdge): boolean {
    return (
      edge.Direction == this.SweepPole ||
      edge.Direction == CompassVector.OppositeDir(this.SweepPole)
    )
  }

  static EdgeHighPointEvent(edge: AxisEdge, point: Point): SweepEvent {
    return new AxisEdgeHighPointEvent(edge, point)
  }

  static EdgeLowPointEvent(edge: AxisEdge, point: Point): SweepEvent {
    return new AxisEdgeLowPointEvent(edge, point)
  }

  public CompareAA(x: AxisEdgesContainer, y: AxisEdgesContainer): number {
    return compareNumbers(
      x.Source.dot(this.DirectionPerp),
      y.Source.dot(this.DirectionPerp),
    )
  }
}
