import {ICurve, Point, Polyline} from '../math/geometry'
import {RelativeFloatingPort} from '../layout/core/relativeFloatingPort'

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
