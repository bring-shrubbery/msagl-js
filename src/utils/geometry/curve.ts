import { ICurve } from './icurve';
import { PN, PNInternal, PNLeaf } from './parallelogramNode';
import { Point } from './point';
import { LineSegment } from './lineSegment';
import { IntersectionInfo } from './intersectionInfo';
import { Assert } from './../assert';
import { Parallelogram, allVerticesOfParall } from './parallelogram';
import { Ellipse } from './ellipse';
import { Polyline } from './polyline';
import { GeomConstants } from './geomConstants';
import { LinearSystem2 } from './linearSystem';
import { MinDistCurveCurve } from './minDistCurveCurve'
type SegParam = {
    seg: ICurve,
    par: number
};

function segParamValue(sp: SegParam) {
    return sp.seg.value(sp.par);
}

function segParamDerivative(sp: SegParam) {
    return sp.seg.derivative(sp.par);
}

function segParamSecondDerivative(sp: SegParam) {
    return sp.seg.secondDerivative(sp.par);
}

function segParamThirdDerivative(sp: SegParam) {
    return sp.seg.thirdDerivative(sp.par);
}


type SegIndexParam = {
    segIndex: number,
    par: number
};

enum PointLocation { Outside, Boundary, Inside };

export class Curve {
    // fields
    parEnd_: number;

    pBNode: PN;
    //the parameter domain is [0,parEnd_] where parEnd_ is the sum (seg.parEnd() - seg.parStart()) over all segment in this.segs
    segs: ICurve[];


    static lengthWithInterpolationAndThreshold(seg: ICurve, eps: number): number {
        throw 'not implemented';
        return 0;
    }
    static lengthWithInterpolation(seg: ICurve): number {
        throw 'not implemented';
        return 0;
    }

    parStart() {
        return 0;
    }
    parEnd() {
        return this.parEnd_;
    }



    // this[Reverse[t]]=this[ParEnd+ParStart-t]
    reverse() {
        const ret = new Curve(this.segs.length);
        for (let i = this.segs.length - 1; i >= 0; i--) ret.addSegment(this.segs[i].reverse());
        return ret;
    }

    // Constructs the curve for a given number of segments
    constructor(capacity: number) {
        this.segs = new Array(capacity);
        this.parEnd_ = 0;
    }

    mkCurveWithSegs(segs: ICurve[]) {
        this.segs = segs;
        for (const s of segs) this.parEnd_ += Curve.paramSpan(s);
    }

    start() {
        return this.segs[0].start();
    }

    end() {
        return this.segs[this.segs.length - 1].end();
    }

    // Returns the trim curve
    trim(start: number, end: number) {
        this.adjustStartEndEndParametersToDomain(start, end);

        const s = this.getSegIndexParam(start);

        const e = this.getSegIndexParam(end);

        if (s.segIndex == e.segIndex)
            return this.segs[s.segIndex].trim(s.par, e.par);

        var c = new Curve(e.segIndex - s.segIndex + 1);

        if (s.par < this.segs[s.segIndex].parEnd())
            c = c.addSegment(this.segs[s.segIndex].trim(s.par, this.segs[s.segIndex].parEnd()));

        for (let i = e.segIndex + 1; i < e.segIndex; i++)
            c = c.addSegment(this.segs[i]);

        if (this.segs[e.segIndex].parStart() < e.par)
            c = c.addSegment(this.segs[e.segIndex].trim(this.segs[e.segIndex].parStart(), e.par));

        return c;
    }

    adjustStartEndEndParametersToDomain(start: number, end: number) {
        if (start > end) {
            const t = start;
            start = end;
            end = t;
        }

        if (start < this.parStart())
            start = this.parStart();

        if (end > this.parEnd())
            end = this.parEnd();

    }

    // Returns the trimmed curve, wrapping around the end if start is greater than end.
    trimWithWrap(start: number, end: number) {
        Assert.assert(start >= this.parStart() && start <= this.parEnd());
        Assert.assert(end >= this.parStart() && end <= this.parEnd());
        if (start < end)
            return this.trim(start, end) as Curve;

        Assert.assert(Point.closeDistEps(this.start(), this.end())); // Curve must be closed to wrap
        var c = new Curve(2);
        c.addSegment(this.trim(start, this.parEnd()) as Curve);
        c.addSegment(this.trim(this.parStart(), end) as Curve);
        return c;
    }


    // Adds a segment to the curve
    addSegment(curve: ICurve) {
        if (curve == null) return this; //nothing happens
        Assert.assert(this.segs.length == 0 || !Point.close(this.end(), curve.start(), 0.001));
        if (!(curve instanceof Curve)) {
            this.segs.push(curve);
            this.parEnd_ += Curve.paramSpan(curve);
        } else {
            for (const cc of (curve as Curve).segs) {
                this.segs.push(cc);
                this.parEnd_ += Curve.paramSpan(cc);
            }
        }
        return this;
    }

    addSegs(a: ICurve, b: ICurve) {
        return this.addSegment(a).addSegment(b);
    }

    addFourSegs(a: ICurve, b: ICurve, c: ICurve, d: ICurve) {
        return this.addSegs(a, b).addSegs(c, d);
    }

    // A tree of ParallelogramNodes covering the curve.
    // This tree is used in curve intersections routines.
    pNodeOverICurve() {
        if (this.pBNode != null) return this.pBNode;

        this.pBNode = {
            seg: this,
            node: {
                children: [],
            },
        };
        const internalNode = this.pBNode.node as PNInternal;
        const parallelograms: Parallelogram[] = [];
        for (const curveSeg of this.segs) {
            const pBoxNode = curveSeg.pNodeOverICurve();
            parallelograms.push(pBoxNode.parallelogram);
            internalNode.children.push(pBoxNode);
        }
        this.pBNode.parallelogram = Parallelogram.getParallelogramOfAGroup(parallelograms);

        return this.pBNode;
    }



    // finds an intersection between to curves, 
    static curveCurveIntersectionOne(curve0: ICurve, curve1: ICurve, liftIntersection: boolean) {
        Assert.assert(curve0 != curve1, "curve0 == curve1");
        //            number c0S = curve0.parStart(), c1S = curve1.parStart();
        //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
        //                number mc0 = 0.5 * (curve0.parStart() + curve0.parEnd());
        //                number mc1 = 0.5 * (curve1.parStart() + curve1.parEnd());
        //                number c0E = curve0.parEnd();
        //                if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1)) {
        //                    number c1E = curve1.parEnd();
        //                    CurvesAreCloseAtParams(curve0, curve1, c0E, c1E);
        //                    throw new InvalidOperationException();
        //                }
        //            }
        //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

        let ret = Curve.curveCurveXWithParallelogramNodesOne(curve0.pNodeOverICurve(),
            curve1.pNodeOverICurve());

        if (liftIntersection && ret != null)
            ret = Curve.liftIntersectionToCurves(curve0, curve1, ret);

        return ret;
    }

    // calculates all intersections between curve0 and curve1
    static getAllIntersections(curve0: ICurve, curve1: ICurve, liftIntersections: boolean): IntersectionInfo[] {

        //            var c0S = curve0.parStart();
        //            var c1S = curve1.parStart();
        //            var c0E = curve0.parEnd();
        //            var c1E = curve1.parEnd();
        //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
        //                if (CurvesAreCloseAtParams(curve0, curve1, c0E, c1E)) {
        //                    var mc0 = 0.5*(curve0.parStart() + curve0.parEnd());
        //                    var mc1 = 0.5*(curve1.parStart() + curve1.parEnd());
        //                    if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1))
        //                        throw new InvalidOperationException();
        //                }
        //            }


        var lineSeg = curve0 as LineSegment;
        if (lineSeg != null)
            return Curve.getAllIntersectionsOfLineAndICurve(lineSeg, curve1, liftIntersections);

        return Curve.getAllIntersectionsInternal(curve0, curve1, liftIntersections);
    }


    static getAllIntersectionsInternal(curve0: ICurve, curve1: ICurve,
        liftIntersections: boolean): IntersectionInfo[] {
        //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

        const intersections: IntersectionInfo[] = new Array();
        Curve.curveCurveXWithParallelogramNodes(curve0.pNodeOverICurve(), curve1.pNodeOverICurve(),
            intersections);

        if (liftIntersections)
            for (let i = 0; i < intersections.length; i++)
                intersections[i] = Curve.liftIntersectionToCurves(curve0, curve1, intersections[i]);


        return intersections;
    }

    static getAllIntersectionsOfLineAndICurve(lineSeg: LineSegment, iCurve: ICurve,
        liftIntersections: boolean): IntersectionInfo[] {
        var poly = iCurve as Polyline;
        if (poly != null)
            return Curve.getAllIntersectionsOfLineAndPolyline(lineSeg, poly);

        var curve = iCurve as Curve;
        if (curve != null)
            return Curve.getAllIntersectionsOfLineAndCurve(lineSeg, curve, liftIntersections);

        var ellipse = iCurve as Ellipse;
        if (ellipse != null && ellipse.isArc())
            return Curve.getAllIntersectionsOfLineAndArc(lineSeg, ellipse);

        return Curve.getAllIntersectionsInternal(lineSeg, iCurve, liftIntersections);
    }

    static getAllIntersectionsOfLineAndCurve(lineSeg: LineSegment, curve: Curve, liftIntersections: boolean): IntersectionInfo[] {
        const ret: IntersectionInfo[] = new Array();
        var lineParallelogram = lineSeg.pNodeOverICurve();
        var curveParallelogramRoot = curve.pNodeOverICurve();
        if (Parallelogram.intersect(lineParallelogram.parallelogram, curveParallelogramRoot.parallelogram) == false)
            return ret;
        var parOffset = 0.0;
        for (const seg of curve.segs) {
            var iiList = Curve.getAllIntersections(lineSeg, seg, false);
            if (liftIntersections) {
                for (var intersectionInfo of iiList) {
                    intersectionInfo.par1 += parOffset - seg.parStart();
                    intersectionInfo.seg1 = curve;
                }
                parOffset += seg.parEnd() - seg.parStart();
            }
            for (var intersectionInfo of iiList) {
                if (!Curve.alreadyInside(ret, intersectionInfo))
                    ret.push(intersectionInfo);
            }
        }

        return ret;
    }

    static closeIntersections(x: IntersectionInfo, y: IntersectionInfo) {
        return Point.close(x.x, y.x, GeomConstants.intersectionEpsilon);
    }

    static closeIntersectionPoints(x: Point, y: Point) {
        return Point.close(x, y, GeomConstants.intersectionEpsilon);
    }

    static alreadyInside(ret: IntersectionInfo[], intersectionInfo: IntersectionInfo): boolean {
        for (let i = 0; i < ret.length; i++) {
            var ii = ret[i];
            if (Curve.closeIntersections(ii, intersectionInfo))
                return true;
        }
        return false;
    }

    static getAllIntersectionsOfLineAndArc(lineSeg: LineSegment, ellipse: Ellipse): IntersectionInfo[] {
        Assert.assert(ellipse.isArc());
        let lineDir = lineSeg.end().minus(lineSeg.start());
        const ret: IntersectionInfo[] = new Array();
        const segLength = lineDir.length();
        // the case of a very short LineSegment
        if (segLength < GeomConstants.distanceEpsilon) {
            const lsStartMinCen = lineSeg.start().minus(ellipse.center);
            if (Point.closeD(lsStartMinCen.length(), ellipse.aAxis.length())) {
                let angle = Point.angle(ellipse.aAxis, lsStartMinCen);
                if (ellipse.parStart() - GeomConstants.tolerance <= angle) {
                    angle = Math.max(angle, ellipse.parStart());
                    if (angle <= ellipse.parEnd() + GeomConstants.tolerance) {
                        angle = Math.min(ellipse.parEnd(), angle);
                        ret.push(new IntersectionInfo(0, angle, lineSeg.start(), lineSeg, ellipse));
                    }
                }
            }
            return ret;
        }

        const perp = lineDir.rotate90Ccw().div(segLength);
        const segProjection = lineSeg.start().minus(ellipse.center).dot(perp);
        const closestPointOnLine = ellipse.center.add(perp.mult(segProjection));

        const rad = ellipse.aAxis.length();
        const absSegProj = Math.abs(segProjection);
        if (rad < absSegProj - GeomConstants.distanceEpsilon)
            return ret; //we don't have an intersection
        lineDir = perp.rotate90Cw();
        if (Point.closeD(rad, absSegProj)) {
            Curve.tryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine, segLength, lineDir);
        } else {
            Assert.assert(rad > absSegProj);
            const otherLeg = Math.sqrt(rad * rad - segProjection * segProjection);
            const d = lineDir.mult(otherLeg);
            Curve.tryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine.add(d),
                segLength, lineDir);
            Curve.tryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine.minus(d),
                segLength, lineDir);
        }
        return ret;
    }

    static tryToAddPointToLineCircleCrossing(lineSeg: LineSegment,
        ellipse: Ellipse, ret: IntersectionInfo[], point: Point, segLength: number, lineDir: Point) {
        const ds = point.minus(lineSeg.start());
        let t = ds.dot(lineDir);
        if (t < -GeomConstants.distanceEpsilon)
            return;
        t = Math.max(t, 0);
        if (t > segLength + GeomConstants.distanceEpsilon)
            return;
        t = Math.min(t, segLength);
        t /= segLength;

        let angle = Point.angle(ellipse.aAxis, point.minus(ellipse.center));
        if (ellipse.parStart() - GeomConstants.tolerance <= angle) {
            angle = Math.max(angle, ellipse.parStart());
            if (angle <= ellipse.parEnd() + GeomConstants.tolerance) {
                angle = Math.min(ellipse.parEnd(), angle);
                ret.push(new IntersectionInfo(t, angle, point, lineSeg, ellipse));
            }
        }
    }

    static getAllIntersectionsOfLineAndPolyline(lineSeg: LineSegment, poly: Polyline) {
        var ret: IntersectionInfo[] = new Array();
        let offset = 0.0;
        let par0: number;
        let par1: number;
        let x: Point;
        let polyPoint = poly.startPoint;

        for (; polyPoint != null && polyPoint.getNext() != null; polyPoint = polyPoint.getNext()) {
            if (Curve.crossTwoLineSegs(lineSeg.start(), lineSeg.end(), polyPoint.point, polyPoint.getNext().point, 0, 1, 0, 1,
                par0, par1, x)) {
                Curve.adjustSolution(lineSeg.start(), lineSeg.end(), polyPoint.point, polyPoint.getNext().point, par0, par1,
                    x);
                if (!Curve.oldIntersection(ret, x))
                    ret.push(new IntersectionInfo(par0, offset + par1, x, lineSeg, poly));
            }
            offset++;
        }
        if (poly.isClosed())
            if (Curve.crossTwoLineSegs(lineSeg.start(), lineSeg.end(), polyPoint.point, poly.start(), 0, 1, 0, 1, par0,
                par1, x)) {
                Curve.adjustSolution(lineSeg.start(), lineSeg.end(), polyPoint.point, poly.start(), par0, par1, x);
                if (!Curve.oldIntersection(ret, x))
                    ret.push(new IntersectionInfo(par0, offset + par1, x, lineSeg, poly));
            }

        return ret;
    }

    static adjustSolution(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point, par0: number, par1: number,
        x: Point) {
        //adjust the intersection if it is close to the ends of the segs
        if (Curve.closeIntersectionPoints(x, aStart)) {
            x = aStart;
            par0 = 0;
        }
        else if (Curve.closeIntersectionPoints(x, aEnd)) {
            x = aEnd;
            par0 = 1;
        }

        if (Curve.closeIntersectionPoints(x, bStart)) {
            x = bStart;
            par1 = Math.floor(par1);
        }
        else if (Curve.closeIntersectionPoints(x, bEnd)) {
            x = bEnd;
            par1 = Math.ceil(par1);
        }
    }

    static curveCurveXWithParallelogramNodesOne(n0: PN, n1: PN) {
        if (!Parallelogram.intersect(n0.parallelogram, n1.parallelogram))
            return null;

        var n0Pb = n0.node as PNInternal;
        var n1Pb = n1.node as PNInternal;
        if (n0Pb != null && n1Pb != null)
            for (const n00 of n0Pb.children)
                for (const n11 of n1Pb.children) {
                    const x = Curve.curveCurveXWithParallelogramNodesOne(n00, n11);
                    if (x != null) return x;
                }
        else if (n1Pb != null)
            for (const n of n1Pb.children) {
                const x = Curve.curveCurveXWithParallelogramNodesOne(n0, n);
                if (x != null) return x;
            }
        else if (n0Pb != null)
            for (const n of n0Pb.children) {
                const x = Curve.curveCurveXWithParallelogramNodesOne(n, n1);
                if (x != null) return x;
            }
        else
            return Curve.crossOverIntervalsOne(n0, n1);

        return null;
    }


    static curveCurveXWithParallelogramNodes(n0: PN,
        n1: PN,
        intersections: IntersectionInfo[]) {
        if (!Parallelogram.intersect(n0.parallelogram, n1.parallelogram))
            // Boxes n0.Box and n1.Box do not intersect
            return;
        var n0Pb = n0.node as PNInternal;
        var n1Pb = n1.node as PNInternal;
        if (n0Pb != null && n1Pb != null)
            for (const n00 of n0Pb.children)
                for (const n11 of n1Pb.children)
                    Curve.curveCurveXWithParallelogramNodes(n00, n11, intersections);
        else if (n1Pb != null)
            for (const n of n1Pb.children)
                Curve.curveCurveXWithParallelogramNodes(n0, n, intersections);
        else if (n0Pb != null)
            for (const n of n0Pb.children)
                Curve.curveCurveXWithParallelogramNodes(n, n1, intersections);
        else intersections = Curve.crossOverIntervals(n0, n1, intersections);
    }

    static crossOverIntervalsOne(n0: PN, n1: PN): IntersectionInfo | undefined {
        //both are leafs 
        const l0 = n0.node as PNLeaf;
        const l1 = n1.node as PNLeaf;
        const d0 = (l0.high - l0.low) / 2;
        const d1 = (l1.high - l1.low) / 2;

        for (let i = 1; i < 2; i++) {
            const p0 = i * d0 + l0.low;
            for (let j = 1; j < 2; j++) {
                const p1 = j * d1 + l1.low;
                let aSol: number;
                let bSol: number;
                let x: Point;
                let r: boolean;
                if (l0.chord == null && l1.chord == null)
                    r = Curve.crossWithinIntervalsWithGuess(n0.seg, n1.seg, l0.low, l0.high, l1.low, l1.high,
                        p0, p1, aSol, bSol, x);
                else if (l0.chord != null && l1.chord == null) {
                    r = Curve.crossWithinIntervalsWithGuess(l0.chord, n1.seg, 0, 1, l1.low, l1.high,
                        0.5 * i, p1, aSol, bSol, x);
                    if (r) {

                    }
                }
                else if (l0.chord == null) {
                    r = Curve.crossWithinIntervalsWithGuess(n0.seg, l1.chord,
                        l0.low, l0.high, 0, 1, p0,
                        0.5 * j, aSol, bSol, x);
                    if (r) {
                        bSol = l1.low + bSol * (l1.high - l1.low);;
                    }
                }
                else //if (l0.chord != null && l1.chord != null)
                {
                    r = Curve.crossWithinIntervalsWithGuess(l0.chord, l1.chord,
                        0, 1, 0, 1, 0.5 * i,
                        0.5 * j, aSol, bSol, x);
                    if (r) {
                        aSol = l0.low + aSol * (l0.high - l0.low);
                        bSol = l1.low + bSol * (l1.high - l1.low);
                    }
                }

                if (r) {
                    return Curve.createIntersectionOne(l0, l1, aSol, bSol, x);
                }
            }
        }

        return Curve.goDeeperOne(l0, l1);
    }

    /*    static crossOverIntervals(n0: PN, n1: PN,
            intersections: IntersectionInfo[]) {
            //both are leafs 
            var l0 = n0 as ParallelogramLeaf;
            var l1 = n1 as ParallelogramLeaf;
            const d0 = (l0.high - l0.low) / 2;
            const d1 = (l1.high - l1.low) / 2;
            let found = false;
    
            for (int i = 1; i < 2; i++) {
                number p0 = i * d0 + l0.low;
                for (int j = 1; j < 2; j++) {
                    number p1 = j * d1 + l1.low;
    
    
                    number aSol, bSol;
                    Point x;
    
    
                    boolean r;
                    if (l0.chord == null && l1.chord == null)
                        r = Curve.crossWithinIntervalsWithGuess(n0.seg, n1.seg, l0.low, l0.high, l1.low, l1.high,
                            p0, p1, out aSol, out bSol, out x);
                    else if (l0.chord != null && l1.chord == null) {
                        r = Curve.crossWithinIntervalsWithGuess(l0.chord, n1.seg, 0, 1, l1.low, l1.high,
                            0.5 * i,
                            p1, out aSol, out bSol, out x);
                        if (r)
                            aSol = l0.low + aSol * (l0.high - l0.low);
                    }
                    else if (l0.chord == null) {
                        //&& l1.chord != null) 
                        r = Curve.crossWithinIntervalsWithGuess(n0.seg, l1.chord,
                            l0.low, l0.high, 0, 1, p0,
                            0.5 * j, out aSol, out bSol, out x);
                        if (r)
                            bSol = l1.low + bSol * (l1.high - l1.low);
                    }
                    else //if (l0.chord != null && l1.chord != null)
                    {
                        r = Curve.crossWithinIntervalsWithGuess(l0.chord, l1.chord,
                            0, 1, 0, 1, 0.5 * i,
                            0.5 * j, out aSol, out bSol, out x);
                        if (r) {
                            bSol = l1.low + bSol * (l1.high - l1.low);
                            aSol = l0.low + aSol * (l0.high - l0.low);
                        }
                    }
    
                    if (r) {
                        AddIntersection(l0, l1, intersections, aSol, bSol, x);
                        found = true;
                    }
                }
            }
    
            if (!found)
                GoDeeper(ref intersections, l0, l1);
            return intersections;
        }
    
        static addIntersection(n0: PNLeaf, n1: PNLeaf, intersections: IntersectionInfo[],
            aSol: number, bSol: number, x: Point) {
            //adjust the intersection if it is close to the ends of the segs
            if (Curve.closeIntersections(x, n0.seg[n0.low])) {
                x = n0.seg[n0.low];
                aSol = n0.low;
            }
            else if (Curve.closeIntersections(x, n0.seg[n0.high])) {
                x = n0.seg[n0.high];
                aSol = n0.high;
            }
    
            if (Curve.closeIntersections(x, n1.seg[n1.low])) {
                x = n1.seg[n1.low];
                bSol = n1.low;
            }
            else if (Curve.closeIntersections(x, n1.seg[n1.high])) {
                x = n1.seg[n1.high];
                bSol = n1.high;
            }
    
            const oldIntersection = Curve.oldIntersection(intersections, x);
            if (!oldIntersection) {
                var xx = new IntersectionInfo(aSol, bSol, x, n0.seg, n1.seg);
                intersections.Add(xx);
            }
    
            return;
        }
    
        // returns true if the intersection exists already
        static oldIntersection(intersections: IntersectionInfo[], x: Point) {
            //we don't expect many intersections so it's ok just go through all of them
            for (const ii of intersections)
                if (x.minus(ii.x).length() < GeomConstants.distanceEpsilon * 100)
                //please no close intersections
                {
                    return true;
                }
            return false;
        }
    
        static createIntersectionOne(n0: ParallelogramLeaf, n1: ParallelogramLeaf,
            aSol: number, bSol: number, x: Point) {
            //adjust the intersection if it is close to the ends of the segs
            if (Curve.closeIntersections(x, n0.seg[n0.low])) {
                x = n0.seg[n0.low];
                aSol = n0.low;
            }
            else if (Curve.closeIntersections(x, n0.seg[n0.high])) {
                x = n0.seg[n0.high];
                aSol = n0.high;
            }
    
            if (Curve.closeIntersections(x, n1.seg[n1.low])) {
                x = n1.seg[n1.low];
                bSol = n1.low;
            }
            else if (Curve.closeIntersections(x, n1.seg[n1.high])) {
                x = n1.seg[n1.high];
                bSol = n1.high;
            }
    
            return new IntersectionInfo(aSol, bSol, x, n0.seg, n1.seg);
        }
    
        static liftIntersectionToCurves_(
            c0: ICurve, c1: ICurve, aSol: number, bSol: number, x: Point, seg0: ICurve, seg1: ICurve) {
            const a = this.liftParameterToCurve(c0, aSol - seg0.parStart(), seg0);
            const b = this.liftParameterToCurve(c1, bSol - seg1.parStart(), seg1);
            return new IntersectionInfo(a, b, x, c0, c1);
        }
         
        static IntersectionInfo DropIntersectionToSegs(IntersectionInfo xx) {
        ICurve seg0;
        number par0;
        
        if (xx.segment0 is Curve)
        (xx.segment0 as Curve).this.getSegmentAndParameter(xx.Par0, out par0, out seg0);
        else {
            par0 = xx.Par0;
            seg0 = xx.segment0;
        }
        
        ICurve seg1;
        number par1;
        
        if (xx.seg1 is Curve)
        (xx.seg1 as Curve).this.getSegmentAndParameter(xx.par1, out par1, out seg1);
        else {
            par1 = xx.par1;
            seg1 = xx.seg1;
        }
        
        return new IntersectionInfo(par0, par1, xx.intersectionPoint, seg0, seg1);
        }
        */

    static liftIntersectionToCurves(c0: ICurve, c1: ICurve, xx: IntersectionInfo) {
        return Curve.liftIntersectionToCurves_(c0, c1, xx.par0, xx.par1, xx.x, xx.seg0, xx.seg1);
    }

    static liftParameterToCurve(curve: ICurve, par: number, seg: ICurve) {
        if (curve == seg)
            return par;

        const c = curve as Curve;

        if (c != null) {
            let offset = 0;
            for (const s of c.segs) {
                if (s == seg)
                    return par + offset;
                offset += Curve.paramSpan(s);
            }
        }
        throw "bug in liftParameterToCurve";
    }

    static paramSpan(s: ICurve) {
        return s.parEnd() - s.parStart();
    }

    /*
        static goDeeperOne(l0: PNLeaf, l1: PNLeaf): IntersectionInfo {
            number eps = GeomConstants.distanceEpsilon;
            // did not find an intersection
            if (l0.LeafBoxesOffset > eps && l1.LeafBoxesOffset > eps) {
                // going deeper on both with offset l0.LeafBoxesOffset / 2, l1.LeafBoxesOffset / 2
                PN nn0 = PN.CreateParallelogramNodeForCurveSeg(
                    l0.low, l0.high, l0.seg, l0.LeafBoxesOffset / 2);
                PN nn1 = PN.CreateParallelogramNodeForCurveSeg(
                    l1.low, l1.high, l1.seg, l1.LeafBoxesOffset / 2);
                return Curve.curveCurveXWithParallelogramNodesOne(nn0, nn1);
            }
            if (l0.LeafBoxesOffset > eps) {
                // go deeper on the left
                PN nn0 = PN.CreateParallelogramNodeForCurveSeg(
                    l0.low, l0.high, l0.seg, l0.LeafBoxesOffset / 2);
                return Curve.curveCurveXWithParallelogramNodesOne(nn0, l1);
            }
            if (l1.LeafBoxesOffset > eps) {
                // go deeper on the right
                PN nn1 = PN.CreateParallelogramNodeForCurveSeg(
                    l1.low, l1.high, l1.seg, l1.LeafBoxesOffset / 2);
                return Curve.curveCurveXWithParallelogramNodesOne(l0, nn1);
            }
            //just cross LineSegs and adjust the solutions if the segments are not straight lines
            Point l0Low = l0.seg[l0.low];
            Point l0High = l0.seg[l0.high];
            if (!GeomConstants.Close(l0Low, l0High)) {
                Point l1Low = l1.seg[l1.low];
                Point l1High = l1.seg[l1.high];
                if (!GeomConstants.Close(l1Low, l1High)) {
                    LineSegment ls0 = l0.seg is LineSegment ? l0.seg as LineSegment : new LineSegment(l0Low, l0High);
                    LineSegment ls1 = l1.seg is LineSegment ? l1.seg as LineSegment : new LineSegment(l1Low, l1High);
    
                    number asol, bsol;
                    Point x;
                    boolean r = Curve.crossWithinIntervalsWithGuess(ls0, ls1, 0, 1, 0, 1, 0.5, 0.5, out asol, out bsol, out x);
                    if (r) {
                        AdjustParameters(l0, ls0, l1, ls1, x, ref asol, ref bsol);
                        return CreateIntersectionOne(l0, l1, asol, bsol, x);
                    }
                }
            }
            return null;
        }
        
       static void GoDeeper(ref List < IntersectionInfo > intersections, ParallelogramLeaf l0, ParallelogramLeaf l1) {
       number eps = GeomConstants.distanceEpsilon;
       // did not find an intersection
       if (l0.LeafBoxesOffset > eps && l1.LeafBoxesOffset > eps) {
           // going deeper on both with offset l0.LeafBoxesOffset / 2, l1.LeafBoxesOffset / 2
           PN nn0 = PN.CreateParallelogramNodeForCurveSeg(
               l0.low, l0.high, l0.seg, l0.LeafBoxesOffset / 2);
           PN nn1 = PN.CreateParallelogramNodeForCurveSeg(
               l1.low, l1.high, l1.seg, l1.LeafBoxesOffset / 2);
           curveCurveXWithParallelogramNodes(nn0, nn1, ref intersections);
       }
       else if (l0.LeafBoxesOffset > eps) {
           // go deeper on the left
           PN nn0 = PN.CreateParallelogramNodeForCurveSeg(
               l0.low, l0.high, l0.seg, l0.LeafBoxesOffset / 2);
           curveCurveXWithParallelogramNodes(nn0, l1, ref intersections);
       }
       else if (l1.LeafBoxesOffset > eps) {
           // go deeper on the right
           PN nn1 = PN.CreateParallelogramNodeForCurveSeg(
               l1.low, l1.high, l1.seg, l1.LeafBoxesOffset / 2);
           curveCurveXWithParallelogramNodes(l0, nn1, ref intersections);
       }
       else {
           //just cross LineSegs since the polylogramms are so thin
           Point l0Low = l0.seg[l0.low];
           Point l0High = l0.seg[l0.high];
           if (!GeomConstants.Close(l0Low, l0High)) {
               Point l1Low = l1.seg[l1.low];
               Point l1High = l1.seg[l1.high];
               if (!GeomConstants.Close(l1Low, l1High)) {
                   LineSegment ls0 = l0.seg is LineSegment ? l0.seg as LineSegment : new LineSegment(l0Low, l0High);
                   LineSegment ls1 = l1.seg is LineSegment ? l1.seg as LineSegment : new LineSegment(l1Low, l1High);
        
                   number asol, bsol;
                   Point x;
                   boolean r = Curve.crossWithinIntervalsWithGuess(ls0, ls1, 0, 1, 0, 1, 0.5, 0.5, out asol, out bsol, out x);
                   if (r) {
                       AdjustParameters(l0, ls0, l1, ls1, x, ref asol, ref bsol);
                       AddIntersection(l0, l1, intersections, asol, bsol, x);
                   }
               }
           }
       }
       }
        
        
       static void AdjustParameters(ParallelogramLeaf l0, LineSegment ls0, ParallelogramLeaf l1, LineSegment ls1,
       Point x, ref number asol, ref number bsol) {
       if (ls0 != l0.seg && l0.seg is Polyline == false) //l0.seg is not a LineSegment and not a polyline
       asol = l0.seg.ClosestParameter(x); //we need to find the correct parameter
       else
       asol = l0.low + asol * (l0.high - l0.low);
       if (ls1 != l1.seg && l1.seg is Polyline == false) //l1.seg is not a LineSegment and not a polyline
       bsol = l1.seg.ClosestParameter(x); //we need to find the correct parameter
       else
       bsol = l1.low + bsol * (l1.high - l1.low);
       }
        
       static number lineSegThreshold = 0.05;
        
       // The distance between the start and end point of a curve segment for which we consider the segment as a line segment
       public static number LineSegmentThreshold {
       get { return lineSegThreshold; }
       set { lineSegThreshold = value; }
       }
       */
    // returns the segment correspoinding to t and the segment parameter
    getSegParam(t: number): SegParam {
        let u = this.parStart(); //u is the sum of param domains
        for (let sg of this.segs) {
            const nextu = u + sg.parEnd() - sg.parStart();
            if (t >= u && t <= nextu) {
                return {
                    par: t - u + sg.parStart(),
                    seg: sg
                }
            }
            u = nextu;
        }
        const lastSeg = this.segs[this.segs.length - 1];
        return {
            seg: lastSeg,
            par: lastSeg.parEnd()
        }
    }

    getSegIndexParam(t: number): SegIndexParam {
        let u = 0; //u is the sum of param domains
        const segLen = this.segs.length;
        for (let i = 0; i < segLen; i++) {
            var sg = this.segs[i];
            const nextu = u + sg.parEnd() - sg.parStart();
            if (t >= u && t <= nextu) {
                return {
                    segIndex: i,
                    par: t - u + sg.parStart()
                };
            }
            u = nextu;
        }
        const lastSeg = this.segs[segLen - 1];
        return {
            segIndex: segLen - 1,
            par: lastSeg.parEnd()
        }
    }


    // Returns the point on the curve corresponding to parameter t
    value(t: number) { return segParamValue(this.getSegParam(t)); }
    // first derivative at t
    derivative(t: number) { return segParamDerivative(this.getSegParam(t)); }
    // second derivative
    secondDerivative(t: number) { return segParamSecondDerivative(this.getSegParam(t)); }
    // third derivative
    thirdDerivative(t: number) { return segParamThirdDerivative(this.getSegParam(t)); }


    // For curves A(s) and B(t), when we have some evidence that 
    //  there is at most one intersection point, and we have a guess for the parameters (s0, t0)...
    // You are trying to bring to (0,0) the vector F(s,t) = A(s) - B(t).  To minimize the length of F(s,t) 
    // we solve the system of equations: 
    //F*Fs + (F*Fss + Fs*Fs)ds + (F*Fst + Fs*Ft)dt = 0
    //F*Ft + (F*Fst + Fs*Ft)ds + (F*Ftt + Ft*Ft)dt = 0
    // 
    //Where F = F(si,ti), Fs and Ft are the first partials at si, ti, Fxx are the second partials, 
    //    and s(i+1) = si+ds, t(i+1) = ti+dt. 
    //We adjust ds and dt to stay in the domain.

    static crossWithinIntervalsWithGuess(
        a: ICurve, b: ICurve,
        amin: number, amax: number,
        bmin: number, bmax: number,
        aGuess: number,
        bGuess: number,
        aSolution: number,
        bSolution: number, x: Point): boolean {
        let aPoint: Point;
        let bPoint: Point;
        let r: boolean;
        if (a instanceof LineSegment && b instanceof LineSegment) {
            r = Curve.minDistWithinIntervals(a,
                b,
                amin,
                amax, bmin,
                bmax,
                aGuess, bGuess,
                aSolution,
                bSolution, aPoint, bPoint);


            x = Point.middle(aPoint, bPoint);
            const aMinusB = aPoint.minus(bPoint);

            return r && aMinusB.dot(aMinusB) < GeomConstants.distanceEpsilon * GeomConstants.distanceEpsilon;
        }
    }


    static crossTwoLineSegs(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point, amin: number, amax: number,
        bmin: number, bmax: number, aSolution: number, bSolution: number, x: Point) {
        const u = aEnd.minus(aStart);
        const v = bStart.minus(bEnd);
        const w = bStart.minus(aStart);
        const sol = LinearSystem2.solve(u.x, v.x, w.x, u.y, v.y, w.y);
        if (sol == undefined)
            return false;
        aSolution = sol.x;
        bSolution = sol.y;
        if (aSolution < amin - GeomConstants.tolerance)
            return false;

        aSolution = Math.max(aSolution, amin);

        if (aSolution > amax + GeomConstants.tolerance)
            return false;

        aSolution = Math.min(aSolution, amax);

        if (bSolution < bmin - GeomConstants.tolerance)
            return false;

        bSolution = Math.max(bSolution, bmin);

        if (bSolution > bmax + GeomConstants.tolerance)
            return false;

        bSolution = Math.min(bSolution, bmax);

        //  if(!GeomConstants.Close(x,B[bSolution]))
        //  throw new InvalidOperationException();// ("segs");
        return true;
    }
    /*
        // Decides if the point lies inside, outside or on the curve
        PointRelativeToCurveLocation(Point point, ICurve curve) {
            if (!curve.BoundingBox.Contains(point))
                return PointLocation.Outside;
    
            number l = 2 * curve.BoundingBox.Diagonal; //l should be big enough for the line to exit outside of the curve
    
            const number degree = Math.PI / 180.0;
            int inside = 0;
            for (int i = 13; i < 360; i += 13) {
                var lineDir = new Point(Math.Cos(i * degree), Math.Sin(i * degree));
                var ls = new LineSegment(point, point + l * lineDir);
    
                IList < IntersectionInfo > intersections = GetAllIntersections(ls, curve, true);
    
    
                //SugiyamaLayoutSettings.Show(ls, curve);
                // CurveSerializer.Serialize("cornerC:\\tmp\\ls",ls);
                // CurveSerializer.Serialize("cornerC:\\tmp\\pol",curve);
                if (AllIntersectionsAreGood(intersections, curve)) {
                    for (IntersectionInfo xx in intersections)
                        if (GeomConstants.Close(xx.intersectionPoint, point))
                            return PointLocation.Boundary;
                    boolean insideThisTime = intersections.length % 2 == 1;
                    //to be on the safe side we need to get the same result at least twice
                    if (insideThisTime)
                        inside++;
                    else
                        inside--;
    
                    if (inside >= 2)
                        return PointLocation.Inside;
                    if (inside <= -2)
                        return PointLocation.Outside;
                }
            }
            //if all intersections are not good then we probably have the point on the boundaryCurve
    
            return PointLocation.Boundary;
        }
    
        /*
              //    static boolean debug;
              static boolean AllIntersectionsAreGood(IList<IntersectionInfo> intersections, ICurve polygon) {
              // If this isn't a Curve, try a Polyline.
              //TODO: fix this to avoid the cast
              var polyCurve = polygon as Curve;
              if (null == polyCurve) {
              var polyLine = polygon as Polyline;
              if (null != polyLine)
              polyCurve = polyLine.ToCurve();
              }
              if (null != polyCurve)
              for (IntersectionInfo xx in intersections)
              if (!RealCut(DropIntersectionToSegs(xx), polyCurve, false))
              return false;
              return true;
              }
        
        
              // Returns true if curves do not touch in the intersection point
              // only when the second curve cuts the first one from the inside</param>
              public static boolean RealCutWithClosedCurve(IntersectionInfo xx, Curve polygon, boolean onlyFromInsideCuts) {
              ValidateArg.IsNotNull(xx, "xx");
              ValidateArg.IsNotNull(polygon, "polygon");
              ICurve sseg = xx.segment0;
              ICurve pseg = xx.seg1;
              number spar = xx.Par0;
              number ppar = xx.par1;
              Point x = xx.intersectionPoint;
        
              //normalised tangent to spline
              Point ts = sseg.derivative(spar).Normalize();
              Point pn = pseg.derivative(ppar).Normalize().Rotate(Math.PI/2);
        
              if (GeomConstants.Close(x, pseg.end())) {
              //so pseg enters the spline 
              ICurve exitSeg = null;
              for (int i = 0; i < polygon.segs.length; i++)
              if (polygon.segs[i] == pseg) {
              exitSeg = polygon.segs[(i + 1)%polygon.segs.length];
              break;
              }
        
              if (exitSeg == null)
              throw new InvalidOperationException(); //"exitSeg==null");
        
              Point tsn = ts.Rotate((Math.PI/2));
        
              boolean touch = (tsn*pseg.derivative(pseg.parEnd()))*(tsn*exitSeg.derivative(exitSeg.parStart())) <
              GeomConstants.tolerance;
        
              return !touch;
              }
        
              if (GeomConstants.Close(x, pseg.start())) {
              //so pseg exits the spline 
              ICurve enterSeg = null;
              for (int i = 0; i < polygon.segs.length; i++)
              if (polygon.segs[i] == pseg) {
              enterSeg = polygon.segs[i > 0 ? (i - 1) : polygon.segs.length - 1];
              break;
              }
        
              Point tsn = ts.Rotate((Math.PI/2));
              boolean touch = (tsn*pseg.derivative(pseg.parStart()))*
              (tsn*enterSeg.derivative(enterSeg.parEnd())) < GeomConstants.tolerance;
        
              return !touch;
              }
        
              number d = ts*pn;
              if (onlyFromInsideCuts)
              return d > GeomConstants.distanceEpsilon;
              return Math.Abs(d) > GeomConstants.distanceEpsilon;
              }
        
              // 
              public static boolean RealCut(IntersectionInfo xx, Curve polyline, boolean onlyFromInsideCuts) {
              ValidateArg.IsNotNull(xx, "xx");
              ValidateArg.IsNotNull(polyline, "polyline");
              ICurve sseg = xx.segment0;
              ICurve pseg = xx.seg1;
              number spar = xx.Par0;
              number ppar = xx.par1;
              Point x = xx.intersectionPoint;
        
        
              //normalised tangent to spline
              Point ts = sseg.derivative(spar).Normalize();
              Point pn = pseg.derivative(ppar).Normalize().Rotate(Math.PI/2);
        
              if (GeomConstants.Close(x, pseg.end())) {
              //so pseg enters the spline 
              ICurve exitSeg = null;
              for (int i = 0; i < polyline.segs.length - 1; i++)
              if (polyline.segs[i] == pseg) {
              exitSeg = polyline.segs[i + 1];
              break;
              }
        
              if (exitSeg == null)
              return false; //hit the end of the polyline
        
              Point tsn = ts.Rotate((Math.PI/2));
        
              boolean touch = (tsn*pseg.derivative(pseg.parEnd()))*(tsn*exitSeg.derivative(exitSeg.parStart())) <
              GeomConstants.tolerance;
        
              return !touch;
              }
        
              if (GeomConstants.Close(x, pseg.start())) {
              //so pseg exits the spline 
              ICurve enterSeg = null;
              for (int i = polyline.segs.length - 1; i > 0; i--)
              if (polyline.segs[i] == pseg) {
              enterSeg = polyline.segs[i - 1];
              break;
              }
              if (enterSeg == null)
              return false;
              Point tsn = ts.Rotate((Math.PI/2));
              boolean touch = (tsn*pseg.derivative(pseg.Parstart()))*
              (tsn*enterSeg.derivative(enterSeg.parEnd())) < GeomConstants.tolerance;
        
              return !touch;
              }
        
              number d = ts*pn;
              if (onlyFromInsideCuts)
              return d > GeomConstants.distanceEpsilon;
              return Math.Abs(d) > GeomConstants.distanceEpsilon;
              }
        */
    static minDistWithinIntervals(
        a: ICurve, b: ICurve, aMin: number, aMax: number, bMin: number, bMax: number,
        aGuess: number, bGuess: number, aSolution: number, bSolution: number, aPoint: Point, bPoint: Point) {
        var md = new MinDistCurveCurve(a, b, aMin, aMax, bMin, bMax, aGuess, bGuess);
        md.solve();
        aSolution = md.aSolution;
        aPoint = md.aPoint;
        bSolution = md.bSolution;
        bPoint = md.bPoint;

        return md.status;
    }
    /*
          #if DEBUGCURVES
          public override string ToString()
          {
          boolean poly = true;
          for (ICurve s in segs)
          if (s is LineSeg == false)
          {
          poly = false;
          break;
          }
    
          string ret;
          if (!poly)
          {
          ret = "{";
    
          for (ICurve seg in Segs)
          {
          ret += seg + ",";
          }
    
    
          return ret + "}";
          }
          ret = "{";
          if (segs.length > 0)
          ret += segs[0].start().x.ToString() + "," + segs[0].start().y.ToString()+" ";
          for(LineSeg s in segs)
          ret += s.end().x.ToString() + "," + s.end().y.ToString() + " ";
          return ret + "}";
          }
          #endif
    
          // Offsets the curve in the direction of dir
          public ICurve OffsetCurve(number offset, Point dir) {
          return null;
          }
    
          // The bounding rectangle of the curve
          public Rectangle BoundingBox {
          get {
          if (segs.length == 0)
          return new Rectangle(0, 0, -1, -1);
          #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=369 there are no structs in js
          Rectangle b = segs[0].BoundingBox.Clone();
          #else
          Rectangle b = segs[0].BoundingBox;
          #endif
          for (int i = 1; i < segs.length; i++)
          b.Add(segs[i].BoundingBox);
    
          return b;
          }
          }
    
          #region ICurve Members
    
          // clones the curve. 
          public ICurve Clone() {
          var c = new Curve(segs.length);
          for (ICurve seg in segs)
          c.addSegment(seg.Clone());
          return c;
          }
    
          #endregion
    
          #region ICurve Members
    
          // 
          public number GetParameterAtLength(number length) {
          var parSpan = 0.0;
          for (var seg in segs) {
          var segL = seg.length;
          if (segL >= length)
          return parSpan+seg.GetParameterAtLength(length);
    
          length -= segL;
          parSpan += seg.parEnd() - seg.parStart();
          }
          return parEnd();
          }
    
          // returns a parameter t such that the distance between curve[t] and targetPoint is minimal 
          // and t belongs to the closed segment [low,high]
          public number ClosestParameterWithinBounds(Point targetPoint, number low, number high) {
          number par = 0;
          number dist = Double.MaxValue;
          number offset = 0;
          for (ICurve seg in segs) {
          if (offset > high)
          break; //we are out of the [low, high] segment
          number segparamSpan = paramSpan(seg);
          number segEnd = offset + segparamSpan;
          if (segEnd >= low) {
          //we are in business
          number segLow = Math.max(seg.parStart(), seg.parStart() + (low - offset));
          number segHigh = Math.Min(seg.parEnd(), seg.parStart() + (high - offset));
          Assert.assert(segHigh >= segLow);
          number t = seg.ClosestParameterWithinBounds(targetPoint, segLow, segHigh);
          Point d = targetPoint - seg[t];
          number dd = d*d;
          if (dd < dist) {
          par = offset + t - seg.parStart();
          dist = dd;
          }
          }
          offset += segparamSpan;
          }
          return par;
          }
    
          // returns a parameter t such that the distance between curve[t] and a is minimal
          public number ClosestParameter(Point targetPoint) {
          number par = 0;
          number dist = Double.maxValue;
          number offset = 0;
          for (ICurve c in segs) {
          number t = c.ClosestParameter(targetPoint);
          Point d = targetPoint - c[t];
          number dd = d*d;
          if (dd < dist) {
          par = offset + t - c.parStart();
          dist = dd;
          }
          offset += paramSpan(c);
          }
          return par;
          }
    
          #endregion
    
          #region Curve concatenations
    
          //adds a line segment to the curve
          public static Curve AddLineSegment(Curve curve, Point pointA, Point pointB) {
          ValidateArg.IsNotNull(curve, "curve");
          return curve.addSegment(new LineSegment(pointA, pointB));
          }
    
    
          //static internal void AddLineSegment(Curve c, number x, number y, Point b) {
          //    AddLineSegment(c, new Point(x, y), b);
          //}
    
          // adds a line segment to the curve
          public static void AddLineSegment(Curve curve, number x0, number y0, number x1, number y1) {
          AddLineSegment(curve, new Point(x0, y0), new Point(x1, y1));
          }
    
          // adds a line segment to the curve
          public static void ContinueWithLineSegment(Curve c, number x, number y) {
          ValidateArg.IsNotNull(c, "c");
          AddLineSegment(c, c.end(), new Point(x, y));
          }
    
          // adds a line segment to the curve
          public static void ContinueWithLineSegment(Curve c, Point x) {
          ValidateArg.IsNotNull(c, "c");
          AddLineSegment(c, c.end(), x);
          }
    
          // 
          public static void CloseCurve(Curve curve) {
          ValidateArg.IsNotNull(curve, "curve");
          ContinueWithLineSegment(curve, curve.start());
          }
    
          #endregion
    
          // left derivative at t
          public Point Leftderivative(number t) {
          ICurve seg = TryToGetLeftSegment(t);
          if (seg != null)
          return seg.derivative(seg.parEnd());
          return derivative(t);
          }
    
          // right derivative at t
          public Point Rightderivative(number t) {
          ICurve seg = TryToGetRightSegment(t);
          if (seg != null)
          return seg.derivative(seg.parStart());
          return derivative(t);
          }
    
    
          ICurve TryToGetLeftSegment(number t) {
          if (Math.Abs(t - parStart()) < GeomConstants.tolerance) {
          if (Start == End)
          return segs[segs.length - 1];
          return null;
          }
          for (ICurve seg in segs) {
          t -= paramSpan(seg);
          if (Math.Abs(t) < GeomConstants.tolerance)
          return seg;
          }
          return null;
          }
    
          ICurve TryToGetRightSegment(number t) {
          if (Math.Abs(t - parEnd()) < GeomConstants.tolerance) {
          if (Start == End)
          return segs[0];
          return null;
          }
    
          for (ICurve seg in segs) {
          if (Math.Abs(t) < GeomConstants.tolerance)
          return seg;
    
          t -= paramSpan(seg);
          }
          return null;
          }
    
          // gets the closest point together with its parameter
          public static number ClosestParameterWithPoint(ICurve curve, Point location, out Point pointOnCurve) {
          ValidateArg.IsNotNull(curve, "curve");
          number t = curve.ClosestParameter(location);
          pointOnCurve = curve[t];
          return t;
          }
    
          // gets the point on the curve that is closest to the given point
          public static Point ClosestPoint(ICurve curve, Point location) {
          ValidateArg.IsNotNull(curve, "curve");
          return curve[curve.ClosestParameter(location)];
          }
    
          // Tests whether the first curve is inside the second.
          // We suppose that the curves are convex and they are 
          // not degenerated into a point
          public static boolean CurveIsInsideOther(ICurve innerCurve, ICurve outerCurve) {
          ValidateArg.IsNotNull(innerCurve, "innerCurve");
          ValidateArg.IsNotNull(outerCurve, "outerCurve");
          if (!outerCurve.BoundingBox.Contains(innerCurve.BoundingBox)) return false;
          IList<IntersectionInfo> xx = GetAllIntersections(innerCurve, outerCurve, true);
          if (xx.length == 0) return NonIntersectingCurveIsInsideOther(innerCurve, outerCurve);
          if (xx.length == 1) //it has to be a touch
          return innerCurve.start() != xx[0].intersectionPoint
          ? PointRelativeToCurveLocation(innerCurve.start(), outerCurve) == PointLocation.Inside
          : PointRelativeToCurveLocation(innerCurve[(innerCurve.parStart() + innerCurve.parEnd())/2],
          outerCurve) == PointLocation.Inside;
          return
          PointsBetweenIntersections(innerCurve, xx).All(
          p => PointRelativeToCurveLocation(p, outerCurve) != PointLocation.Outside);
          }
    
          // Return points between but not including the intersections.
          internal static IEnumerable<Point> PointsBetweenIntersections(ICurve a, IList<IntersectionInfo> xx) {
          xx.OrderBy(x => x.Par0);
          for (int i = 0; i < xx.length - 1; i++)
          yield return a[(xx[i].Par0 + xx[i + 1].Par0)/2];
          //take care of the last interval
          number start = xx[xx.length - 1].Par0;
          number end = xx[0].Par0;
          number len = a.parEnd() - start + end - a.parStart();
          number middle = start + len/2;
          if (middle > a.parEnd())
          middle = a.parStart() + middle - a.parEnd();
          yield return a[middle];
          }
    
          static boolean NonIntersectingCurveIsInsideOther(ICurve a, ICurve b) {
          ValidateArg.IsNotNull(a, "a");
          ValidateArg.IsNotNull(b, "b");
          // Due to rounding, even curves with 0 intersections may return Boundary.
          for (number par = a.parStart(); par < a.parEnd(); par += 0.5) {
          // continue as long as we have boundary points.
          PointLocation parLoc = PointRelativeToCurveLocation(a[par], b);
          if (PointLocation.Boundary != parLoc) return PointLocation.Inside == parLoc;
          }
    
          // All points so far were on border so it is not considered inside; test the End.
          return PointLocation.Outside != PointRelativeToCurveLocation(a.end(), b);
          }
    
          // Tests whether the interiors of two closed convex curves intersect
          public static boolean ClosedCurveInteriorsIntersect(ICurve curve1, ICurve curve2) {
          ValidateArg.IsNotNull(curve1, "curve1");
          ValidateArg.IsNotNull(curve2, "curve2");
          if (!curve2.BoundingBox.intersects(curve1.BoundingBox))
          return false;
          IList<IntersectionInfo> xx = GetAllIntersections(curve1, curve2, true);
          if (xx.length == 0)
          return NonIntersectingCurveIsInsideOther(curve1, curve2) ||
          NonIntersectingCurveIsInsideOther(curve2, curve1);
          if (xx.length == 1) //it is a touch
          return curve1.start() != xx[0].intersectionPoint
          ? PointRelativeToCurveLocation(curve1.start(), curve2) == PointLocation.Inside
          : PointRelativeToCurveLocation(curve1[(curve1.parStart() + curve1.parEnd())/2], curve2) ==
          PointLocation.Inside ||
          curve2.start() != xx[0].intersectionPoint
          ? PointRelativeToCurveLocation(curve2.start(), curve1) == PointLocation.Inside
          : PointRelativeToCurveLocation(curve2[(curve2.parStart() + curve2.parEnd())/2], curve1) ==
          PointLocation.Inside;
          return
          PointsBetweenIntersections(curve1, xx).Any(
          p => PointRelativeToCurveLocation(p, curve2) == PointLocation.Inside);
          }
    
          #region ICurve Members
    
          // 
          public number Curvature(number t) {
          ICurve seg;
          number par;
          getSegParam(t, out par, out seg);
          return seg.Curvature(par);
          }
    
          // 
          public number Curvaturederivative(number t) {
          throw new NotImplementedException();
          }
    
          // 
          public number CurvaturesecondDerivative(number t) {
          throw new NotImplementedException();
          }
    
          #endregion
    
          public static boolean CurvesIntersect(ICurve curve1, ICurve curve2) {
          return curve1 == curve2 || (CurveCurveIntersectionOne(curve1, curve2, false) != null);
          }
    
          internal static CubicBezierSegment CreateBezierSeg(number kPrev, number kNext, Site a, Site b, Site c) {
          Point s = kPrev*a.Point + (1 - kPrev)*b.Point;
          Point e = kNext*c.Point + (1 - kNext)*b.Point;
          Point t = (2.0/3.0)*b.Point;
          return new CubicBezierSegment(s, s/3.0 + t, t + e/3.0, e);
          }
    
          internal static CubicBezierSegment CreateBezierSeg(Point a, Point b, Point perp, int i) {
          Point d = perp*i;
          return new CubicBezierSegment(a, a + d, b + d, b);
          }
    
          internal static boolean FindCorner(Site a, out Site b, out Site c) {
          c = null; // to silence the compiler
          b = a.getNext();
          if (b.getNext() == null)
          return false; //no corner has been found
          c = b.getNext();
          return c != null;
          }
    
          internal static ICurve trimEdgeSplineWithNodeBoundaries(ICurve sourceBoundary,
          ICurve targetBoundary, ICurve spline,
          boolean narrowestInterval) {
          
          var start = spline.parStart();
          var end = spline.parEnd();
          if (sourceBoundary != null)
          FindNewStart(spline, ref start, sourceBoundary, narrowestInterval);
          if (targetBoundary != null)
          FindNewEnd(spline, targetBoundary, narrowestInterval, ref end);
    
          number st = Math.min(start, end);
          number en = Math.max(start, end);
          return st < en ? spline.trim(st, en) : spline;
          }
    
          static void FindNewEnd(ICurve spline, ICurve targetBoundary, boolean narrowestInterval, ref number end) {
          //SugiyamaLayoutSettings.Show(c, spline);
          IList<IntersectionInfo> intersections = GetAllIntersections(spline, targetBoundary, true);
          if (intersections.length == 0) {
          end = spline.parEnd();
          return;
          }
          if (narrowestInterval) {
          end = spline.parEnd();
          for (IntersectionInfo xx in intersections)
          if (xx.Par0 < end)
          end = xx.Par0;
          }
          else {
          //looking for the last intersection
          end = spline.parStart();
          for (IntersectionInfo xx in intersections)
          if (xx.Par0 > end)
          end = xx.Par0;
          }
          }
    
          static void FindNewStart(ICurve spline, ref number start, ICurve sourceBoundary, boolean narrowestInterval) {
          IList<IntersectionInfo> intersections = GetAllIntersections(spline, sourceBoundary, true);
          if (intersections.length == 0) {
          start = spline.parStart();
          return;
          }
          if (narrowestInterval) {
          start = spline.parStart();
          for (IntersectionInfo xx in intersections)
          if (xx.Par0 > start)
          start = xx.Par0;
          }
          else {
          start = spline.parEnd();
          for (IntersectionInfo xx in intersections)
          if (xx.Par0 < start)
          start = xx.Par0;
          }
          }
    
          // 
          public static Polyline PolylineAroundClosedCurve(ICurve curve) {
          Polyline ret;
          var ellipse = curve as Ellipse;
          if (ellipse != null)
          ret = RefineEllipse(ellipse);
          else {
          var poly = curve as Polyline;
          if (poly != null)
          return poly;
          var c = curve as Curve;
          if (c != null && AllSegsAreLines(c)) {
          ret = new Polyline();
          for (LineSegment ls in c.segs)
          ret.AddPoint(ls.start());
          ret.isClosed = true;
          if (!ret.IsClockwise())
          ret = (Polyline) ret.Reverse();
          }
          else
          ret = StandardRectBoundary(curve);
          }
          return ret;
          }
    
          static boolean AllSegsAreLines(Curve c) {
          for (ICurve s in c.segs)
          if (!(s is LineSegment))
          return false;
          return true;
          }
    
          // this code only works for the standard ellipse
          static Polyline RefineEllipse(Ellipse ellipse) {
          Polyline rect = StandardRectBoundary(ellipse);
          var dict = new SortedDictionary<number, Point>();
          number a = Math.PI/4;
          number w = ellipse.BoundingBox.Width;
          number h = ellipse.BoundingBox.Height;
          number l = Math.sgrt(w*w + h*h);
          for (int i = 0; i < 4; i++) {
          number t = a + i*Math.PI/2; // parameter
          Point p = ellipse[t]; //point on the ellipse
          Point tan = l*(ellipse.derivative(t).Normalize()); //make it long enough
    
          var ls = new LineSegment(p - tan, p + tan);
          for (IntersectionInfo ix in GetAllIntersections(rect, ls, true))
          dict[ix.Par0] = ix.intersectionPoint;
          }
    
          Assert.assert(dict.length > 0);
          return new Polyline(dict.Values) {Closed = true};
          }
    
          internal static Polyline StandardRectBoundary(ICurve curve) {
          Rectangle bbox = curve.BoundingBox;
          return bbox.Perimeter();
          }
    
          // Create a closed Polyline from a rectangle
          public static Polyline PolyFromBox(Rectangle rectangle) {
          var p = new Polyline();
          p.AddPoint(rectangle.LeftTop);
          p.AddPoint(rectangle.RightTop);
          p.AddPoint(rectangle.RightBottom);
          p.AddPoint(rectangle.LeftBottom);
          p.setIsClosed(true);
          return p;
          }
    
        */
}

// a, b are parameters of the curve
function isCloseToLineSeg(a: number, ap: Point, b: number, bp: Point, s: ICurve, e: number): boolean {
    Assert.assert(Point.closeDistEps(s.value(a), ap));
    Assert.assert(Point.closeDistEps(s.value(b), bp));

    for (const x of [1 / 3, 0.5, 2 / 3]) {
        const p = a * x + b * (1 - x); // the parameter on the curve s
        if (!Point.closeSquare(s.value(p), Point.mkPoint(x, ap, 1 - x, bp), e)) return false;
    }

    return true;
}

// interpolates the curve between parameters 'a' and 'b' by a sequence of line segments
function interpolate(a: number, ap: Point, b: number, bp: Point, s: ICurve, eps: number): LineSegment[] {
    Assert.assert(Point.closeDistEps(s.value(a), ap));
    Assert.assert(Point.closeDistEps(s.value(b), bp));
    const r = new Array<LineSegment>(0);
    if (isCloseToLineSeg(a, ap, b, bp, s, eps)) r.push(LineSegment.lineSegmentStartEnd(ap, bp));
    else {
        const m = 0.5 * (a + b);
        const mp = s.value(m);
        r.concat(interpolate(a, ap, m, mp, s, eps));
        r.concat(interpolate(m, mp, b, bp, s, eps));
    }
    return r;
}

// this function always produces at least two segments
function interpolateWithAtLeastTwoSegs(eps: number, a: number, ap: Point, b: number, bp: Point, s: ICurve) {
    const m = (a + b) / 2;
    const mp = s.value(m);
    const ret = interpolate(a, ap, m, mp, s, eps * eps);
    ret.concat(interpolate(m, mp, b, bp, s, eps * eps));
    return ret;
}

function interpolateICurve(s: ICurve, eps: number) {
    return interpolate(s.parStart(), s.start(), s.parEnd(), s.end(), s, eps);
}
