import {ICurve} from './icurve'
import {PN, PNInternal, PNLeaf, ParallelogramNode} from './parallelogramNode'
import {allVerticesOfParall} from './parallelogram'
import {Point} from './point'
import {LineSegment} from './lineSegment'
import {IntersectionInfo} from './intersectionInfo'
import {Assert} from './../../utils/assert'
import {Parallelogram} from './parallelogram'
import {Ellipse} from './ellipse'
import {Polyline} from './polyline'
import {GeomConstants} from './geomConstants'
import {LinearSystem2} from './linearSystem'
import {MinDistCurveCurve} from './minDistCurveCurve'
import {Rectangle} from './rectangle'
import {PlaneTransformation} from './planeTransformation'
import {SvgDebugWriter} from './svgDebugWriter'
import {DebugCurve} from './debugCurve'
import {BezierSeg} from './bezierSeg'
import {CornerSite} from './cornerSite'
type Params = {
  start: number
  end: number
}

type SegParam = {
  seg: ICurve
  par: number
}

type SegIndexParam = {
  segIndex: number
  par: number
}

export type MinDistOutput = {
  aSol: number
  bSol: number
  aX: Point
  bX: Point
}

type CurveCrossOutput = {
  aSol: number
  bSol: number
  x: Point
}

function segParamValue(sp: SegParam) {
  return sp.seg.value(sp.par)
}

function segParamDerivative(sp: SegParam) {
  return sp.seg.derivative(sp.par)
}

function segParamSecondDerivative(sp: SegParam) {
  return sp.seg.secondDerivative(sp.par)
}

function segParamThirdDerivative(sp: SegParam) {
  return sp.seg.thirdDerivative(sp.par)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
enum PointLocation {
  Outside,
  Boundary,
  Inside,
}

export class Curve implements ICurve {
  // fields
  parEnd_: number

  pBNode: PN
  //the parameter domain is [0,parEnd_] where parEnd_ is the sum (seg.parEnd - seg.parStart()) over all segment in this.segs
  segs: ICurve[]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static lengthWithInterpolationAndThreshold(
    _seg: ICurve,
    _eps: number,
  ): number {
    throw 'not implemented'
    return 0
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static lengthWithInterpolation(_seg: ICurve): number {
    throw 'not implemented'
    return 0
  }

  get parStart() {
    return 0
  }
  get parEnd() {
    return this.parEnd_
  }

  lengthPartial(start: number, end: number) {
    const params = {
      start: start,
      end: end,
    }

    this.adjustStartEndEndParametersToDomain(params)
    const si = this.getSegIndexParam(start)
    const ej = this.getSegIndexParam(end)
    if (si.segIndex < ej.segIndex) {
      let seg = this.segs[si.segIndex]
      let ret = seg.lengthPartial(si.par, seg.parEnd)
      for (let k = si.segIndex + 1; k < ej.segIndex; k++)
        ret += this.segs[k].length

      seg = this.segs[ej.segIndex]
      return ret + seg.lengthPartial(seg.parStart, ej.par)
    } else {
      throw new Error('not implemented.')
    }
  }

  // this[Reverse[t]]=this[ParEnd+ParStart-t]
  reverse() {
    const ret = new Curve()
    for (let i = this.segs.length - 1; i >= 0; i--)
      ret.addSegment(this.segs[i].reverse())
    return ret
  }

  // Constructs the curve for a given number of segments
  constructor() {
    this.segs = []
    this.parEnd_ = 0
  }

  mkCurveWithSegs(segs: ICurve[]) {
    this.segs = segs
    for (const s of segs) this.parEnd_ += Curve.paramSpan(s)
  }

  get start() {
    return this.segs[0].start
  }

  get end() {
    return this.segs[this.segs.length - 1].end
  }

  scaleFromOrigin(xScale: number, yScale: number) {
    const c = new Curve()
    for (const s of this.segs) c.addSegment(s.scaleFromOrigin(xScale, yScale))
    return c
  }

  // Returns the trim curve
  trim(start: number, end: number): ICurve {
    const params = {
      start: start,
      end: end,
    }
    this.adjustStartEndEndParametersToDomain(params)

    const s = this.getSegIndexParam(params.start)

    const e = this.getSegIndexParam(params.end)

    if (s.segIndex == e.segIndex)
      return this.segs[s.segIndex].trim(s.par, e.par)

    let c = new Curve()

    if (s.par < this.segs[s.segIndex].parEnd)
      c = c.addSegment(
        this.segs[s.segIndex].trim(s.par, this.segs[s.segIndex].parEnd),
      )

    for (let i = e.segIndex + 1; i < e.segIndex; i++)
      c = c.addSegment(this.segs[i])

    if (this.segs[e.segIndex].parStart < e.par)
      c = c.addSegment(
        this.segs[e.segIndex].trim(this.segs[e.segIndex].parStart, e.par),
      )

    return c
  }

  translate(delta: Point) {
    for (const s of this.segs) s.translate(delta)
    this.pBNode = null
  }

  adjustStartEndEndParametersToDomain(params: Params) {
    if (params.start > params.end) {
      const t = params.start
      params.start = params.end
      params.end = t
    }

    if (params.start < this.parStart) params.start = this.parStart

    if (params.end > this.parEnd) params.end = this.parEnd
  }

  // Returns the trimmed curve, wrapping around the end if start is greater than end.
  trimWithWrap(start: number, end: number) {
    Assert.assert(start >= this.parStart && start <= this.parEnd)
    Assert.assert(end >= this.parStart && end <= this.parEnd)
    if (start < end) return this.trim(start, end) as Curve

    Assert.assert(Point.closeDistEps(this.start, this.end)) // Curve must be closed to wrap
    const c = new Curve()
    c.addSegment(this.trim(start, this.parEnd) as Curve)
    c.addSegment(this.trim(this.parStart, end) as Curve)
    return c
  }

  addSegs(segs: ICurve[]) {
    for (const s of segs) this.addSegment(s)
  }

  // Adds a segment to the curve
  addSegment(curve: ICurve) {
    if (curve == null) return this //nothing happens
    Assert.assert(
      this.segs.length == 0 || Point.close(this.end, curve.start, 0.001),
    )
    if (!(curve instanceof Curve)) {
      this.segs.push(curve)
      this.parEnd_ += Curve.paramSpan(curve)
    } else {
      for (const cc of (curve as Curve).segs) {
        this.segs.push(cc)
        this.parEnd_ += Curve.paramSpan(cc)
      }
    }
    return this
  }

  // A tree of ParallelogramNodes covering the curve.
  // This tree is used in curve intersections routines.
  pNodeOverICurve() {
    if (this.pBNode != null) return this.pBNode

    const parallelograms: Parallelogram[] = []
    const childrenNodes: PN[] = []
    for (const curveSeg of this.segs) {
      const pBoxNode = curveSeg.pNodeOverICurve()
      parallelograms.push(pBoxNode.parallelogram)
      childrenNodes.push(pBoxNode)
    }

    this.pBNode = {
      parallelogram: Parallelogram.getParallelogramOfAGroup(parallelograms),
      seg: this,
      leafBoxesOffset: GeomConstants.defaultLeafBoxesOffset,
      node: {children: childrenNodes},
    }

    return this.pBNode
  }

  // finds an intersection between to curves,
  static intersectionOne(
    curve0: ICurve,
    curve1: ICurve,
    liftIntersection: boolean,
  ) {
    Assert.assert(curve0 != curve1)
    //            number c0S = curve0.parStart, c1S = curve1.parStart;
    //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
    //                number mc0 = 0.5 * (curve0.parStart + curve0.parEnd);
    //                number mc1 = 0.5 * (curve1.parStart + curve1.parEnd);
    //                number c0E = curve0.parEnd;
    //                if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1)) {
    //                    number c1E = curve1.parEnd;
    //                    CurvesAreCloseAtParams(curve0, curve1, c0E, c1E);
    //                    throw new InvalidOperationException();
    //                }
    //            }
    //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

    let ret = Curve.curveCurveXWithParallelogramNodesOne(
      curve0.pNodeOverICurve(),
      curve1.pNodeOverICurve(),
    )

    if (liftIntersection && ret != null)
      ret = Curve.liftIntersectionToCurves(curve0, curve1, ret)

    return ret
  }

  // calculates all intersections between curve0 and curve1
  static getAllIntersections(
    curve0: ICurve,
    curve1: ICurve,
    liftIntersections: boolean,
  ): IntersectionInfo[] {
    //            var c0S = curve0.parStart;
    //            var c1S = curve1.parStart;
    //            var c0E = curve0.parEnd;
    //            var c1E = curve1.parEnd;
    //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
    //                if (CurvesAreCloseAtParams(curve0, curve1, c0E, c1E)) {
    //                    var mc0 = 0.5*(curve0.parStart + curve0.parEnd);
    //                    var mc1 = 0.5*(curve1.parStart + curve1.parEnd);
    //                    if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1))
    //                        throw new InvalidOperationException();
    //                }
    //            }

    if (curve0 instanceof LineSegment) {
      return Curve.getAllIntersectionsOfLineAndICurve(
        curve0,
        curve1,
        liftIntersections,
      )
    }
    return Curve.getAllIntersectionsInternal(curve0, curve1, liftIntersections)
  }

  static getAllIntersectionsInternal(
    curve0: ICurve,
    curve1: ICurve,
    liftIntersections: boolean,
  ): IntersectionInfo[] {
    //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

    const intersections: IntersectionInfo[] = []
    Curve.curveCurveXWithParallelogramNodes(
      curve0.pNodeOverICurve(),
      curve1.pNodeOverICurve(),
      intersections,
    )

    if (liftIntersections)
      for (let i = 0; i < intersections.length; i++) {
        intersections[i] = Curve.liftIntersectionToCurves(
          curve0,
          curve1,
          intersections[i],
        )
      }
    return intersections
  }

  static getAllIntersectionsOfLineAndICurve(
    lineSeg: LineSegment,
    iCurve: ICurve,
    liftIntersections: boolean,
  ): IntersectionInfo[] {
    if (iCurve instanceof Polyline)
      return Curve.getAllIntersectionsOfLineAndPolyline(lineSeg, iCurve)

    if (iCurve instanceof Curve)
      return Curve.getAllIntersectionsOfLineAndCurve(
        lineSeg,
        iCurve,
        liftIntersections,
      )

    if (iCurve instanceof Ellipse && (iCurve as Ellipse).isArc())
      return Curve.getAllIntersectionsOfLineAndArc(lineSeg, iCurve)

    return Curve.getAllIntersectionsInternal(lineSeg, iCurve, liftIntersections)
  }
  // empty comment for testing
  static getAllIntersectionsOfLineAndCurve(
    lineSeg: LineSegment,
    curve: Curve,
    liftIntersections: boolean,
  ): IntersectionInfo[] {
    const ret: IntersectionInfo[] = []
    const lineParallelogram = lineSeg.pNodeOverICurve()
    const curveParallelogramRoot = curve.pNodeOverICurve()
    if (
      Parallelogram.intersect(
        lineParallelogram.parallelogram,
        curveParallelogramRoot.parallelogram,
      ) == false
    )
      return ret
    let parOffset = 0.0
    for (const seg of curve.segs) {
      const iiList = Curve.getAllIntersections(lineSeg, seg, false)
      if (liftIntersections) {
        for (const intersectionInfo of iiList) {
          intersectionInfo.par1 += parOffset - seg.parStart
          intersectionInfo.seg1 = curve
        }
        parOffset += seg.parEnd - seg.parStart
      }
      for (const intersectionInfo of iiList) {
        if (!Curve.alreadyInside(ret, intersectionInfo))
          ret.push(intersectionInfo)
      }
    }

    return ret
  }

  static closeIntersections(x: IntersectionInfo, y: IntersectionInfo) {
    return Point.close(x.x, y.x, GeomConstants.intersectionEpsilon)
  }

  static closeIntersectionPoints(x: Point, y: Point) {
    return Point.close(x, y, GeomConstants.intersectionEpsilon)
  }

  static alreadyInside(
    ret: IntersectionInfo[],
    intersectionInfo: IntersectionInfo,
  ): boolean {
    for (let i = 0; i < ret.length; i++) {
      const ii = ret[i]
      if (Curve.closeIntersections(ii, intersectionInfo)) return true
    }
    return false
  }

  static getAllIntersectionsOfLineAndArc(
    lineSeg: LineSegment,
    ellipse: Ellipse,
  ): IntersectionInfo[] {
    Assert.assert(ellipse.isArc())
    let lineDir = lineSeg.end.minus(lineSeg.start)
    const ret: IntersectionInfo[] = []
    const segLength = lineDir.length
    // the case of a very short LineSegment
    if (segLength < GeomConstants.distanceEpsilon) {
      const lsStartMinCen = lineSeg.start.minus(ellipse.center)
      if (Point.closeD(lsStartMinCen.length, ellipse.aAxis.length)) {
        let angle = Point.angle(ellipse.aAxis, lsStartMinCen)
        if (ellipse.parStart - GeomConstants.tolerance <= angle) {
          angle = Math.max(angle, ellipse.parStart)
          if (angle <= ellipse.parEnd + GeomConstants.tolerance) {
            angle = Math.min(ellipse.parEnd, angle)
            ret.push(
              new IntersectionInfo(0, angle, lineSeg.start, lineSeg, ellipse),
            )
          }
        }
      }
      return ret
    }

    const perp = lineDir.rotate90Ccw().div(segLength)
    const segProjection = lineSeg.start.minus(ellipse.center).dot(perp)
    const closestPointOnLine = ellipse.center.add(perp.mult(segProjection))

    const rad = ellipse.aAxis.length
    const absSegProj = Math.abs(segProjection)
    if (rad < absSegProj - GeomConstants.distanceEpsilon) return ret //we don't have an intersection
    lineDir = perp.rotate90Cw()
    if (Point.closeD(rad, absSegProj)) {
      Curve.tryToAddPointToLineCircleCrossing(
        lineSeg,
        ellipse,
        ret,
        closestPointOnLine,
        segLength,
        lineDir,
      )
    } else {
      Assert.assert(rad > absSegProj)
      const otherLeg = Math.sqrt(rad * rad - segProjection * segProjection)
      const d = lineDir.mult(otherLeg)
      Curve.tryToAddPointToLineCircleCrossing(
        lineSeg,
        ellipse,
        ret,
        closestPointOnLine.add(d),
        segLength,
        lineDir,
      )
      Curve.tryToAddPointToLineCircleCrossing(
        lineSeg,
        ellipse,
        ret,
        closestPointOnLine.minus(d),
        segLength,
        lineDir,
      )
    }
    return ret
  }

  static tryToAddPointToLineCircleCrossing(
    lineSeg: LineSegment,
    ellipse: Ellipse,
    ret: IntersectionInfo[],
    point: Point,
    segLength: number,
    lineDir: Point,
  ) {
    const ds = point.minus(lineSeg.start)
    let t = ds.dot(lineDir)
    if (t < -GeomConstants.distanceEpsilon) return
    t = Math.max(t, 0)
    if (t > segLength + GeomConstants.distanceEpsilon) return
    t = Math.min(t, segLength)
    t /= segLength

    let angle = Point.angle(ellipse.aAxis, point.minus(ellipse.center))
    if (ellipse.parStart - GeomConstants.tolerance <= angle) {
      angle = Math.max(angle, ellipse.parStart)
      if (angle <= ellipse.parEnd + GeomConstants.tolerance) {
        angle = Math.min(ellipse.parEnd, angle)
        ret.push(new IntersectionInfo(t, angle, point, lineSeg, ellipse))
      }
    }
  }

  static getAllIntersectionsOfLineAndPolyline(
    lineSeg: LineSegment,
    poly: Polyline,
  ) {
    const ret: IntersectionInfo[] = []
    let offset = 0.0
    let polyPoint = poly.startPoint

    for (
      ;
      polyPoint != null && polyPoint.getNext() != null;
      polyPoint = polyPoint.getNext()
    ) {
      const sol = Curve.crossTwoLineSegs(
        lineSeg.start,
        lineSeg.end,
        polyPoint.point,
        polyPoint.getNext().point,
        0,
        1,
        0,
        1,
      )
      if (sol != undefined) {
        Curve.adjustSolution(
          lineSeg.start,
          lineSeg.end,
          polyPoint.point,
          polyPoint.getNext().point,
          sol,
        )
        if (!Curve.oldIntersection(ret, sol.x))
          ret.push(
            new IntersectionInfo(
              sol.aSol,
              offset + sol.bSol,
              sol.x,
              lineSeg,
              poly,
            ),
          )
      }
      offset++
    }
    if (poly.isClosed()) {
      const sol = Curve.crossTwoLineSegs(
        lineSeg.start,
        lineSeg.end,
        polyPoint.point,
        poly.start,
        0,
        1,
        0,
        1,
      )
      if (sol != undefined) {
        Curve.adjustSolution(
          lineSeg.start,
          lineSeg.end,
          polyPoint.point,
          poly.start,
          sol,
        )
        if (!Curve.oldIntersection(ret, sol.x))
          ret.push(
            new IntersectionInfo(
              sol.aSol,
              offset + sol.bSol,
              sol.x,
              lineSeg,
              poly,
            ),
          )
      }
    }
    return ret
  }

  static adjustSolution(
    aStart: Point,
    aEnd: Point,
    bStart: Point,
    bEnd: Point,
    sol: CurveCrossOutput,
  ) {
    //adjust the intersection if it is close to the ends of the segs
    if (Curve.closeIntersectionPoints(sol.x, aStart)) {
      sol.x = aStart
      sol.aSol = 0
    } else if (Curve.closeIntersectionPoints(sol.x, aEnd)) {
      sol.x = aEnd
      sol.aSol = 1
    }

    if (Curve.closeIntersectionPoints(sol.x, bStart)) {
      sol.x = bStart
      sol.bSol = Math.floor(sol.bSol)
    } else if (Curve.closeIntersectionPoints(sol.x, bEnd)) {
      sol.x = bEnd
      sol.bSol = Math.ceil(sol.bSol)
    }
  }

  static curveCurveXWithParallelogramNodesOne(n0: PN, n1: PN) {
    if (!Parallelogram.intersect(n0.parallelogram, n1.parallelogram))
      return null

    const n0Pb = n0.node
    const n1Pb = n1.node
    const n0Internal = n0Pb.hasOwnProperty('children')
    const n1Internal = n1Pb.hasOwnProperty('children')
    if (n0Internal && n1Internal)
      for (const n00 of (n0Pb as PNInternal).children)
        for (const n11 of (n1Pb as PNInternal).children) {
          const x = Curve.curveCurveXWithParallelogramNodesOne(n00, n11)
          if (x != null) return x
        }
    else if (n1Internal)
      for (const n of (n1Pb as PNInternal).children) {
        const x = Curve.curveCurveXWithParallelogramNodesOne(n0, n)
        if (x != null) return x
      }
    else if (n0Internal)
      for (const n of (n0Pb as PNInternal).children) {
        const x = Curve.curveCurveXWithParallelogramNodesOne(n, n1)
        if (x != null) return x
      }
    else return Curve.crossOverIntervalsOne(n0, n1)

    return null
  }

  static curveCurveXWithParallelogramNodes(
    n0: PN,
    n1: PN,
    intersections: IntersectionInfo[],
  ) {
    if (!Parallelogram.intersect(n0.parallelogram, n1.parallelogram)) {
      // Boxes n0.Box and n1.Box do not intersect
      return
    }
    const isInternal0 = n0.node.hasOwnProperty('children')
    const isInternal1 = n1.node.hasOwnProperty('children')
    if (isInternal0 && isInternal1)
      for (const n00 of (n0.node as PNInternal).children)
        for (const n11 of (n1.node as PNInternal).children)
          Curve.curveCurveXWithParallelogramNodes(n00, n11, intersections)
    else if (isInternal1)
      for (const n of (n1.node as PNInternal).children)
        Curve.curveCurveXWithParallelogramNodes(n0, n, intersections)
    else if (isInternal0)
      for (const n of (n0.node as PNInternal).children)
        Curve.curveCurveXWithParallelogramNodes(n, n1, intersections)
    else intersections = Curve.crossOverLeaves(n0, n1, intersections)
  }

  static crossOverIntervalsOne(n0: PN, n1: PN): IntersectionInfo | undefined {
    //both are leafs
    const l0 = n0.node as PNLeaf
    const l1 = n1.node as PNLeaf
    const d0 = (l0.high - l0.low) / 2
    const d1 = (l1.high - l1.low) / 2

    for (let i = 1; i < 2; i++) {
      const p0 = i * d0 + l0.low
      for (let j = 1; j < 2; j++) {
        const p1 = j * d1 + l1.low
        let sol: CurveCrossOutput
        if (l0.chord == null && l1.chord == null)
          sol = Curve.crossWithinIntervalsWithGuess(
            n0.seg,
            n1.seg,
            l0.low,
            l0.high,
            l1.low,
            l1.high,
            p0,
            p1,
          )
        else if (l0.chord != null && l1.chord == null) {
          sol = Curve.crossWithinIntervalsWithGuess(
            l0.chord,
            n1.seg,
            0,
            1,
            l1.low,
            l1.high,
            0.5 * i,
            p1,
          )
        } else if (l0.chord == null) {
          sol = Curve.crossWithinIntervalsWithGuess(
            n0.seg,
            l1.chord,
            l0.low,
            l0.high,
            0,
            1,
            p0,
            0.5 * j,
          )
          if (sol != undefined) {
            sol.bSol = l1.low + sol.bSol * (l1.high - l1.low)
          }
        } //if (l0.chord != null && l1.chord != null)
        else {
          sol = Curve.crossWithinIntervalsWithGuess(
            l0.chord,
            l1.chord,
            0,
            1,
            0,
            1,
            0.5 * i,
            0.5 * j,
          )
          if (sol != undefined) {
            sol.aSol = l0.low + sol.aSol * (l0.high - l0.low)
            sol.bSol = l1.low + sol.bSol * (l1.high - l1.low)
          }
        }

        if (sol != undefined) {
          return Curve.createIntersectionOne(n0, n1, sol.aSol, sol.bSol, sol.x)
        }
      }
    }

    return Curve.goDeeperOne(n0, n1)
  }

  static crossOverLeaves(n0: PN, n1: PN, intersections: IntersectionInfo[]) {
    //both are leafs
    const l0 = n0.node as PNLeaf
    const l1 = n1.node as PNLeaf
    let found = false

    const p0 = (l0.high - l0.low) / 2 + l0.low
    const p1 = (l1.high - l1.low) / 2 + l1.low
    let sol: CurveCrossOutput
    if (l0.chord == null && l1.chord == null)
      sol = Curve.crossWithinIntervalsWithGuess(
        n0.seg,
        n1.seg,
        l0.low,
        l0.high,
        l1.low,
        l1.high,
        p0,
        p1,
      )
    else if (l0.chord != null && l1.chord == null) {
      sol = Curve.crossWithinIntervalsWithGuess(
        l0.chord,
        n1.seg,
        0,
        1,
        l1.low,
        l1.high,
        0.5,
        p1,
      )
      if (sol != undefined) sol.aSol = l0.low + sol.aSol * (l0.high - l0.low)
    } else if (l0.chord == null) {
      //&& l1.chord != null)
      sol = Curve.crossWithinIntervalsWithGuess(
        n0.seg,
        l1.chord,
        l0.low,
        l0.high,
        0,
        1,
        p0,
        0.5,
      )
      if (sol != undefined) sol.bSol = l1.low + sol.bSol * (l1.high - l1.low)
    } //if (l0.chord != null && l1.chord != null)
    else {
      sol = Curve.crossWithinIntervalsWithGuess(
        l0.chord,
        l1.chord,
        0,
        1,
        0,
        1,
        0.5,
        0.5,
      )
      if (sol != undefined) {
        sol.bSol = l1.low + sol.bSol * (l1.high - l1.low)
        sol.aSol = l0.low + sol.aSol * (l0.high - l0.low)
      }
    }

    if (sol != undefined) {
      Curve.addIntersection(n0, n1, intersections, sol)
      found = true
    }

    if (!found) Curve.goDeeper(intersections, n0, n1)
    return intersections
  }

  static addIntersection(
    n0: PN,
    n1: PN,
    intersections: IntersectionInfo[],
    sol: CurveCrossOutput,
  ) {
    const l0 = n0.node as PNLeaf
    //adjust the intersection if it is close to the ends of the segs
    if (Curve.closeIntersectionPoints(sol.x, n0.seg.value(l0.low))) {
      sol.x = n0.seg.value(l0.low)
      sol.aSol = l0.low
    } else if (Curve.closeIntersectionPoints(sol.x, n0.seg.value(l0.high))) {
      sol.x = n0.seg.value(l0.high)
      sol.aSol = l0.high
    }

    const l1 = n1.node as PNLeaf
    if (Curve.closeIntersectionPoints(sol.x, n1.seg.value(l1.low))) {
      sol.x = n1.seg.value(l1.low)
      sol.bSol = l1.low
    } else if (Curve.closeIntersectionPoints(sol.x, n1.seg.value(l1.high))) {
      sol.x = n1.seg.value(l1.high)
      sol.bSol = l1.high
    }

    const oldIntersection = Curve.oldIntersection(intersections, sol.x)
    if (!oldIntersection) {
      const xx = new IntersectionInfo(sol.aSol, sol.bSol, sol.x, n0.seg, n1.seg)
      intersections.push(xx)
    }

    return
  }

  // returns true if the intersection exists already
  static oldIntersection(intersections: IntersectionInfo[], x: Point): boolean {
    //we don't expect many intersections so it's ok just go through all of them
    for (const ii of intersections)
      if (x.minus(ii.x).length < GeomConstants.distanceEpsilon * 100) {
        //please no close intersections
        return true
      }
    return false
  }

  static createIntersectionOne(
    n0: PN,
    n1: PN,
    aSol: number,
    bSol: number,
    x: Point,
  ) {
    //adjust the intersection if it is close to the ends of the segs
    const l0 = n0.node as PNLeaf
    const l1 = n1.node as PNLeaf
    if (Curve.closeIntersectionPoints(x, n0.seg.value(l0.low))) {
      x = n0.seg.value(l0.low)
      aSol = l0.low
    } else if (Curve.closeIntersectionPoints(x, n0.seg.value(l0.high))) {
      x = n0.seg.value(l0.high)
      aSol = l0.high
    }

    if (Curve.closeIntersectionPoints(x, n1.seg.value(l1.low))) {
      x = n1.seg.value(l1.low)
      bSol = l1.low
    } else if (Curve.closeIntersectionPoints(x, n1.seg.value(l1.high))) {
      x = n1.seg.value(l1.high)
      bSol = l1.high
    }

    return new IntersectionInfo(aSol, bSol, x, n0.seg, n1.seg)
  }

  static liftIntersectionToCurves_(
    c0: ICurve,
    c1: ICurve,
    aSol: number,
    bSol: number,
    x: Point,
    seg0: ICurve,
    seg1: ICurve,
  ) {
    const a = this.liftParameterToCurve(c0, aSol - seg0.parStart, seg0)
    const b = this.liftParameterToCurve(c1, bSol - seg1.parStart, seg1)
    return new IntersectionInfo(a, b, x, c0, c1)
  }

  static DropIntersectionToSegs(xx: IntersectionInfo) {
    let seg0: ICurve
    let par0: number

    if (xx.seg0 instanceof Curve) {
      const sp = (xx.seg0 as Curve).getSegParam(xx.par0)
      seg0 = sp.seg
      par0 = sp.par
    } else {
      par0 = xx.par0
      seg0 = xx.seg0
    }

    let seg1: ICurve
    let par1: number

    if (xx.seg1 instanceof Curve) {
      const sp = (xx.seg1 as Curve).getSegParam(xx.par1)
      par1 = sp.par
      seg1 = sp.seg
    } else {
      par1 = xx.par1
      seg1 = xx.seg1
    }

    return new IntersectionInfo(par0, par1, xx.x, seg0, seg1)
  }

  static liftIntersectionToCurves(
    c0: ICurve,
    c1: ICurve,
    xx: IntersectionInfo,
  ) {
    return Curve.liftIntersectionToCurves_(
      c0,
      c1,
      xx.par0,
      xx.par1,
      xx.x,
      xx.seg0,
      xx.seg1,
    )
  }

  static liftParameterToCurve(curve: ICurve, par: number, seg: ICurve) {
    if (curve == seg) return par
    if (!curve.hasOwnProperty('segs')) return
    const c = curve as Curve

    let offset = 0
    for (const s of c.segs) {
      if (s == seg) return par + offset
      offset += Curve.paramSpan(s)
    }
    throw 'bug in liftParameterToCurve'
  }

  static paramSpan(s: ICurve) {
    return s.parEnd - s.parStart
  }

  static goDeeperOne(nl0: PN, nl1: PN): IntersectionInfo {
    // did not find an intersection yet
    const l0 = nl0.node as PNLeaf
    const l1 = nl1.node as PNLeaf

    if (
      nl0.leafBoxesOffset > GeomConstants.distanceEpsilon &&
      nl1.leafBoxesOffset > GeomConstants.distanceEpsilon
    ) {
      // going deeper on both with offset l0.LeafBoxesOffset / 2, l1.LeafBoxesOffset / 2
      const nn0 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l0.low,
        l0.high,
        nl0.seg,
        nl0.leafBoxesOffset / 2,
      )
      const nn1 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l1.low,
        l1.high,
        nl1.seg,
        nl1.leafBoxesOffset / 2,
      )
      return Curve.curveCurveXWithParallelogramNodesOne(nn0, nn1)
    }
    if (nl0.leafBoxesOffset > GeomConstants.distanceEpsilon) {
      // go deeper on the left
      const nn0 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l0.low,
        l0.high,
        nl0.seg,
        nl0.leafBoxesOffset / 2,
      )
      return Curve.curveCurveXWithParallelogramNodesOne(nn0, nl1)
    }
    if (nl1.leafBoxesOffset > GeomConstants.distanceEpsilon) {
      // go deeper on the right
      const nn1 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l1.low,
        l1.high,
        nl1.seg,
        nl1.leafBoxesOffset / 2,
      )
      return Curve.curveCurveXWithParallelogramNodesOne(nl0, nn1)
    }
    //just cross LineSegs and adjust the solutions if the segments are not straight lines
    const l0Low = nl0.seg.value(l0.low)
    const l0High = nl0.seg.value(l0.high)
    if (!Point.closeDistEps(l0Low, l0High)) {
      const l1Low = nl1.seg.value(l1.low)
      const l1High = nl1.seg.value(l1.high)
      if (!Point.closeDistEps(l1Low, l1High)) {
        const ls0 =
          nl0.seg instanceof LineSegment
            ? (nl0.seg as LineSegment)
            : LineSegment.mkLinePP(l0Low, l0High)
        const ls1 =
          nl1.seg instanceof LineSegment
            ? (nl1.seg as LineSegment)
            : LineSegment.mkLinePP(l1Low, l1High)

        const sol = Curve.crossWithinIntervalsWithGuess(
          ls0,
          ls1,
          0,
          1,
          0,
          1,
          0.5,
          0.5,
        )
        if (sol != undefined) {
          Curve.adjustParameters(nl0, ls0, nl1, ls1, sol)
          return Curve.createIntersectionOne(
            nl0,
            nl1,
            sol.aSol,
            sol.bSol,
            sol.x,
          )
        }
      }
    }
    return null
  }

  static writeLeavesToSvg(nl0: PN, nl1: PN): void {
    const w = new SvgDebugWriter('/tmp/goDeeper.svg')
    const poly0 = new Polyline()
    for (const p of allVerticesOfParall(nl0.parallelogram)) {
      poly0.addPoint(p)
    }
    poly0.setIsClosed(true)

    const poly1 = new Polyline()
    for (const p of allVerticesOfParall(nl1.parallelogram)) {
      poly1.addPoint(p)
    }
    poly1.setIsClosed(true)
    const l0 = nl0.node as PNLeaf
    const l1 = nl1.node as PNLeaf

    const dc = [
      DebugCurve.mkDebugCurveTWCI(100, 0.1, 'Black', nl0.seg),
      DebugCurve.mkDebugCurveTWCI(100, 0.1, 'Black', poly0),
      DebugCurve.mkDebugCurveTWCI(100, 0.1, 'Red', nl1.seg),
      DebugCurve.mkDebugCurveTWCI(100, 0.1, 'Red', poly1),
    ]
    w.writeDebugCurves(dc)
    w.close()
    throw new Error('killed')
  }
  static goDeeper(intersections: IntersectionInfo[], nl0: PN, nl1: PN) {
    const l0 = nl0.node as PNLeaf
    const l1 = nl1.node as PNLeaf
    // did not find an intersection
    if (
      nl0.leafBoxesOffset > GeomConstants.distanceEpsilon &&
      nl1.leafBoxesOffset > GeomConstants.distanceEpsilon
    ) {
      // going deeper on both with offset l0.leafBoxesOffset / 2, l1.leafBoxesOffset / 2
      const nn0 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l0.low,
        l0.high,
        nl0.seg,
        nl0.leafBoxesOffset / 2,
      )
      const nn1 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l1.low,
        l1.high,
        nl1.seg,
        nl1.leafBoxesOffset / 2,
      )
      Curve.curveCurveXWithParallelogramNodes(nn0, nn1, intersections)
    } else if (nl0.leafBoxesOffset > GeomConstants.distanceEpsilon) {
      // go deeper on the left
      const nn0 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l0.low,
        l0.high,
        nl0.seg,
        nl0.leafBoxesOffset / 2,
      )
      Curve.curveCurveXWithParallelogramNodes(nn0, nl1, intersections)
    } else if (nl1.leafBoxesOffset > GeomConstants.distanceEpsilon) {
      // go deeper on the right
      const nn1 = ParallelogramNode.createParallelogramNodeForCurveSeg(
        l1.low,
        l1.high,
        nl1.seg,
        nl1.leafBoxesOffset / 2,
      )
      Curve.curveCurveXWithParallelogramNodes(nl0, nn1, intersections)
    } else {
      //just cross LineSegs since the polylogramms are so thin
      const l0Low = nl0.seg.value(l0.low)
      const l0High = nl0.seg.value(l0.high)
      if (!Point.closeDistEps(l0Low, l0High)) {
        const l1Low = nl1.seg.value(l1.low)
        const l1High = nl1.seg.value(l1.high)
        if (!Point.closeDistEps(l1Low, l1High)) {
          const ls0 =
            nl0.seg instanceof LineSegment
              ? (nl0.seg as LineSegment)
              : LineSegment.mkLinePP(l0Low, l0High)
          const ls1 =
            nl1.seg instanceof LineSegment
              ? (nl1.seg as LineSegment)
              : LineSegment.mkLinePP(l1Low, l1High)

          const sol = Curve.crossWithinIntervalsWithGuess(
            ls0,
            ls1,
            0,
            1,
            0,
            1,
            0.5,
            0.5,
          )
          if (sol != undefined) {
            Curve.adjustParameters(nl0, ls0, nl1, ls1, sol)
            Curve.addIntersection(nl0, nl1, intersections, sol)
          }
        }
      }
    }
  }

  static adjustParameters(
    l0: PN,
    ls0: LineSegment,
    l1: PN,
    ls1: LineSegment,
    sol: CurveCrossOutput,
  ) {
    if (ls0 != l0.seg && l0.seg instanceof Polyline == false)
      //l0.seg is not a LineSegment and not a polyline
      sol.aSol = l0.seg.closestParameter(sol.x)
    //we need to find the correct parameter
    else {
      const leaf0 = l0.node as PNLeaf
      sol.aSol = leaf0.low + sol.aSol * (leaf0.high - leaf0.low)
    }
    if (ls1 != l1.seg && l1.seg instanceof Polyline == false)
      //l1.seg is not a LineSegment and not a polyline
      sol.bSol = l1.seg.closestParameter(sol.x)
    //we need to find the correct parameter
    else {
      const leaf1 = l1.node as PNLeaf
      sol.bSol = leaf1.low + sol.bSol * (leaf1.high - leaf1.low)
    }
  }

  // returns the segment correspoinding to t and the segment parameter
  getSegParam(t: number): SegParam {
    let u = this.parStart //u is the sum of param domains
    for (const sg of this.segs) {
      const nextu = u + sg.parEnd - sg.parStart
      if (t >= u && t <= nextu) {
        return {
          par: t - u + sg.parStart,
          seg: sg,
        }
      }
      u = nextu
    }
    const lastSeg = this.segs[this.segs.length - 1]
    return {
      seg: lastSeg,
      par: lastSeg.parEnd,
    }
  }

  getSegIndexParam(t: number): SegIndexParam {
    let u = 0 //u is the sum of param domains
    const segLen = this.segs.length
    for (let i = 0; i < segLen; i++) {
      const sg = this.segs[i]
      const nextu = u + sg.parEnd - sg.parStart
      if (t >= u && t <= nextu) {
        return {
          segIndex: i,
          par: t - u + sg.parStart,
        }
      }
      u = nextu
    }
    const lastSeg = this.segs[segLen - 1]
    return {
      segIndex: segLen - 1,
      par: lastSeg.parEnd,
    }
  }

  // Returns the point on the curve corresponding to parameter t
  value(t: number) {
    return segParamValue(this.getSegParam(t))
  }
  // first derivative at t
  derivative(t: number) {
    return segParamDerivative(this.getSegParam(t))
  }
  // second derivative
  secondDerivative(t: number) {
    return segParamSecondDerivative(this.getSegParam(t))
  }
  // third derivative
  thirdDerivative(t: number) {
    return segParamThirdDerivative(this.getSegParam(t))
  }

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
    a: ICurve,
    b: ICurve,
    amin: number,
    amax: number,
    bmin: number,
    bmax: number,
    aGuess: number,
    bGuess: number,
  ): CurveCrossOutput | undefined {
    if (a instanceof LineSegment && b instanceof LineSegment) {
      const r = Curve.crossTwoLineSegs(
        a.start,
        a.end,
        b.start,
        b.end,
        amin,
        amax,
        bmin,
        bmax,
      )
      if (r != undefined) return r
    }

    const mdout = Curve.minDistWithinIntervals(
      a,
      b,
      amin,
      amax,
      bmin,
      bmax,
      aGuess,
      bGuess,
    )
    if (mdout == undefined) return

    const aMinusB = mdout.aX.minus(mdout.bX)
    return aMinusB.dot(aMinusB) >= GeomConstants.distanceEpsilon
      ? undefined
      : {
          aSol: mdout.aSol,
          bSol: mdout.bSol,
          x: Point.middle(mdout.aX, mdout.bX),
        }
  }

  static crossTwoLineSegs(
    aStart: Point,
    aEnd: Point,
    bStart: Point,
    bEnd: Point,
    amin: number,
    amax: number,
    bmin: number,
    bmax: number,
  ): CurveCrossOutput | undefined {
    const u = aEnd.minus(aStart)
    const v = bStart.minus(bEnd)
    const w = bStart.minus(aStart)
    const sol = LinearSystem2.solve(u.x, v.x, w.x, u.y, v.y, w.y)
    if (sol == undefined) return
    let aSol = sol.x
    let bSol = sol.y
    const x = aStart.add(u.mult(aSol))

    if (aSol < amin - GeomConstants.tolerance) return

    aSol = Math.max(aSol, amin)

    if (aSol > amax + GeomConstants.tolerance) return

    aSol = Math.min(aSol, amax)

    if (bSol < bmin - GeomConstants.tolerance) return

    bSol = Math.max(bSol, bmin)

    if (bSol > bmax + GeomConstants.tolerance) return

    bSol = Math.min(bSol, bmax)

    Assert.assert(Point.closeDistEps(x, Point.convSum(bSol, bStart, bEnd)))
    return {
      aSol: aSol,
      bSol: bSol,
      x: x,
    }
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
    if (Point.closeDistEps(xx.intersectionPoint, point))
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
    
    if (Point.closeDistEps(x, pseg.end)) {
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
    
    boolean touch = (tsn*pseg.derivative(pseg.parEnd))*(tsn*exitSeg.derivative(exitSeg.parStart)) <
    GeomConstants.tolerance;
    
    return !touch;
    }
    
    if (Point.closeDistEps(x, pseg.start)) {
    //so pseg exits the spline 
    ICurve enterSeg = null;
    for (int i = 0; i < polygon.segs.length; i++)
    if (polygon.segs[i] == pseg) {
    enterSeg = polygon.segs[i > 0 ? (i - 1) : polygon.segs.length - 1];
    break;
    }
    
    Point tsn = ts.Rotate((Math.PI/2));
    boolean touch = (tsn*pseg.derivative(pseg.parStart))*
    (tsn*enterSeg.derivative(enterSeg.parEnd)) < GeomConstants.tolerance;
    
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
    
    if (Point.closeDistEps(x, pseg.end)) {
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
    
    boolean touch = (tsn*pseg.derivative(pseg.parEnd))*(tsn*exitSeg.derivative(exitSeg.parStart)) <
    GeomConstants.tolerance;
    
    return !touch;
    }
    
    if (Point.closeDistEps(x, pseg.start)) {
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
    boolean touch = (tsn*pseg.derivative(pseg.Parstart))*
    (tsn*enterSeg.derivative(enterSeg.parEnd)) < GeomConstants.tolerance;
    
    return !touch;
    }
    
    number d = ts*pn;
    if (onlyFromInsideCuts)
    return d > GeomConstants.distanceEpsilon;
    return Math.Abs(d) > GeomConstants.distanceEpsilon;
    }
    */

  static minDistWithinIntervals(
    a: ICurve,
    b: ICurve,
    aMin: number,
    aMax: number,
    bMin: number,
    bMax: number,
    aGuess: number,
    bGuess: number,
  ): MinDistOutput | undefined {
    const md = new MinDistCurveCurve(
      a,
      b,
      aMin,
      aMax,
      bMin,
      bMax,
      aGuess,
      bGuess,
    )
    md.solve()
    return md.success
      ? {
          aSol: md.aSolution,
          bSol: md.bSolution,
          aX: md.aPoint,
          bX: md.bPoint,
        }
      : undefined
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
      ret += segs[0].start.x.ToString() + "," + segs[0].start.y.ToString()+" ";
      for(LineSeg s in segs)
      ret += s.end.x.ToString() + "," + s.end.y.ToString() + " ";
      return ret + "}";
      }
      #endif
   */
  // Offsets the curve in the direction of dir
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  offsetCurve(offset: number, dir: Point) {
    throw new Error('Method not implemented.')
    return null
  }

  // The bounding rectangle of the curve
  get boundingBox() {
    if (this.segs.length == 0) return new Rectangle(0, 0, -1, -1)
    const b = this.segs[0].boundingBox.clone()

    for (let i = 1; i < this.segs.length; i++)
      b.addRec(this.segs[i].boundingBox)

    return b
  }

  // clones the curve.
  clone() {
    const c = new Curve()
    for (const seg of this.segs) c.addSegment(seg.clone())
    return c
  }

  getParameterAtLength(length: number) {
    let parSpan = 0.0
    for (const seg of this.segs) {
      const segL = seg.length
      if (segL >= length) return parSpan + seg.getParameterAtLength(length)

      length -= segL
      parSpan += seg.parEnd - seg.parStart
    }
    return this.parEnd
  }

  get length(): number {
    let r = 0
    for (const s of this.segs) r += s.length
    return r
  }
  transform(transformation: PlaneTransformation): ICurve {
    const c = new Curve()
    for (const s of this.segs) c.addSegment(s.transform(transformation))

    return c
  }

  // returns a parameter t such that the distance between curve[t] and targetPoint is minimal
  // and t belongs to the closed segment [low,high]
  closestParameterWithinBounds(targetPoint: Point, low: number, high: number) {
    let par = 0
    let dist = Number.MAX_VALUE
    let offset = 0
    for (const seg of this.segs) {
      if (offset > high) break //we are out of the [low, high] segment
      const segparamSpan = Curve.paramSpan(seg)
      const segEnd = offset + segparamSpan
      if (segEnd >= low) {
        //we are in business
        const segLow = Math.max(seg.parStart, seg.parStart + (low - offset))
        const segHigh = Math.min(seg.parEnd, seg.parStart + (high - offset))
        Assert.assert(segHigh >= segLow)
        const t = seg.closestParameterWithinBounds(targetPoint, segLow, segHigh)
        const d = targetPoint.minus(seg.value(t))
        const dd = d.dot(d)
        if (dd < dist) {
          par = offset + t - seg.parStart
          dist = dd
        }
      }
      offset += segparamSpan
    }
    return par
  }

  // returns a parameter t such that the distance between curve[t] and a is minimal
  closestParameter(targetPoint: Point) {
    let par = 0
    let dist = Number.MAX_VALUE
    let offset = 0
    for (const c of this.segs) {
      const t = c.closestParameter(targetPoint)
      const d = targetPoint.minus(c.value(t))
      const dd = d.dot(d)
      if (dd < dist) {
        par = offset + t - c.parStart
        dist = dd
      }
      offset += Curve.paramSpan(c)
    }
    return par
  }

  static addLineSegment(curve: Curve, pointA: Point, pointB: Point): Curve {
    return curve.addSegment(LineSegment.mkLinePP(pointA, pointB))
  }

  /*     
       //static internal void AddLineSegment(Curve c, number x, number y, Point b) {
       //    AddLineSegment(c, new Point(x, y), b);
       //}
       
       // adds a line segment to the curve
       public static void AddLineSegment(Curve curve, number x0, number y0, number x1, number y1) {
       AddLineSegment(curve, new Point(x0, y0), new Point(x1, y1));
       }
       */
  // adds a line segment to the curve
  static continueWithLineSegmentNN(c: Curve, x: number, y: number) {
    Curve.addLineSegment(c, c.end, new Point(x, y))
  }

  // adds a line segment to the curve
  static continueWithLineSegmentP(c: Curve, x: Point) {
    Curve.addLineSegment(c, c.end, x)
  }
  /*
  // 
  public static void CloseCurve(Curve curve) {
  ValidateArg.IsNotNull(curve, "curve");
  ContinueWithLineSegment(curve, curve.start);
  }
  
  #endregion
*/
  // left derivative at t
  leftDerivative(t: number) {
    const seg = this.tryToGetLeftSegment(t)
    if (seg != null) return seg.derivative(seg.parEnd)
    return this.derivative(t)
  }

  // right derivative at t
  rightDerivative(t: number) {
    const seg = this.tryToGetRightSegment(t)
    if (seg != null) return seg.derivative(seg.parStart)
    return this.derivative(t)
  }

  tryToGetLeftSegment(t: number) {
    if (Math.abs(t - this.parStart) < GeomConstants.tolerance) {
      if (this.start.equal(this.end)) return this.segs[this.segs.length - 1]
      return null
    }
    for (const seg of this.segs) {
      t -= Curve.paramSpan(seg)
      if (Math.abs(t) < GeomConstants.tolerance) return seg
    }
    return null
  }

  tryToGetRightSegment(t: number) {
    if (Math.abs(t - this.parEnd) < GeomConstants.tolerance) {
      if (this.start == this.end) return this.segs[0]
      return null
    }

    for (const seg of this.segs) {
      if (Math.abs(t) < GeomConstants.tolerance) return seg

      t -= Curve.paramSpan(seg)
    }
    return null
  }
  /*       
       // gets the closest point together with its parameter
       public static number closestParameterWithPoint(ICurve curve, Point location, out Point pointOnCurve) {
       ValidateArg.IsNotNull(curve, "curve");
       number t = curve.closestParameter(location);
       pointOnCurve = curve[t];
       return t;
       }
       
       // gets the point on the curve that is closest to the given point
       public static Point ClosestPoint(ICurve curve, Point location) {
       ValidateArg.IsNotNull(curve, "curve");
       return curve[curve.closestParameter(location)];
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
       return innerCurve.start != xx[0].intersectionPoint
       ? PointRelativeToCurveLocation(innerCurve.start, outerCurve) == PointLocation.Inside
       : PointRelativeToCurveLocation(innerCurve[(innerCurve.parStart + innerCurve.parEnd)/2],
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
       number len = a.parEnd - start + end - a.parStart;
       number middle = start + len/2;
       if (middle > a.parEnd)
       middle = a.parStart + middle - a.parEnd;
       yield return a[middle];
       }
       
       static boolean NonIntersectingCurveIsInsideOther(ICurve a, ICurve b) {
       ValidateArg.IsNotNull(a, "a");
       ValidateArg.IsNotNull(b, "b");
       // Due to rounding, even curves with 0 intersections may return Boundary.
       for (number par = a.parStart; par < a.parEnd; par += 0.5) {
       // continue as long as we have boundary points.
       PointLocation parLoc = PointRelativeToCurveLocation(a[par], b);
       if (PointLocation.Boundary != parLoc) return PointLocation.Inside == parLoc;
       }
       
       // All points so far were on border so it is not considered inside; test the End.
       return PointLocation.Outside != PointRelativeToCurveLocation(a.end, b);
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
       return curve1.start != xx[0].intersectionPoint
       ? PointRelativeToCurveLocation(curve1.start, curve2) == PointLocation.Inside
       : PointRelativeToCurveLocation(curve1[(curve1.parStart + curve1.parEnd)/2], curve2) ==
       PointLocation.Inside ||
       curve2.start != xx[0].intersectionPoint
       ? PointRelativeToCurveLocation(curve2.start, curve1) == PointLocation.Inside
       : PointRelativeToCurveLocation(curve2[(curve2.parStart + curve2.parEnd)/2], curve1) ==
       PointLocation.Inside;
       return
       PointsBetweenIntersections(curve1, xx).Any(
       p => PointRelativeToCurveLocation(p, curve2) == PointLocation.Inside);
       }
       
       #region ICurve Members
       
       */
  curvature(t: number) {
    const sp = this.getSegParam(t)
    return sp.seg.curvature(sp.par)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  curvatureDerivative(t: number): number {
    throw new Error('Not implemente')
  }

  //
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  curvatureSecondDerivative(t: number): number {
    throw new Error('Not implemented')
  }

  /*  #endregion
       
       public static boolean CurvesIntersect(ICurve curve1, ICurve curve2) {
       return curve1 == curve2 || (CurveCurveIntersectionOne(curve1, curve2, false) != null);
       }
       */
  static createBezierSeg(
    kPrev: number,
    kNext: number,
    a: CornerSite,
    b: CornerSite,
    c: CornerSite,
  ): BezierSeg {
    const s = Point.mkPoint(kPrev, a.point, 1 - kPrev, b.point)
    const e = Point.mkPoint(kNext, c.point, 1 - kNext, b.point)
    const t = b.point.mult(2.0 / 3.0)
    return new BezierSeg(s, s.div(3.0).add(t), t.add(e.div(3.0)), e)
  }

  static createBezierSegN(a: Point, b: Point, perp: Point, i: number) {
    const d = perp.mult(i)
    return new BezierSeg(a, a.add(d), b.add(d), b)
  }

  static findCorner(a: CornerSite): {b: CornerSite; c: CornerSite} | undefined {
    const b = a.next
    if (b.next == null) return //no corner has been found
    const c = b.next
    if (c == null) return
    return {b: b, c: c}
  }

  static trimEdgeSplineWithNodeBoundaries(
    sourceBoundary: ICurve,
    targetBoundary: ICurve,
    spline: ICurve,
    narrowestInterval: boolean,
  ): ICurve {
    let start = spline.parStart
    let end = spline.parEnd
    if (sourceBoundary != null)
      start = Curve.findNewStart(
        spline,
        start,
        sourceBoundary,
        narrowestInterval,
      )
    if (targetBoundary != null)
      end = Curve.findNewEnd(spline, targetBoundary, narrowestInterval, end)

    const st = Math.min(start, end)
    const en = Math.max(start, end)
    return st < en ? spline.trim(st, en) : spline
  }

  static findNewEnd(
    spline: ICurve,
    targetBoundary: ICurve,
    narrowestInterval: boolean,
    end: number,
  ): number {
    //SugiyamaLayoutSettings.Show(c, spline);
    const intersections = Curve.getAllIntersections(
      spline,
      targetBoundary,
      true,
    )
    if (intersections.length == 0) {
      end = spline.parEnd
      return end
    }
    if (narrowestInterval) {
      end = spline.parEnd
      for (const xx of intersections) if (xx.par0 < end) end = xx.par0
    } else {
      //looking for the last intersection
      end = spline.parStart
      for (const xx of intersections) if (xx.par0 > end) end = xx.par0
    }
    return end
  }

  static findNewStart(
    spline: ICurve,
    start: number,
    sourceBoundary: ICurve,
    narrowestInterval: boolean,
  ): number {
    const intersections = Curve.getAllIntersections(
      spline,
      sourceBoundary,
      true,
    )
    if (intersections.length == 0) {
      start = spline.parStart
      return
    }
    if (narrowestInterval) {
      start = spline.parStart
      for (const xx of intersections) if (xx.par0 > start) start = xx.par0
    } else {
      start = spline.parEnd
      for (const xx of intersections) if (xx.par0 < start) start = xx.par0
    }
    return start
  }

  /* 
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
  ret.AddPoint(ls.start);
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
  dict[ix.par0] = ix.intersectionPoint;
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
function isCloseToLineSeg(
  a: number,
  ap: Point,
  b: number,
  bp: Point,
  s: ICurve,
  e: number,
): boolean {
  Assert.assert(Point.closeDistEps(s.value(a), ap))
  Assert.assert(Point.closeDistEps(s.value(b), bp))

  for (const x of [1 / 3, 0.5, 2 / 3]) {
    const p = a * x + b * (1 - x) // the parameter on the curve s
    if (!Point.closeSquare(s.value(p), Point.mkPoint(x, ap, 1 - x, bp), e))
      return false
  }

  return true
}

// interpolates the curve between parameters 'a' and 'b' by a sequence of line segments
function interpolate(
  a: number,
  ap: Point,
  b: number,
  bp: Point,
  s: ICurve,
  eps: number,
): LineSegment[] {
  Assert.assert(Point.closeDistEps(s.value(a), ap))
  Assert.assert(Point.closeDistEps(s.value(b), bp))
  const r = new Array<LineSegment>(0)
  if (isCloseToLineSeg(a, ap, b, bp, s, eps))
    r.push(LineSegment.mkLinePP(ap, bp))
  else {
    const m = 0.5 * (a + b)
    const mp = s.value(m)
    r.concat(interpolate(a, ap, m, mp, s, eps))
    r.concat(interpolate(m, mp, b, bp, s, eps))
  }
  return r
}

// this function always produces at least two segments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function interpolateWithAtLeastTwoSegs(
  eps: number,
  a: number,
  ap: Point,
  b: number,
  bp: Point,
  s: ICurve,
) {
  const m = (a + b) / 2
  const mp = s.value(m)
  const ret = interpolate(a, ap, m, mp, s, eps * eps)
  ret.concat(interpolate(m, mp, b, bp, s, eps * eps))
  return ret
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function interpolateICurve(s: ICurve, eps: number) {
  return interpolate(s.parStart, s.start, s.parEnd, s.end, s, eps)
}
