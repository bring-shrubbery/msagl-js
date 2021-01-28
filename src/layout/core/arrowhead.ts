import {Point} from './../../math/geometry/point'
import {IntersectionInfo} from './../../math/geometry/intersectionInfo'
import {GeomConstants} from './../../math/geometry/geomConstants'
import {Curve} from './../../math/geometry/curve'
import {ICurve} from './../../math/geometry/icurve'
import {Ellipse} from './../../math/geometry/ellipse'
import {LineSegment} from './../../math/geometry/lineSegment'
import {EdgeGeometry} from './edgeGeometry'
import {Assert} from './../../utils/assert'
import {GeomEdge} from './geomEdge'
import {from} from 'linq-to-typescript'
export class Arrowhead {
  static defaultArrowheadLength = 10
  length = Arrowhead.defaultArrowheadLength
  width: number
  tipPosition: Point
  // A relative offset that moves the tip position
  offset: number

  clone(): Arrowhead {
    const r = new Arrowhead()
    r.length = this.length
    r.width = this.width
    r.tipPosition = this.tipPosition
    r.offset = this.offset
    return r
  }
  /// the edgeGeometry.Curve is trimmed already by the node boundaries</param>
  static calculateArrowheads(edgeGeometry: EdgeGeometry): boolean {
    if (
      edgeGeometry.sourceArrowhead == null &&
      edgeGeometry.targetArrowhead == null
    )
      return true
    const parStart = Arrowhead.findTrimStartForArrowheadAtSource(edgeGeometry)
    if (parStart == undefined) {
      return false
    }
    const parEnd = Arrowhead.findTrimEndForArrowheadAtTarget(edgeGeometry)
    if (parEnd == undefined) {
      return false
    }
    if (
      parStart > parEnd - GeomConstants.intersectionEpsilon ||
      Curve.closeIntersectionPoints(
        edgeGeometry.curve.value(parStart),
        edgeGeometry.curve.value(parEnd),
      )
    )
      return false //after the trim nothing would be left of the curve
    const c = edgeGeometry.curve.trim(parStart, parEnd)
    if (c == null) return false
    if (edgeGeometry.sourceArrowhead != null)
      edgeGeometry.sourceArrowhead.tipPosition = Arrowhead.placeTip(
        c.start,
        edgeGeometry.curve.start,
        edgeGeometry.sourceArrowhead.offset,
      )
    if (edgeGeometry.targetArrowhead != null)
      edgeGeometry.targetArrowhead.tipPosition = Arrowhead.placeTip(
        c.end,
        edgeGeometry.curve.end,
        edgeGeometry.targetArrowhead.offset,
      )
    edgeGeometry.curve = c
    return true
  }

  static getIntersectionsWithArrowheadCircle(
    curve: ICurve,
    arrowheadLength: number,
    circleCenter: Point,
  ): IntersectionInfo[] {
    const e = Ellipse.mkFullEllipseNNP(
      arrowheadLength,
      arrowheadLength,
      circleCenter,
    )
    return Curve.getAllIntersections(e, curve, true)
  }
  // we need to pass arrowhead length here since the original length mibh
  static findTrimEndForArrowheadAtTarget(edgeGeometry: EdgeGeometry): number {
    const eps = GeomConstants.distanceEpsilon * GeomConstants.distanceEpsilon
    //Debug.Assert((edgeGeometry.Curve.End - edgeGeometry.Curve.Start).LengthSquared > eps);
    let p = edgeGeometry.curve.parEnd
    if (
      edgeGeometry.targetArrowhead == null ||
      edgeGeometry.targetArrowhead.length <= GeomConstants.distanceEpsilon
    )
      return p
    const curve = edgeGeometry.curve
    let arrowheadLength = edgeGeometry.targetArrowhead.length
    let newCurveEnd: Point
    let intersections: IntersectionInfo[]
    let reps = 10
    do {
      reps--
      if (reps == 0) return
      intersections = Arrowhead.getIntersectionsWithArrowheadCircle(
        curve,
        arrowheadLength,
        curve.end,
      )
      p =
        intersections.length != 0
          ? from(intersections).max((x) => x.par1)
          : curve.parEnd
      newCurveEnd = edgeGeometry.curve.value(p)
      arrowheadLength /= 2
    } while (
      newCurveEnd.minus(curve.start).lengthSquared < eps ||
      intersections.length == 0
    )
    //we would like to have at least something left from the curve
    return p
  }

  static findTrimStartForArrowheadAtSource(edgeGeometry: EdgeGeometry): number {
    if (
      edgeGeometry.sourceArrowhead == null ||
      edgeGeometry.sourceArrowhead.length <= GeomConstants.distanceEpsilon
    )
      return edgeGeometry.curve.parStart
    const eps = GeomConstants.distanceEpsilon * GeomConstants.distanceEpsilon
    Assert.assert(
      edgeGeometry.curve.end.minus(edgeGeometry.curve.start).lengthSquared >
        eps,
    )
    let arrowheadLength = edgeGeometry.sourceArrowhead.length
    let newStart: Point
    const curve = edgeGeometry.curve
    let intersections: IntersectionInfo[]
    let reps = 10
    let p: number
    do {
      reps--
      if (reps == 0) return
      intersections = Arrowhead.getIntersectionsWithArrowheadCircle(
        curve,
        arrowheadLength,
        curve.start,
      )
      p =
        intersections.length != 0
          ? from(intersections).min((x) => x.par1)
          : curve.parStart
      newStart = curve[p]
      arrowheadLength /= 2
    } while (
      newStart.minus(curve.end).lengthSquared < eps ||
      intersections.length == 0
    )
    //we are checkng that something will be left from the curve
    return p
  }

  static placeTip(arrowBase: Point, arrowTip: Point, offset: number) {
    if (Math.abs(offset) < GeomConstants.tolerance) return arrowTip

    const d = arrowBase.minus(arrowTip)
    const dLen = d.length
    if (dLen < GeomConstants.tolerance) return arrowTip
    return arrowTip.add(d.mult(offset / dLen))
  }

  // trim the edge curve with the node boundaries
  static trimSplineAndCalculateArrowheads(
    edge: GeomEdge,
    spline: ICurve,
    narrowestInterval: boolean,
  ): boolean {
    return Arrowhead.trimSplineAndCalculateArrowheadsII(
      edge.edgeGeometry,
      edge.source.boundaryCurve,
      edge.target.boundaryCurve,
      spline,
      narrowestInterval,
    )
  }

  // trim the edge curve with the node boundaries
  static trimSplineAndCalculateArrowheadsII(
    edgeGeometry: EdgeGeometry,
    sourceBoundary: ICurve,
    targetBoundary: ICurve,
    spline: ICurve,
    narrowestInterval: boolean,
  ): boolean {
    edgeGeometry.curve = Curve.trimEdgeSplineWithNodeBoundaries(
      sourceBoundary,
      targetBoundary,
      spline,
      narrowestInterval,
    )
    if (edgeGeometry.curve == null) return false

    if (
      (edgeGeometry.sourceArrowhead == null ||
        edgeGeometry.sourceArrowhead.length < GeomConstants.distanceEpsilon) &&
      (edgeGeometry.targetArrowhead == null ||
        edgeGeometry.targetArrowhead.length < GeomConstants.distanceEpsilon)
    )
      return true //there are no arrowheads
    let success = false
    const sourceArrowheadSavedLength =
      edgeGeometry.sourceArrowhead != null
        ? edgeGeometry.sourceArrowhead.length
        : 0
    const targetArrowheadSavedLength =
      edgeGeometry.targetArrowhead != null
        ? edgeGeometry.targetArrowhead.length
        : 0
    const len = edgeGeometry.curve.end.minus(edgeGeometry.curve.start).length
    if (edgeGeometry.sourceArrowhead != null)
      edgeGeometry.sourceArrowhead.length = Math.min(
        len,
        sourceArrowheadSavedLength,
      )
    if (edgeGeometry.targetArrowhead != null)
      edgeGeometry.targetArrowhead.length = Math.min(
        len,
        targetArrowheadSavedLength,
      )
    let count = 10
    while (
      ((edgeGeometry.sourceArrowhead != null &&
        edgeGeometry.sourceArrowhead.length >
          GeomConstants.intersectionEpsilon) ||
        (edgeGeometry.targetArrowhead != null &&
          edgeGeometry.targetArrowhead.length >
            GeomConstants.intersectionEpsilon)) &&
      !success
    ) {
      success = Arrowhead.calculateArrowheads(edgeGeometry)
      if (!success) {
        if (edgeGeometry.sourceArrowhead != null)
          edgeGeometry.sourceArrowhead.length *= 0.5
        if (edgeGeometry.targetArrowhead != null)
          edgeGeometry.targetArrowhead.length *= 0.5
      }
      count--
      if (count == 0) break
    }

    if (!success) {
      //to avoid drawing the arrowhead to (0,0)
      if (edgeGeometry.sourceArrowhead != null)
        edgeGeometry.sourceArrowhead.tipPosition = spline.start
      if (edgeGeometry.targetArrowhead != null)
        edgeGeometry.targetArrowhead.tipPosition = spline.end
    }

    if (edgeGeometry.sourceArrowhead != null)
      edgeGeometry.sourceArrowhead.length = sourceArrowheadSavedLength
    if (edgeGeometry.targetArrowhead != null)
      edgeGeometry.targetArrowhead.length = targetArrowheadSavedLength

    return success
  }

  /// <summary>
  /// Creates a spline between two nodes big enough to draw arrowheads
  /// </summary>
  /// <param name="edge"></param>
  static createBigEnoughSpline(edge: GeomEdge) {
    const a = edge.source.center
    let b = edge.target.center
    const bMinA = b.minus(a)

    const l = bMinA.length
    let perp: Point
    if (l < 0.001) {
      perp = new Point(1, 0)
      b = a.add(perp.rotate(Math.PI / 2))
    } else {
      perp = bMinA.rotate(Math.PI / 2)
    }

    let maxArrowLength = 1
    if (edge.edgeGeometry.sourceArrowhead != null) {
      maxArrowLength += edge.edgeGeometry.sourceArrowhead.length
    }
    if (edge.edgeGeometry.targetArrowhead != null) {
      maxArrowLength += edge.edgeGeometry.targetArrowhead.length
    }
    perp = perp.normalize().mult(1.5 * maxArrowLength)
    const stop = 10000
    let i = 1
    do {
      const seg = Curve.createBezierSegN(a, b, perp, i)
      if (
        Arrowhead.trimSplineAndCalculateArrowheadsII(
          edge.edgeGeometry,
          edge.source.boundaryCurve,
          edge.target.boundaryCurve,
          seg,
          false,
        )
      ) {
        break
      }

      i *= 2
      if (i >= stop) {
        Arrowhead.createEdgeCurveWithNoTrimming(edge, a, b)
        return
      }
    } while (true)
  }

  // this method should never be called!
  static createEdgeCurveWithNoTrimming(edge: GeomEdge, a: Point, b: Point) {
    const ab = b.minus(a).normalize()

    let lineStart = a
    let lineEnd = b

    const targetArrow = edge.edgeGeometry.targetArrowhead
    if (targetArrow != null) {
      targetArrow.tipPosition = b
      lineEnd = b.minus(ab.mult(targetArrow.length))
    }
    const sourceArrow = edge.edgeGeometry.sourceArrowhead
    if (sourceArrow != null) {
      sourceArrow.tipPosition = a
      lineStart = a.add(ab.mult(sourceArrow.length))
    }
    edge.edgeGeometry.curve = LineSegment.mkLinePP(lineStart, lineEnd)
  }
}
