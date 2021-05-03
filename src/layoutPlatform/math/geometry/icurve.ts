import {PlaneTransformation} from './planeTransformation'
import {Point} from './point'
import {PN} from './parallelogramNode'
import {Rectangle} from './rectangle'
// The interface for curves: instances of ICurve inside of GLEE
// are BSpline,Curve,LineSeg, Ellipse,CubicBezierSeg and ArrowTipCurve.
export interface ICurve {
  // Returns the point on the curve corresponding to parameter t
  value(t: number): Point
  // first derivative at t
  derivative(t: number): Point
  // second derivative
  secondDerivative(t: number): Point
  // third derivative
  thirdDerivative(t: number): Point

  // A tree of ParallelogramNodes covering the curve.
  // This tree is used in curve intersections routines.
  pNodeOverICurve(): PN

  // XY bounding box of the curve
  boundingBox: Rectangle

  // the start of the parameter domain
  parStart: number

  // the end of the parameter domain
  parEnd: number

  // Returns the trim curve between start and end, without wrap
  trim(start: number, end: number): ICurve

  // Returns the trim curve between start and end, with wrap, if supported by the implementing class.
  trimWithWrap(start: number, end: number): ICurve

  // Moves the curve by the delta.
  translate(delta: Point): void

  // Returns the curved with all points scaled from the original by x and y
  scaleFromOrigin(xScale: number, yScale: number): ICurve

  // this[ParStart]
  start: Point

  // this[ParEnd]
  end: Point

  // this[Reverse[t]]=this[ParEnd+ParStart-t]
  reverse(): ICurve

  // Offsets the curve in the direction of dir
  offsetCurve(offset: number, dir: Point): ICurve

  // return length of the curve segment [start,end]
  lengthPartial(start: number, end: number): number

  // Get the length of the curve
  length: number

  getParameterAtLength(length: number): number

  // Return the transformed curve
  transform(transformation: PlaneTransformation): ICurve

  // and t belongs to the closed segment [low,high]
  closestParameterWithinBounds(
    targetPoint: Point,
    low: number,
    high: number,
  ): number

  closestParameter(targetPoint: Point): number
  // clones the curve.
  clone(): ICurve

  // The left derivative at t.
  leftDerivative(t: number): Point

  // the right derivative at t
  rightDerivative(t: number): Point

  // the signed curvature of the segment at t
  curvature(t: number): number
  // the derivative of the curvature at t
  curvatureDerivative(t: number): number

  // the derivative of CurvatureDerivative
  curvatureSecondDerivative(t: number): number
}
