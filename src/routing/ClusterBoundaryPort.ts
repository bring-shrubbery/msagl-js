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

    public constructor(curveDelegate: () => ICurve, centerDelegate: () => Point, locationOffset: Point = new Point(0, 0)) {
        super(curveDelegate, centerDelegate, locationOffset)
    }

}