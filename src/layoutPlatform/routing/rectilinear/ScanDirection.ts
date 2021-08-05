import {CompassVector} from '../../math/geometry/compassVector'
import {Direction} from '../../math/geometry/directiton'
import {Point} from '../../math/geometry/point'
import {SegmentBase} from '../visibility/SegmentBase'

export class ScanDirection {
  //  The direction of primary interest, either the direction of the sweep (the
  //  coordinate the scanline sweeps "up" in) or along the scan line ("sideways"
  //  to the sweep direction, scanning for obstacles).
  dir: Direction
  get Direction(): Direction {
    return this.dir
  }
  set Direction(value: Direction) {
    this.dir = value
  }

  DirectionAsPoint: Point

  //  The perpendicular direction - opposite of comments for Direction.
  PerpDirection: Direction

  PerpDirectionAsPoint: Point

  //  The oppposite direction of the primary direction.
  OppositeDirection: Direction

  //  Use the internal static xxxInstance properties to get an instance.
  constructor(directionAlongScanLine: Direction) {
    System.Diagnostics.Debug.Assert(
      StaticGraphUtility.IsAscending(directionAlongScanLine),
      'directionAlongScanLine must be ascending',
    )
    this.Direction = directionAlongScanLine
    this.DirectionAsPoint = CompassVector.ToPoint(this.Direction)
    this.PerpDirection = this.Direction.East
    // TODO: Warning!!!, inline IF is not supported ?
    this.Direction.North == directionAlongScanLine
    this.Direction.North
    this.PerpDirectionAsPoint = CompassVector.ToPoint(this.PerpDirection)
    this.OppositeDirection = CompassVector.OppositeDir(directionAlongScanLine)
  }

  get IsHorizontal(): boolean {
    return this.Direction.East == this.Direction
  }

  get IsVertical(): boolean {
    return this.Direction.North == this.Direction
  }

  //  Compare in perpendicular direction first, then parallel direction.
  Compare(lhs: Point, rhs: Point): number {
    const cmp: number = this.ComparePerpCoord(lhs, rhs)
    return 0 != cmp
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  CompareScanCoord(lhs: Point, rhs: Point): number {
    return PointComparer.Compare((lhs - rhs) * this.DirectionAsPoint, 0)
  }

  ComparePerpCoord(lhs: Point, rhs: Point): number {
    return PointComparer.Compare((lhs - rhs) * this.PerpDirectionAsPoint, 0)
  }

  IsFlat(seg: SegmentBase): boolean {
    return this.IsFlat(seg.Start, seg.End)
  }

  IsFlat(start: Point, end: Point): boolean {
    //  Return true if there is no change in the perpendicular direction.
    return PointComparer.Equal((end - start) * this.PerpDirectionAsPoint, 0)
  }

  IsPerpendicular(seg: SegmentBase): boolean {
    return this.IsPerpendicular(seg.Start, seg.End)
  }

  IsPerpendicular(start: Point, end: Point): boolean {
    //  Return true if there is no change in the primary direction.
    return PointComparer.Equal((end - start) * this.DirectionAsPoint, 0)
  }

  Coord(point: Point): number {
    return point * this.DirectionAsPoint
  }

  Min(first: Point, second: Point): Point {
    return this.Compare(first, second) <= 0
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  Max(first: Point, second: Point): Point {
    return this.Compare(first, second) >= 0
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  //  ReSharper disable InconsistentNaming
  static horizontalInstance: ScanDirection = new ScanDirection(
    this.Direction.East,
  )

  static verticalInstance: ScanDirection = new ScanDirection(
    this.Direction.North,
  )

  //  ReSharper restore InconsistentNaming
  static get HorizontalInstance(): ScanDirection {
    return horizontalInstance
  }

  static get VerticalInstance(): ScanDirection {
    return verticalInstance
  }

  get PerpendicularInstance(): ScanDirection {
    return this.IsHorizontal
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  static GetInstance(dir: Direction): ScanDirection {
    return StaticGraphUtility.IsVertical(dir)
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  ///  <summary/>
  public /* override */ ToString(): string {
    return this.Direction.ToString()
  }
}
