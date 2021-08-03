/*
import {Polyline} from '../math/geometry/polyline'
import {Shape} from './Shape'

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

  //  compare just by TightPolyline


  public Equals(couple: TightLooseCouple): boolean {
    if (couple == null) {
      return false
    }

    return this.TightPolyline == couple.TightPolyline
  }

  public toString(): string {
    return (
      (this.TightPolyline == null
        ? 'null'
        : this.TightPolyline.toString().substring(0, 5)) +
      ',' +
      (this.LooseShape == null
        ? 'null'
        : this.LooseShape.toString().substring(0, 5))
    )
  }
}
*/
