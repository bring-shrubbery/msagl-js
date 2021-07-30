import {Point} from '../../../../../layoutPlatform/math/geometry/point'
import {Polyline} from '../../../../../layoutPlatform/math/geometry/polyline'
import {PolylinePoint} from '../../../../../layoutPlatform/math/geometry/polylinePoint'
import {SegmentBase} from '../../visibility/segmentBase'

export abstract class ObstacleSide extends SegmentBase {
  StartVertex: PolylinePoint

  constructor(startVertex: PolylinePoint) {
    super()
    this.StartVertex = startVertex
  }

  abstract get EndVertex(): PolylinePoint

  get Polyline(): Polyline {
    return this.StartVertex.polyline
  }

  get Start(): Point {
    return this.StartVertex.point
  }

  get End(): Point {
    return this.EndVertex.point
  }
}
