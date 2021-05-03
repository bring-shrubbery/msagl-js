import {Point} from './point'
import {Polyline} from './polyline'

export class PolylinePoint {
  point: Point
  next: PolylinePoint
  prev: PolylinePoint
  polyline: Polyline

  get nextOnPolyline(): PolylinePoint {
    return this.polyline.next(this)
  }

  //
  getNext(): PolylinePoint {
    return this.next
  }

  setNext(nVal: PolylinePoint) {
    this.next = nVal
    if (this.polyline != null) this.polyline.requireInit()
  }

  //
  getPrev() {
    return this.prev
  }
  setPrev(prevVal: PolylinePoint) {
    this.prev = prevVal
    if (this.polyline != null) this.polyline.requireInit()
  }

  static mkPolylinePoint(p: Point) {
    const pp = new PolylinePoint()
    pp.point = p.clone()
    return pp
  }
}
