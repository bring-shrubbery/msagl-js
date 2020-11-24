import { Curve, Point } from "../models";

export function addPoints(a: Point, b: Point): Point {
    //if (a implements Point && b implements Point)    
    return {
        x: a.x + b.x,
        y: a.y + b.y 
    }
    //else 
      // throw "arguments have to be points"
}

function intersect(curveA: Curve, curveB: Curve): Point[] {
    return [{
        x: 0,
        y: 0
    }];
}