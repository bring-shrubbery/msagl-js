import { ICurve } from './icurve';
import { PN } from './parallelogramNode';
import { PlaneTransformation } from './planeTransformation';
import { Point } from './point';
import { Rectangle } from './rectangle';
import { PolylinePoint } from './polylinePoint';
export class Polyline implements ICurve {
    startPoint: PolylinePoint;
    endPoint: PolylinePoint;
    requireInit_: boolean;
    private isClosed_: boolean;
    requireInit() { this.requireInit_ = true; }
    init() {
        throw new Error('Method not implemented.');
    }

    isClosed() { return this.isClosed_; }
    setIsClosed(val: boolean) { this.isClosed_ = val; }


    value(t: number): Point {
        throw new Error('Method not implemented.');
    }
    derivative(t: number): Point {
        throw new Error('Method not implemented.');
    }
    secondDerivative(t: number): Point {
        throw new Error('Method not implemented.');
    }
    thirdDerivative(t: number): Point {
        throw new Error('Method not implemented.');
    }
    pNodeOverICurve(): PN {
        throw new Error('Method not implemented.');
    }
    boundingBox(): Rectangle {
        throw new Error('Method not implemented.');
    }
    parStart(): number {
        throw new Error('Method not implemented.');
    }
    parEnd(): number {
        throw new Error('Method not implemented.');
    }
    trim(start: number, end: number): ICurve {
        throw new Error('Method not implemented.');
    }
    trimWithWrap(start: number, end: number): ICurve {
        throw new Error('Method not implemented.');
    }
    translate(delta: Point): void {
        throw new Error('Method not implemented.');
    }
    scaleFromOrigin(xScale: number, yScale: number): ICurve {
        throw new Error('Method not implemented.');
    }
    start(): Point {
        throw new Error('Method not implemented.');
    }
    end(): Point {
        throw new Error('Method not implemented.');
    }
    reverse(): ICurve {
        throw new Error('Method not implemented.');
    }
    offsetCurve(offset: number, dir: Point): ICurve {
        throw new Error('Method not implemented.');
    }
    lengthPartial(start: number, end: number): number {
        throw new Error('Method not implemented.');
    }
    length(): number {
        throw new Error('Method not implemented.');
    }
    getParameterAtLength(length: number): number {
        throw new Error('Method not implemented.');
    }
    transform(transformation: PlaneTransformation): ICurve {
        throw new Error('Method not implemented.');
    }
    closestParameterWithinBounds(targetPoint: Point, low: number, high: number): number {
        throw new Error('Method not implemented.');
    }
    closestParameter(targetPoint: Point): number {
        throw new Error('Method not implemented.');
    }
    clone(): ICurve {
        throw new Error('Method not implemented.');
    }
    leftDerivative(t: number): Point {
        throw new Error('Method not implemented.');
    }
    rightDerivative(t: number): Point {
        throw new Error('Method not implemented.');
    }
    curvature(t: number): number {
        throw new Error('Method not implemented.');
    }
    curvatureDerivative(t: number): number {
        throw new Error('Method not implemented.');
    }
    curvatureSecondDerivative(t: number): number {
        throw new Error('Method not implemented.');
    }
}
