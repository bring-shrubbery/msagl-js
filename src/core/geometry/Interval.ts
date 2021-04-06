import {GeomConstants} from '../../math/geometry/geomConstants'
import {IRectangle} from './IRectangle'

export class Interval implements IRectangle<number> {
  start: number
  end: number

  //  constructor
  //  <param name="start"></param>
  //  <param name="end"></param>
  constructor(start: number, end: number) {
    this.start = start
    this.End = end
  }
  area: number
  add(n: number): void {
    this.add_d(n)
  }
  add_rect(rectangle: IRectangle<number>): IRectangle<number> {
    const r = (rectangle as unknown) as Interval
    this.add_d(r.start)
    this.add_d(r.end)
    return this
  }
  contains_point(n: number): boolean {
    return this.contains_d(n)
  }
  contains_rect(rect: IRectangle<number>): boolean {
    const r = (rect as unknown) as Interval
    return this.contains_d(r.start) && this.contains_d(r.end)
  }

  intersection_rect(rectangle: IRectangle<number>): IRectangle<number> {
    const r = rectangle as Interval
    return new Interval(
      Math.max(this.start, r.start),
      Math.min(this.End, r.End),
    )
  }
  intersects_rect(rectangle: IRectangle<number>): boolean {
    const r = (rectangle as unknown) as Interval
    return this.intersects(r)
  }

  contains_point_radius(p: number, radius: number): boolean {
    return this.contains_d(p - radius) && this.contains_d(p + radius)
  }

  //
  //  <param name="a"></param>
  //  <param name="b"></param>
  static mkInterval(a: Interval, b: Interval) {
    const i = new Interval(a.start, a.End)
    i.add_d(b.start)
    i.add_d(b.End)
    return i
  }

  //  expanding the range to hold v
  //  <param name="v"></param>
  add_d(v: number) {
    if (this.start > v) {
      this.start = v
    }

    if (this.End < v) {
      this.End = v
    }
  }

  get Start(): number {
    return this.start
  }
  set Start(value: number) {
    this.start = value
  }

  //
  get End(): number {
    return this.end
  }
  set End(value: number) {
    this.end = value
  }

  //  the length
  get Length(): number {
    return this.End - this.start
  }

  //  return true if the value is inside the range
  //  <param name="v"></param>
  //  <returns></returns>
  contains_d(v: number): boolean {
    return this.start <= v && v <= this.End
  }

  //  bringe v into the range
  //  <param name="v"></param>
  //  <returns></returns>
  GetInRange(v: number): number {
    return v < this.start ? this.start : v > this.End ? this.End : v
  }

  //  returns true if and only if two intervals are intersecting
  //  <param name="other"></param>
  intersects(other: Interval): boolean {
    if (other.start > this.End + GeomConstants.distanceEpsilon) {
      return false
    }

    return !(other.End < this.start - GeomConstants.distanceEpsilon)
  }
}
