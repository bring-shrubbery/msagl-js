import {ICurve, Point} from '../..'
import {Port} from './port'

export class CurvePort extends Port {
  get Location(): Point {
    return this.curve.value(this.parameter)
  }
  set Location(value: Point) {
    throw new Error('Method should not be called.')
  }
  parameter: number

  ///  <summary>
  ///  constructor
  ///  </summary>
  ///  <param name="curve"></param>
  ///  <param name="parameter"></param>
  static mk(curve: ICurve, parameter: number): CurvePort {
    const ret = new CurvePort()
    ret.curve = curve
    ret.parameter = parameter
    return ret
  }

  get Parameter(): number {
    return this.parameter
  }
  set Parameter(value: number) {
    this.parameter = value
  }

  curve: ICurve

  get Curve(): ICurve {
    return this.curve
  }
  set Curve(value: ICurve) {
    this.curve = value
  }
}
