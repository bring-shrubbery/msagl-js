//  floating port: specifies that the edge is routed to the Location

import {ICurve} from '../../math/geometry/icurve'
import {Point} from '../../math/geometry/point'
import {Port} from './Port'

export class FloatingPort extends Port {
  curve: ICurve

  // a curve associated with the port
  public constructor(curve: ICurve, location: Point) {
    super()
    this.curve = this.curve
    this.location = location
  }

  location: Point

  //  the location of the port
  public get Location(): Point {
    return this.location
  }

  //  translate the port location by delta
  public Translate(delta: Point) {
    this.location = this.location.add(delta)
  }

  //  the port's curve
  public get Curve(): ICurve {
    return this.curve
  }
  public set Curve(value: ICurve) {
    this.curve = value
  }

  //  Return a string representation of the Port location
  public ToString(): string {
    return this.Location.toString()
  }
}
