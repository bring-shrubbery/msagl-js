import {ICurve} from '../../math/geometry/icurve'
import {Point} from '../../math/geometry/point'
import {FloatingPort} from './floatingPort'

export class RelativeFloatingPort extends FloatingPort {
  static mk(
    boundaryDelegate: () => ICurve,
    centerDelegate: () => Point,
  ): RelativeFloatingPort {
    return new RelativeFloatingPort(
      boundaryDelegate,
      centerDelegate,
      new Point(0, 0),
    )
  }
  centerDelegate: () => Point
  curveDelegate: () => ICurve
  ///  <summary>
  ///  the delegate returning center
  ///  </summary>
  public get CenterDelegate(): () => Point {
    return this.centerDelegate
  }
  public set CenterDelegate(value: () => Point) {
    this.centerDelegate = value
  }

  ///  <summary>
  ///  the delegate returning center
  ///  </summary>
  public get CurveDelegate(): () => ICurve {
    return this.curveDelegate
  }
  public set CurveDelegate(value: () => ICurve) {
    this.curveDelegate = value
  }
  locationOffset: Point
  //
  //         /// The node where we calculate our location and Curve from
  //
  //         public Node RelativeTo { get; private set; }
  ///  <summary>
  ///  An offset relative to the Center of the Node that we use to calculate Location
  ///  </summary>
  public get /* virtual */ LocationOffset(): Point {
    return this.locationOffset
  }
  public set /* virtual */ LocationOffset(value: Point) {
    this.locationOffset = value
  }

  ///  <summary>
  ///  Create a port relative to a specific node with an offset for the port Location from the nodes center
  ///  <param name="curveDelegate"></param>
  ///  <param name="centerDelegate"></param>
  ///  <param name="locationOffset"></param>
  ///  </summary>
  public constructor(
    curveDelegate: () => ICurve,
    centerDelegate: () => Point,
    locationOffset: Point,
  ) {
    super(null, centerDelegate().add(locationOffset))
    this.LocationOffset = locationOffset
    this.CurveDelegate = curveDelegate
    this.CenterDelegate = centerDelegate
  }

  // ///  <summary>
  // ///  Create a port relative to the center of a specific node
  // ///  </summary>
  // ///  <param name="curveDelegate"></param>
  // ///  <param name="centerDelegate"></param>
  // public constructor (curveDelegate: Func<ICurve>, centerDelegate: Func<Point>) :
  //         this(curveDelegate, centerDelegate, new Point()) {

  // }

  ///  <summary>
  ///  Get the location = CenterDelegate() + LocationOffset
  ///  </summary>
  public get /* override */ Location(): Point {
    return this.CenterDelegate().add(this.LocationOffset)
  }

  ///  <summary>
  ///  Get the curve from the node's BoundaryCurve
  ///  </summary>
  public get /* override */ Curve(): ICurve {
    return this.CurveDelegate()
  }
}
