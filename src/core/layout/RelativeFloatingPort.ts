import { Curve } from "../../math/geometry/curve";
import { ICurve } from "../../math/geometry/icurve";
import { Point } from "../../math/geometry/point";
import { FloatingPort } from "./FloatingPort";

export class RelativeFloatingPort extends FloatingPort {

    //  the delegate returning center
    CenterDelegate: () => Point
    CurveDelegate: () => ICurve

    // The node where we calculate our location and Curve from
    //  An offset relative to the Center of the Node that we use to calculate Location
    //  </summary>
    LocationOffset: Point


    //  Create a port relative to a specific node with an offset for the port Location from the nodes center
    constructor(curveDelegate: () => ICurve, centerDelegate: () => Point, locationOffset: Point) {
        super(null, centerDelegate().add(locationOffset))
        this.LocationOffset = locationOffset;
        this.CurveDelegate = curveDelegate;
        this.CenterDelegate = centerDelegate;
    }

    //  <summary>
    //  Create a port relative to the center of a specific node
    //  </summary>
    //  <param name="curveDelegate"></param>
    //  <param name="centerDelegate"></param>
    public static constructor_(curveDelegate: () => ICurve, centerDelegate: () => Point) {
        return new RelativeFloatingPort(curveDelegate, centerDelegate, new Point(0, 0))
    }

    get Location(): Point {
        return this.CenterDelegate().add(this.LocationOffset);
    }

    //  <summary>
    //  Get the curve from the node's BoundaryCurve
    //  </summary>
    public /* override */ get Curve(): ICurve {
        return this.CurveDelegate();
    }
}