/*
import {ICurve} from '../../math/geometry/icurve'
import {Port} from './Port'
export class CurvePort extends Port {
  parameter: number

  static constructor_(curve: ICurve, parameter: number) {
    const p = new CurvePort()
    p.Curve = curve
    p.parameter = parameter
    return p
  }

  //
  public get Parameter(): number {
    return this.parameter
  }
  public set Parameter(value: number) {
    this.parameter = value
  }

  Curve: ICurve
  get Location() {
    return this.Curve.value(this.parameter)
  }
}
*/
