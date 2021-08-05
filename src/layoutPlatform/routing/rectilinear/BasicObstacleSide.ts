//  BasicObstacleSide is base class for an obstacle side that is to the low or high end of the
//  scanline-parallel coordinate, and knows which direction to traverse to find the endVertex.
//  This is different from RightObstacleSide or LeftObstacleSide, where the class itself is the
//  determinant of traversal direction being with or opposite to the clockwise polyline direction;

import { PolylinePoint } from "../../math/geometry/polylinePoint";
import { ObstacleSide } from "../spline/coneSpanner/ObstacleSide";
import { Obstacle } from "./obstacle";

//  BasicObstacleSide uses the ctor arg traverseClockwise to manage that.
export abstract class BasicObstacleSide extends ObstacleSide {
    obstacle:Obstacle
     get Obstacle(): Obstacle {
         return this.obstacle
    }
     set Obstacle(value: Obstacle)  {
         this.obstacle = value
    }
    
    endVertex: PolylinePoint;
    slope:number
     get Slope(): number {
         return this.slope
    }
     set Slope(value: number)  {
        this.slope = value
    }
    slopeInverse:number
     get SlopeInverse(): number {
         return this.slopeInverse
    }
     set SlopeInverse(value: number)  {
         this.slopeInverse = value
    }
    
     constructor (obstacle: Obstacle, startVertex: PolylinePoint, scanDir: ScanDirection, traverseClockwise: boolean) : 
            base(startVertex) {
        this.Obstacle = obstacle;
        this.endVertex = startVertex.NextOnPolyline;
        // TODO: Warning!!!, inline IF is not supported ?
        traverseClockwise;
        startVertex.PrevOnPolyline;
        if (!scanDir.IsPerpendicular(startVertex.Point, this.endVertex.Point)) {
            this.Slope = StaticGraphUtility.Slope(startVertex.Point, this.endVertex.Point, scanDir);
            this.SlopeInverse = (1 / this.Slope);
        }
        
    }
    
     /* override */ get EndVertex(): PolylinePoint {
        return this.endVertex;
    }
}
