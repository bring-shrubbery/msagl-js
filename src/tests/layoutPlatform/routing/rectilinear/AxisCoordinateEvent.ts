import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {SweepEvent} from '../spline/sweepEvent'

export class AxisCoordinateEvent extends SweepEvent {
  private site: Point
  constructor(p: Point) {
    super()
    this.site = p
  }

  get Site(): Point {
    return this.site
  }
}
