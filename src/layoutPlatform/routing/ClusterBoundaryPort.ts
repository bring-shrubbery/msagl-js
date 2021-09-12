import {ICurve, Point} from '../..'
import {RelativeFloatingPort} from '../layout/core/relativeFloatingPort'
import {Polyline} from '../math/geometry/polyline'

export class ClusterBoundaryPort extends RelativeFloatingPort {
  loosePolyline: Polyline

  get LoosePolyline(): Polyline {
    return this.loosePolyline
  }
  set LoosePolyline(value: Polyline) {
    this.loosePolyline = value
  }

  /// <summary>
  /// constructor
  /// </summary>
  /// <param name="curveDelegate"></param>
  /// <param name="centerDelegate"></param>
  /// <param name="locationOffset"></param>
  public constructor(
    curveDelegate: () => ICurve,
    centerDelegate: () => Point,
    locationOffset: Point,
  ) {
    super(curveDelegate, centerDelegate, locationOffset)
  }

  /// <summary>
  /// constructor
  /// </summary>
  /// <param name="curveDelegate"></param>
  /// <param name="centerDelegate"></param>
  public mk(curveDelegate: () => ICurve, centerDelegate: () => Point) {
    return new ClusterBoundaryPort(curveDelegate, centerDelegate, null)
  }
}
