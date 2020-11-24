import { Curve, Point } from "../models";

export function add(point1: Point, point2: Point): Point {
    return {
        x: (point1.x ?? 0) + (point2.x ?? 0),
        y: (point1.y ?? 0) + (point2.y ?? 0)
    }
}

function intersect(curveA: Curve, curveB: Curve): Point[] {
    return [{
        x: 0,
        y: 0
    }];
}