import { RelativeFloatingPort } from "../core/layout/RelativeFloatingPort";
import { ICurve } from "../math/geometry/icurve";
import { Point } from "../math/geometry/point";
import { Polyline } from "../math/geometry/polyline";

// this is a port for routing from a cluster
export class ClusterBoundaryPort extends RelativeFloatingPort {

    loosePolyline: Polyline;

    get LoosePolyline(): Polyline {
        return this.loosePolyline;
    }
    set LoosePolyline(value: Polyline) {
        this.loosePolyline = value;
    }

    public constructor(curveDelegate: () => ICurve, centerDelegate: () => Point, locationOffset: Point) {
        super(curveDelegate, centerDelegate, locationOffset)
    }

    // <summary>
    // constructor 
    // </summary>
    // <param name="curveDelegate"></param>
    // <param name="centerDelegate"></param>
    public constructor(curveDelegate: Func<ICurve>, centerDelegate: Func<Point>):
        base(curveDelegate, centerDelegate) {

        }
}