import { Point } from './point';
import { ICurve } from './icurve';
// Contains the result of the intersection of two ICurves.
export class IntersectionInfo {
    /* The following should hold:
     * X=seg0[par0]=seg1[par1]
     */

    par0: number;
    par1: number;
    x: Point; // the intersection point

    seg0: ICurve;
    seg1: ICurve;
    /// the constructor
    constructor(pr0: number, pr1: number, x: Point, s0: ICurve, s1: ICurve) {
        this.par0 = pr0;
        this.par1 = pr1;
        this.x = x;
        this.seg0 = s0;
        this.seg1 = s1;
        //            System.Diagnostics.Debug.Assert(ApproximateComparer.Close(x, s0[pr0], ApproximateComparer.IntersectionEpsilon*10),
        //                  string.Format("intersection not at curve[param]; x = {0}, s0[pr0] = {1}, diff = {2}", x, s0[pr0], x - s0[pr0]));
        //        System.Diagnostics.Debug.Assert(ApproximateComparer.Close(x, s1[pr1], ApproximateComparer.IntersectionEpsilon*10),
        //              string.Format("intersection not at curve[param]; x = {0}, s1[pr1] = {1}, diff = {2}", x, s1[pr1], x - s1[pr1]));
    }
}
