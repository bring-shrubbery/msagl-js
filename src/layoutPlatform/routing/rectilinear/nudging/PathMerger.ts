/// Avoid a situation where two paths cross each other more than once. Remove self loops.
///

import { from, IEnumerable } from 'linq-to-typescript'
import {Point} from '../../../..'
import {Assert} from '../../../utils/assert'
import {PointMap} from '../../../utils/PointMap'
import {LinkedPoint} from './LinkedPoint'
import {Path} from './Path'

export class PathMerger {
  constructor(paths: Iterable<Path>) {
    this.Paths = paths
  }

  Paths: Iterable<Path>
  verticesToPathOffsets = new PointMap<Map<Path, LinkedPoint>>()

  ///  Avoid a situation where two paths cross each other more than once. Remove self loops.

  MergePaths() {
    this.InitVerticesToPathOffsetsAndRemoveSelfCycles()
    for (const path of this.Paths) {
      this.ProcessPath(path)
    }
  }

  ProcessPath(path: Path) {
    const departedPaths = new Map<Path, LinkedPoint>()
    let prevLocationPathOffsets: Map<Path, LinkedPoint> = null
    for (
      let linkedPoint = <LinkedPoint>(<unknown>path.PathPoints);
      linkedPoint != null;
      linkedPoint = linkedPoint.Next
    ) {
      const pathOffsets = this.verticesToPathOffsets.get(linkedPoint.Point)
      if (prevLocationPathOffsets != null) {
        // handle returning paths
        if (departedPaths.size > 0) {
          for (const [path0, v] of pathOffsets) {
            const departerLinkedPoint = departedPaths.get(path0)

            if (departerLinkedPoint) {
              // returned!
              this.CollapseLoopingPath(
                path0,
                departerLinkedPoint,
                v,
                path,
                linkedPoint,
              )
              departedPaths.delete(path0)
            }
          }
        }

        // find departed paths
        for (const [k, v] of prevLocationPathOffsets) {
          if (!pathOffsets.has(k)) departedPaths.set(k, v)
        }
      }

      prevLocationPathOffsets = pathOffsets
    }
  }

  //         bool Correct() {
  //             foreach (var kv of verticesToPathOffsets) {
  //                 Point p = kv.Key;
  //                 Map<Path, LinkedPoint> pathOffs = kv.Value;
  //                 foreach (var pathOff of pathOffs) {
  //                     var path = pathOff.Key;
  //                     var linkedPoint = pathOff.Value;
  //                     if (linkedPoint.Point != p)
  //                         return false;
  //                     if (FindLinkedPointInPath(path, p) == null) {
  //                         return false;
  //                     }
  //                 }
  //             }
  //             return true;
  //         }
  CollapseLoopingPath(
    loopingPath: Path,
    departureFromLooping: LinkedPoint,
    arrivalToLooping: LinkedPoint,
    stemPath: Path,
    arrivalToStem: LinkedPoint,
  ) {
    const departurePointOnStem = PathMerger.FindLinkedPointInPath(
      stemPath,
      departureFromLooping.Point,
    )
    const pointsToInsert: Iterable<Point> = PathMerger.GetPointsInBetween(
      departurePointOnStem,
      arrivalToStem,
    )
    if (PathMerger.Before(departureFromLooping, arrivalToLooping)) {
      this.CleanDisappearedPiece(
        departureFromLooping,
        arrivalToLooping,
        loopingPath,
      )
      this.ReplacePiece(
        departureFromLooping,
        arrivalToLooping,
        pointsToInsert,
        loopingPath,
      )
    } else {
      this.CleanDisappearedPiece(
        arrivalToLooping,
        departureFromLooping,
        loopingPath,
      )
      this.ReplacePiece(
        arrivalToLooping,
        departureFromLooping,
        from(pointsToInsert).reverse(),
        loopingPath,
      )
    }
  }

  static *GetPointsInBetween(
    a: LinkedPoint,
    b: LinkedPoint,
  ): IterableIterator<Point> {
    for (let i = a.Next; i != b; i = i.Next) {
      yield i.Point
    }
  }

  ReplacePiece(
    a: LinkedPoint,
    b: LinkedPoint,
    points: IEnumerable<Point>,
    loopingPath: Path,
  ) {
    let prevPoint = a
    for (const point of points) {
      const lp = new LinkedPoint(point)
      prevPoint.Next = lp
      prevPoint = lp
      const pathOffset = this.verticesToPathOffsets.get(point)
      Assert.assert(!pathOffset.has(loopingPath))
      pathOffset.set(loopingPath, prevPoint)
    }

    prevPoint.Next = b
  }

  CleanDisappearedPiece(a: LinkedPoint, b: LinkedPoint, loopingPath: Path) {
    for (const point of PathMerger.GetPointsInBetween(a, b)) {
      const pathOffset = this.verticesToPathOffsets.get(point)
      Assert.assert(pathOffset.has(loopingPath))
      pathOffset.delete(loopingPath)
    }
  }

  ///  checks that a is before b of the path

  ///  <param name="a"></param>
  ///  <param name="b"></param>
  ///  <returns>true is a is before b of the path</returns>
  static Before(a: LinkedPoint, b: LinkedPoint): boolean {
    for (a = a.Next; a != null; a = a.Next) {
      if (a == b) {
        return true
      }
    }

    return false
  }

  static FindLinkedPointInPath(path: Path, point: Point): LinkedPoint {
    // this function is supposed to always succeed. it will throw a null reference exception otherwise
    for (
      let linkedPoint = <LinkedPoint>(<unknown>path.PathPoints);
      ;
      linkedPoint = linkedPoint.Next
    ) {
      if (linkedPoint.Point == point) {
        return linkedPoint
      }
    }
  }

  InitVerticesToPathOffsetsAndRemoveSelfCycles() {
    for (const path of this.Paths) {
      for (
        let linkedPoint = <LinkedPoint>path.PathPoints;
        linkedPoint != null;
        linkedPoint = linkedPoint.Next
      ) {
        let pathOffsets: Map<
          Path,
          LinkedPoint
        > = this.verticesToPathOffsets.get(linkedPoint.Point)
        if (!pathOffsets) {
          pathOffsets = new Map<Path, LinkedPoint>()
        }

        this.verticesToPathOffsets.set(
          linkedPoint.Point,
          new Map<Path, LinkedPoint>(),
        )
        // check for the loop
        const loopPoint: LinkedPoint = pathOffsets.get(path)
        if (loopPoint) {
          // we have a loop
          this.CleanDisappearedPiece(loopPoint, linkedPoint, path)
          loopPoint.Next = linkedPoint.Next
        } else {
          pathOffsets[path] = linkedPoint
        }
      }
    }
  }
}
