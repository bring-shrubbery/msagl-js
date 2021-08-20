///  If two paths intersect then insert the intersection point as a vertex into both paths.
///  Remove path self loops. Merge paths between the crossings if they have multiple crossings.
///  If a path passes through a vertex of another path then insert this vertex into the first path.

import {from} from 'linq-to-typescript'
import {Point} from '../../../..'
import {Direction} from '../../../math/geometry/direction'
import {GeomConstants} from '../../../math/geometry/geomConstants'
import {LinkedPoint} from './LinkedPoint'
import {LinkedPointSplitter} from './LinkedPointSplitter'
import {Path} from './Path'
import {PathMerger} from './PathMerger'
import {PointByDelegateComparer} from './PointByDelegateComparer'
import SortedMap = require('collections/sorted-map')
type PointProjection = (p: Point) => number
///  </summary>
export class PathRefiner {
  static RefinePaths(paths: Iterable<Path>, mergePaths: boolean) {
    PathRefiner.AdjustPaths(paths)
    const pathsToFirstLinkedVertices = PathRefiner.CreatePathsToFirstLinkedVerticesMap(
      paths,
    )
    PathRefiner.Refine(pathsToFirstLinkedVertices.values())
    PathRefiner.CrossVerticalAndHorizontalSegs(
      pathsToFirstLinkedVertices.values(),
    )
    PathRefiner.ReconstructPathsFromLinkedVertices(pathsToFirstLinkedVertices)
    if (mergePaths) {
      new PathMerger(paths).MergePaths()
    }
  }

  ///  <summary>
  ///  make sure that every two different points of paths are separated by at least 10e-6
  ///  </summary>
  ///  <param name="paths"></param>
  static AdjustPaths(paths: Iterable<Path>) {
    for (const path of paths) {
      const arg = path.PathPoints.select((p) => p.clone())
      const adjusted = PathRefiner.AdjustPathPoints(arg.toArray())
      path.PathPoints = from(adjusted)
    }
  }

  static AdjustPathPoints(points: Array<Point>): Array<Point> {
    const arr = []
    let p: Point = GeomConstants.RoundPoint(points[0])
    arr.push(p)
    for (let i = 1; i < points.length; i++) {
      const np = GeomConstants.RoundPoint(points[i])
      if (!p.equal(np)) {
        p = np
        arr.push(p)
      }
    }
    return arr
  }

  static CrossVerticalAndHorizontalSegs(
    pathsFirstLinked: Iterable<LinkedPoint>,
  ) {
    const horizontalPoints = new Array<LinkedPoint>()
    const verticalPoints = new Array<LinkedPoint>()
    for (const pnt of pathsFirstLinked) {
      for (let p = pnt; p.Next != null; p = p.Next) {
        if (Point.closeD(p.Point.x, p.Next.Point.x)) {
          verticalPoints.push(p)
        } else {
          horizontalPoints.push(p)
        }
      }
    }

    new LinkedPointSplitter(horizontalPoints, verticalPoints).SplitPoints()
  }

  static ReconstructPathsFromLinkedVertices(
    pathsToPathLinkedPoints: Map<Path, LinkedPoint>,
  ) {
    for (const [k, v] of pathsToPathLinkedPoints) {
      k.PathPoints = from(v.GetEnumerator())
    }
  }

  static Refine(pathFirstPoints: Iterable<LinkedPoint>) {
    PathRefiner.RefineInDirection(Direction.North, pathFirstPoints)
    PathRefiner.RefineInDirection(Direction.East, pathFirstPoints)
  }

  ///  <summary>
  ///  refines all segments that are parallel to "direction"
  ///  </summary>
  ///  <param name="direction"></param>
  ///  <param name="pathFirstPoints"></param>
  static RefineInDirection(
    direction: Direction,
    pathFirstPoints: Iterable<LinkedPoint>,
  ) {
    const t = {
      projectionToPerp: undefined,
      projectionToDirection: undefined,
    }
    PathRefiner.GetProjectionsDelegates(direction, t)
    const linkedPointsInDirection = Array.from(
      PathRefiner.GetAllLinkedVertsInDirection(
        t.projectionToPerp,
        pathFirstPoints,
      ),
    )
    const colliniarBuckets = from(linkedPointsInDirection).groupBy((p) =>
      t.projectionToPerp(p.Point),
    )
    for (const pathLinkedPointBucket of colliniarBuckets) {
      PathRefiner.RefineCollinearBucket(
        pathLinkedPointBucket,
        t.projectionToDirection,
      )
    }
  }

  static GetProjectionsDelegates(
    direction: Direction,
    t: {
      projectionToPerp: PointProjection
      projectionToDirection: PointProjection
    },
  ) {
    if (direction == Direction.East) {
      t.projectionToDirection = (p) => p.x
      t.projectionToPerp = (p) => p.y
    } else {
      t.projectionToPerp = (p) => p.x
      t.projectionToDirection = (p) => p.y
    }
  }

  static *GetAllLinkedVertsInDirection(
    projectionToPerp: PointProjection,
    initialVerts: Iterable<LinkedPoint>,
  ): IterableIterator<LinkedPoint> {
    for (const vert of initialVerts) {
      for (let v = vert; v.Next != null; v = v.Next) {
        if (
          Point.closeD(
            projectionToPerp(v.Point),
            projectionToPerp(v.Next.Point),
          )
        ) {
          yield v
        }
      }
    }
  }

  ///  <summary>
  ///  refine vertices belonging to a bucket;
  ///  pathLinkedVertices belong to a line parallel to the direction of the refinement
  ///  </summary>
  ///  <param name="pathLinkedVertices"></param>
  ///  <param name="projectionToDirection"></param>
  static RefineCollinearBucket(
    pathLinkedVertices: Iterable<LinkedPoint>,
    projectionToDirection: PointProjection,
  ) {
    const dict = new SortedMap<Point, number>(
      new PointByDelegateComparer(projectionToDirection),
    )
    for (const pathLinkedPoint of pathLinkedVertices) {
      if (!dict.ContainsKey(pathLinkedPoint.Point)) {
        dict[pathLinkedPoint.Point] = 0
      }

      if (!dict.ContainsKey(pathLinkedPoint.Next.Point)) {
        dict[pathLinkedPoint.Next.Point] = 0
      }
    }

    const arrayOfPoints = new Array(dict.Count)
    let i = 0
    for (const point of dict.Keys) {
      arrayOfPoints[i++] = point
    }

    for (i = 0; i < arrayOfPoints.length; i++) {
      dict[arrayOfPoints[i]] = i
    }

    for (const pathLinkedVertex of pathLinkedVertices) {
      i = dict[pathLinkedVertex.Point]
      const j: number = dict[pathLinkedVertex.Next.Point]
      if (Math.abs(j - i) > 1) {
        PathRefiner.InsertPoints(pathLinkedVertex, arrayOfPoints, i, j)
      }
    }
  }

  static InsertPoints(
    pathLinkedVertex: LinkedPoint,
    arrayOfPoints: Point[],
    i: number,
    j: number,
  ) {
    if (i < j) {
      pathLinkedVertex.InsertVerts(i, j, arrayOfPoints)
    } else {
      pathLinkedVertex.InsertVertsInReverse(j, i, arrayOfPoints)
    }
  }

  static CreatePathsToFirstLinkedVerticesMap(
    edgePaths: Iterable<Path>,
  ): Map<Path, LinkedPoint> {
    const dict = new Map<Path, LinkedPoint>()
    for (const path of edgePaths) {
      dict.set(path, PathRefiner.CreateLinkedVertexOfEdgePath(path))
    }

    return dict
  }

  static CreateLinkedVertexOfEdgePath(path: Path): LinkedPoint {
    const pathPoint = new LinkedPoint(path.PathPoints.first())
    const first = pathPoint
    path.PathPoints.skip(1).aggregate(pathPoint, (lp, p) => {
      lp.Next = new LinkedPoint(p)
      return lp.Next
    })
    return first
  }
}
