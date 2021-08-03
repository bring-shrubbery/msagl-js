import {Assert} from '../../utils/assert'
import {GeomConstants} from './geomConstants'
import {Point} from './point'

export enum Direction {
  /// no direction defined

  None = 0,

  /// North

  North = 1,

  /// East

  East = 2,

  /// South

  South = 4,

  /// West

  West = 8,
}
export class CompassVector {
  Dir: Direction

  constructor(direction: Direction) {
    this.Dir = direction
  }

  private get Right(): CompassVector {
    return new CompassVector(CompassVector.RotateRight(this.Dir))
  }

  static RotateRight(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.East
        break
      case Direction.East:
        return Direction.South
        break
      case Direction.South:
        return Direction.West
        break
      case Direction.West:
        return Direction.North
        break
      default:
        throw new Error()
        break
    }
  }

  private static RotateLeft(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.West
        break
      case Direction.West:
        return Direction.South
        break
      case Direction.South:
        return Direction.East
        break
      case Direction.East:
        return Direction.North
        break
      default:
        throw new Error()
        break
    }
  }

  private static ToIndex(direction: Direction): number {
    switch (direction) {
      case Direction.North:
        return 0
        break
      case Direction.East:
        return 1
        break
      case Direction.South:
        return 2
        break
      case Direction.West:
        return 3
        break
      default:
        throw new Error()
        break
    }
  }

  static VectorDirection(d: Point): Direction {
    let r: Direction = Direction.None
    if (d.x > GeomConstants.distanceEpsilon) {
      r = Direction.East
    } else if (d.x < GeomConstants.distanceEpsilon * -1) {
      r = Direction.West
    }

    if (d.y > GeomConstants.distanceEpsilon) {
      r = r | Direction.North
    } else if (d.y < GeomConstants.distanceEpsilon * -1) {
      r = r | Direction.South
    }

    return r
  }

  static VectorDirectionPP(a: Point, b: Point): Direction {
    return CompassVector.VectorDirection(b.sub(a))
  }

  static DirectionsFromPointToPoint(a: Point, b: Point): Direction {
    return CompassVector.VectorDirectionPP(a, b)
  }

  private static PureDirectionFromPointToPoint(a: Point, b: Point): Direction {
    const dir: Direction = CompassVector.VectorDirectionPP(a, b)
    Assert.assert(CompassVector.IsPureDirection(dir), 'Impure direction found')
    return dir
  }

  static OppositeDir(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.South
        break
      case Direction.West:
        return Direction.East
        break
      case Direction.South:
        return Direction.North
        break
      case Direction.East:
        return Direction.West
        break
      default:
        return Direction.None
        break
    }
  }

  static IsPureDirection(direction: Direction): boolean {
    switch (direction) {
      case Direction.North:
        return true
        break
      case Direction.East:
        return true
        break
      case Direction.South:
        return true
        break
      case Direction.West:
        return true
        break
      default:
        return false
        break
    }
  }

  static IsPureDirectionPP(a: Point, b: Point): boolean {
    return CompassVector.IsPureDirection(
      CompassVector.DirectionsFromPointToPoint(a, b),
    )
  }

  ///  Translates the CompassVector's direction into a new Point.

  public ToPoint(): Point {
    let x = 0,
      y = 0
    if ((this.Dir & Direction.East) == Direction.East) {
      x++
    }

    if ((this.Dir & Direction.North) == Direction.North) {
      y++
    }

    if ((this.Dir & Direction.West) == Direction.West) {
      x--
    }

    if ((this.Dir & Direction.South) == Direction.South) {
      y--
    }

    return new Point(x, y)
  }

  ///  Translates a direction into a Point.

  public static ToPoint(dir: Direction): Point {
    return new CompassVector(dir).ToPoint()
  }

  ///   the negation operator

  public static Operator(directionVector: CompassVector): CompassVector {
    return new CompassVector(CompassVector.OppositeDir(directionVector.Dir))
  }
}
