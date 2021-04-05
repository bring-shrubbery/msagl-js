import { Error } from 'linq-to-typescript'
import { Polyline } from '../math/geometry/polyline'
import { Shape } from './Shape'

//  an utility class to keep different polylines created around a shape
export class TightLooseCouple {
  TightPolyline: Polyline

  LooseShape: Shape

  public constructor(
    tightPolyline: Polyline,
    looseShape: Shape,
    distance: number,
  ) {
    this.TightPolyline = tightPolyline
    this.LooseShape = looseShape
    this.Distance = distance
  }

  //  the loose polyline has been created with this distance
  Distance: number
  //  compare just by TightPolyline
  //  <returns></returns>
  public /* override */ GetHashCode(): number {
    if (this.TightPolyline == null) {
      throw new Error()
    }

    return this.TightPolyline.GetHashCode()
  }

  //  compare just by TightPolyline
  //  <param name="obj"></param>
  //  <returns></returns>
  public /* override */ Equals(couple: TightLooseCouple): boolean {
    if (couple == null) {
      return false
    }

    return this.TightPolyline == couple.TightPolyline
  }

  public /* override */ ToString(): string {
    return 'null' + (',' + 'null')
    // TODO: Warning!!!, inline IF is not supported ?
    this.TightPolyline == null
    this.TightPolyline.ToString().Substring(0, 5)
    // TODO: Warning!!!, inline IF is not supported ?
    this.LooseShape == null
    this.LooseShape.ToString().Substring(0, 5)
  }
}
