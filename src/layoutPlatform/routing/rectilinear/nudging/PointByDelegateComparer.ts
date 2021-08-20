import { Point } from "../../../..";
import { compareNumbers } from "../../../utils/compare";

    
export    class PointByDelegateComparer {
        
        projection: (p:Point)=>number
        
        public constructor (projection: (p:Point)=>number) {
            this.projection = projection;
        }
        
      
        public Compare(x: Point, y: Point): number {
            return compareNumbers(this.projection(x),this.projection(y));
        }
    }
}
 