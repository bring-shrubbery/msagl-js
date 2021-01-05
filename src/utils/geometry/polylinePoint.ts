import { get, set } from "lodash";
import { Point } from "./point";
import { Polyline } from "./polyline";

export class PolylinePoint {
    point: Point;
    private next: PolylinePoint;
    private prev: PolylinePoint;
    polyline: Polyline;

    // 
    getNext(): PolylinePoint {
        return this.next;
    }

    setNext(nVal: PolylinePoint) {
        this.next = nVal;
        if (this.polyline != null)
            this.polyline.requireInit();
    }

    // 
    getPrev() { return this.prev; }
    setPrev(prevVal: PolylinePoint) {
        this.prev = prevVal;
        if (this.polyline != null)
            this.polyline.requireInit();
    }


    static mkPolylinePoint(p: Point) {
        const pp = new PolylinePoint();
        pp.point = p.clone();
        return pp;
    }

}


