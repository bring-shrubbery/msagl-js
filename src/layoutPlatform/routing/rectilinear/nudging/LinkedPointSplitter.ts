///  intersects a set of horizontal LinkedPoints with a set of vertical LinkedPoints

import {Point} from '../../../..'
import {GeomConstants} from '../../../math/geometry/geomConstants'
import {GenericBinaryHeapPriorityQueue} from '../../../structs/genericBinaryHeapPriorityQueue'
import {RBTree} from '../../../structs/RBTree/rbTree'
import {Assert} from '../../../utils/assert'
import {closeDistEps, compareNumbers} from '../../../utils/compare'
import {LinkedPoint} from './LinkedPoint'

export class LinkedPointSplitter {
  ///

  ///  <param name="horizontalPoints">no two horizontal segs overlap, but they can share an end point</param>
  ///  <param name="verticalPoints">no two vertical segs overlap, but they can share an end point</param>
  constructor(
    horizontalPoints: Array<LinkedPoint>,
    verticalPoints: Array<LinkedPoint>,
  ) {
    this.VerticalPoints = verticalPoints
    this.HorizontalPoints = horizontalPoints
  }

  HorizontalPoints: Array<LinkedPoint>

  VerticalPoints: Array<LinkedPoint>
  SplitPoints() {
    if (this.VerticalPoints.length == 0 || this.HorizontalPoints.length == 0) {
      return
    }

    // there will be no intersections
    this.InitEventQueue()
    this.ProcessEvents()
  }

  ProcessEvents() {
    while (!this.Queue.IsEmpty()) {
      const t = {priority: 0}
      const linkedPoint = this.Queue.DequeueAndGetPriority(t)
      this.ProcessEvent(linkedPoint, t.priority)
    }
  }

  ProcessEvent(linkedPoint: LinkedPoint, z: number) {
    if (closeDistEps(linkedPoint.Next.Point.x, linkedPoint.Point.x)) {
      if (z == LinkedPointSplitter.Low(linkedPoint)) {
        this.ProcessLowLinkedPointEvent(linkedPoint)
      } else {
        this.ProcessHighLinkedPointEvent(linkedPoint)
      }
    } else {
      this.IntersectWithTree(linkedPoint)
    }
  }

  IntersectWithTree(horizontalPoint: LinkedPoint) {
    let right: number
    let left: number
    let xAligned: boolean
    Assert.assert(closeDistEps(horizontalPoint.Y, horizontalPoint.Next.Y))
    const y = horizontalPoint.Y
    if (horizontalPoint.Point.x < horizontalPoint.Next.Point.x) {
      left = horizontalPoint.Point.x
      right = horizontalPoint.Next.Point.x
      xAligned = true
    } else {
      right = horizontalPoint.Point.x
      left = horizontalPoint.Next.Point.x
      xAligned = false
    }

    if (xAligned) {
      for (
        let node = this.tree.findFirst((p) => left <= p.Point.x);
        node != null && node.item.Point.x <= right;
        node = this.tree.next(node)
      ) {
        const p = new Point(node.item.Point.x, y)
        horizontalPoint = LinkedPointSplitter.TrySplitHorizontalPoint(
          horizontalPoint,
          p,
          true,
        )
        LinkedPointSplitter.TrySplitVerticalPoint(node.item, p)
      }
    } else {
      for (
        let node = this.tree.findLast((p) => p.Point.x <= right);
        node != null && node.item.Point.x >= left;
        node = this.tree.previous(node)
      ) {
        const p = new Point(node.item.Point.x, y)
        horizontalPoint = LinkedPointSplitter.TrySplitHorizontalPoint(
          horizontalPoint,
          p,
          false,
        )
        LinkedPointSplitter.TrySplitVerticalPoint(node.item, p)
      }
    }
  }

  static TrySplitVerticalPoint(linkedPoint: LinkedPoint, point: Point) {
    Assert.assert(closeDistEps(linkedPoint.X, linkedPoint.Next.X))
    if (
      LinkedPointSplitter.Low(linkedPoint) + GeomConstants.distanceEpsilon <
        point.y &&
      point.y + GeomConstants.distanceEpsilon <
        LinkedPointSplitter.High(linkedPoint)
    ) {
      linkedPoint.SetNewNext(point)
    }
  }

  static TrySplitHorizontalPoint(
    horizontalPoint: LinkedPoint,
    point: Point,
    xAligned: boolean,
  ): LinkedPoint {
    Assert.assert(closeDistEps(horizontalPoint.Y, horizontalPoint.Next.Y))
    if (
      (xAligned &&
        horizontalPoint.X + GeomConstants.distanceEpsilon < point.x &&
        point.x + GeomConstants.distanceEpsilon < horizontalPoint.Next.X) ||
      (!xAligned &&
        horizontalPoint.Next.X + GeomConstants.distanceEpsilon < point.x &&
        point.x + GeomConstants.distanceEpsilon < horizontalPoint.X)
    ) {
      horizontalPoint.SetNewNext(point)
      return horizontalPoint.Next
    }

    return horizontalPoint
  }

  ProcessHighLinkedPointEvent(linkedPoint: LinkedPoint) {
    this.tree.remove(linkedPoint)
  }

  tree: RBTree<LinkedPoint> = new RBTree<LinkedPoint>((a, b) =>
    compareNumbers(a.Point.x, b.Point.x),
  )

  ProcessLowLinkedPointEvent(linkedPoint: LinkedPoint) {
    this.tree.insert(linkedPoint)
  }

  InitEventQueue() {
    this.Queue = new GenericBinaryHeapPriorityQueue<LinkedPoint>(compareNumbers)
    for (const vertPoint of this.VerticalPoints) {
      this.Queue.Enqueue(vertPoint, LinkedPointSplitter.Low(vertPoint))
    }

    // a horizontal point will appear of the queue after a vertical point
    //  with the same coordinate low coorinate
    for (const horizPoint of this.HorizontalPoints) {
      this.Queue.Enqueue(horizPoint, horizPoint.Point.y)
    }
  }

  static Low(vertPoint: LinkedPoint): number {
    return Math.min(vertPoint.Point.y, vertPoint.Next.Point.y)
  }

  static High(vertPoint: LinkedPoint): number {
    return Math.max(vertPoint.Point.y, vertPoint.Next.Point.y)
  }

  Queue: GenericBinaryHeapPriorityQueue<LinkedPoint>
}
