import {from} from 'linq-to-typescript'
import {Point, Rectangle} from '../../../..'
import {RectangleNode} from '../../../core/geometry/RTree/RectangleNode'
import {RTree} from '../../../core/geometry/RTree/RTree'
import {CompassVector} from '../../../math/geometry/compassVector'
import {Curve} from '../../../math/geometry/curve'
import {GeomConstants} from '../../../math/geometry/geomConstants'
import {LineSegment} from '../../../math/geometry/lineSegment'
import {Polyline} from '../../../math/geometry/polyline'
import {Path} from './Path'
import {SegWithIndex} from './SegWithIndex'

export class StaircaseRemover {
  Paths: Array<Path>

  HierarchyOfObstacles: RTree<Polyline, Point>

  segTree: RTree<SegWithIndex, Point> = new RTree<SegWithIndex, Point>(null)

  crossedOutPaths: Set<Path> = new Set<Path>()

  constructor(
    paths: Array<Path>,
    hierarchyOfObstacles: RectangleNode<Polyline, Point>,
  ) {
    this.HierarchyOfObstacles = new RTree<Polyline, Point>(hierarchyOfObstacles)
    this.Paths = paths
  }

  static RemoveStaircases(
    paths: Array<Path>,
    hierarchyOfObstacles: RectangleNode<Polyline, Point>,
  ) {
    const r = new StaircaseRemover(paths, hierarchyOfObstacles)
    r.Calculate()
  }

  Calculate() {
    this.InitHierarchies()
    let success: boolean
    do {
      success = false
      for (const path of this.Paths.filter(
        (p) => !this.crossedOutPaths.has(p),
      )) {
        if (this.ProcessPath(path)) success = true
      }
    } while (success)
  }

  ProcessPath(path: Path): boolean {
    const t = {pts: <Point[]>(<any>path.PathPoints), canHaveStaircase: false}
    if (this.ProcessPoints(t)) {
      path.PathPoints = from(t.pts)
      return true
    }

    if (!t.canHaveStaircase) {
      this.crossedOutPaths.add(path)
    }

    return false
  }

  ProcessPoints(t: {pts: Point[]; canHaveStaircase: boolean}): boolean {
    const staircaseStart = this.FindStaircaseStart(t)
    if (staircaseStart < 0) {
      return false
    }

    t.pts = RemoveStaircase(pts, staircaseStart)
    return true
  }

  FindStaircaseStart(t: {pts: Point[]; canHaveStaircase: boolean}): number {
    t.canHaveStaircase = false
    if (t.pts.length < 5) {
      return -1
    }

    let segs
    new SegWithIndex(t.pts, 0)
    new SegWithIndex(t.pts, 1)
    new SegWithIndex(t.pts, 2)
    new SegWithIndex(t.pts, 3)

    let segToReplace = 0
    for (let i = 0; ; ) {
      const w = {canHaveStaircaseAtI: false}
      if (this.IsStaircase(t.pts, i, segs, w)) {
        t.canHaveStaircase = true
        return i
      }

      t.canHaveStaircase = t.canHaveStaircase || w.canHaveStaircaseAtI
      i++
      if (t.pts.length < i + 5) {
        return -1
      }

      segs[segToReplace] = new SegWithIndex(t.pts, i + 3)
      segToReplace++
      segToReplace %= 4
    }
  }

  static GetFlippedPoint(pts: Point[], offset: number): Point {
    const horiz = Point.closeD(pts[offset].y, pts[offset + 1].y)
    return horiz
      ? new Point(pts[offset + 4].x, pts[offset].y)
      : new Point(pts[offset].x, pts[offset + 4].y)
  }

  ///  <summary>
  ///  ignoring crossing at a
  ///  </summary>
  ///  <param name="a"></param>
  ///  <param name="b"></param>
  ///  <param name="segsToIgnore"></param>
  ///  <returns></returns>
  Crossing(a: Point, b: Point, segsToIgnore: SegWithIndex[]): boolean {
    return StaircaseRemover.IsCrossing(
      LineSegment.mkPP(a, b),
      this.segTree,
      segsToIgnore,
    )
  }

  ///  <summary>
  ///  ignoring crossing at ls.Start
  ///  </summary>
  ///  <param name="ls"></param>
  ///  <param name="rTree"></param>
  ///  <param name="segsToIgnore"></param>
  ///  <returns></returns>
  static IsCrossing(
    ls: LineSegment,
    rTree: RTree<SegWithIndex, Point>,
    segsToIgnore: SegWithIndex[],
  ): boolean {
    return from(rTree.GetAllIntersecting(ls.boundingBox))
      .where((seg) => segsToIgnore.findIndex((p) => p == seg) == -1)
      .any()
  }

  IntersectObstacleHierarchy(a: Point, b: Point, c: Point): boolean {
    return (
      this.IntersectObstacleHierarchy(new LineSegment(a, b)) ||
      this.IntersectObstacleHierarchy(new LineSegment(b, c))
    )
  }

  IntersectObstacleHierarchy(ls: LineSegment): boolean {
    return this.HierarchyOfObstacles.GetAllIntersecting(
      ls.boundingBox,
    ).Any(() => {}, Curve.CurveCurveIntersectionOne(ls, poly, false) != null)
  }

  IsStaircase(
    pts: Point[],
    offset: number,
    segsToIgnore: SegWithIndex[],
    w: {canHaveStaircaseAtI: boolean},
  ): boolean {
    const a = pts[offset]
    const b = pts[offset + 1]
    let c = pts[offset + 2]
    const d = pts[offset + 3]
    const f = pts[offset + 4]
    w.canHaveStaircaseAtI = false
    if (
      CompassVector.DirectionFromPointToPoint(a, b) !=
        CompassVector.DirectionFromPointToPoint(c, d) ||
      CompassVector.DirectionFromPointToPoint(b, c) !=
        CompassVector.DirectionFromPointToPoint(d, f)
    ) {
      return false
    }

    c = StaircaseRemover.GetFlippedPoint(pts, offset)
    if (this.IntersectObstacleHierarchy(b, c, d)) {
      return false
    }

    w.canHaveStaircaseAtI = true
    return !this.Crossing(b, c, segsToIgnore)
  }

  RemoveStaircasePN(pts: Point[], staircaseStart: number): Point[] {
    const a: Point = pts[staircaseStart]
    const b: Point = pts[staircaseStart + 1]
    const horiz = Math.abs(a.y - b.y) < GeomConstants.distanceEpsilon / 2
    return this.RemoveStaircasePNH(pts, staircaseStart, horiz)
  }

  RemoveStaircasePNH(
    pts: Point[],
    staircaseStart: number,
    horiz: boolean,
  ): Point[] {
    this.RemoveSegs(pts)
    const ret = new Array(pts.length - 2)
    Array.Copy(pts, ret, staircaseStart + 1)
    const a = pts[staircaseStart + 1]
    const c = pts[staircaseStart + 3]
    ret[staircaseStart + 1] = new Point(c.x, a.y)
    // TODO: Warning!!!, inline IF is not supported ?
    horiz
    new Point(a.x, c.y)
    Array.Copy(
      pts,
      staircaseStart + 4,
      ret,
      staircaseStart + 2,
      ret.length - (staircaseStart - 2),
    )
    this.InsertNewSegs(ret, staircaseStart)
    return ret
  }

  RemoveSegs(pts: Point[]) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.RemoveSeg(new SegWithIndex(pts, i))
    }
  }

  RemoveSeg(seg: SegWithIndex) {
    this.segTree.Remove(StaircaseRemover.Rect(seg), seg)
  }

  InsertNewSegs(pts: Point[], staircaseStart: number) {
    this.InsSeg(pts, staircaseStart)
    this.InsSeg(pts, staircaseStart + 1)
  }

  InitHierarchies() {
    for (const path in this.Paths) {
      this.InsertPathSegs(path)
    }
  }

  InsertPathSegs(path: Path) {
    this.InsertSegs(<Point[]>path.PathPoints)
  }

  InsertSegs(pts: Point[]) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.InsSeg(pts, i)
    }
  }

  InsSeg(pts: Point[], i: number) {
    const seg = new SegWithIndex(pts, i)
    this.segTree.Add(StaircaseRemover.Rect(seg), seg)
  }

  static Rect(seg: SegWithIndex): Rectangle {
    return new Rectangle(seg.Start, seg.End)
  }
}
