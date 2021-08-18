import {Point} from '../../../..'
import {SweepEvent} from '../../spline/coneSpanner/SweepEvent'
import {AxisEdge} from './AxisEdge'

class AxisEdgeHighPointEvent extends SweepEvent {
  site: Point

  AxisEdge: AxisEdge

  constructor(edge: AxisEdge, point: Point) {
    super()
    this.site = point
    this.AxisEdge = edge
  }

  get Site(): Point {
    return this.site
  }
}
