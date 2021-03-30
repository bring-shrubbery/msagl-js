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
    LocationOffset: Point


    //  Create a port relative to a specific node with an offset for the port Location from the nodes center
    constructor(curveDelegate: () => ICurve, centerDelegate: () => Point, locationOffset: Point = new Point(0, 0)) {
        super(null, centerDelegate().add(locationOffset))
        this.LocationOffset = locationOffset;
        this.CurveDelegate = curveDelegate;
        this.CenterDelegate = centerDelegate;
    }

    get Location(): Point {
        return this.CenterDelegate().add(this.LocationOffset);
    }

    public get Curve(): ICurve {
        return this.CurveDelegate();
    }
}