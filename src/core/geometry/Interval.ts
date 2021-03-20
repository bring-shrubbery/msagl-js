import { GeomConstants } from "../../math/geometry/geomConstants";

export class Interval {
  start: number;
  end: number;

  //  constructor
  //  <param name="start"></param>
  //  <param name="end"></param>
  constructor(start: number, end: number) {
    this.Start = start;
    this.End = end;
  }

  //  
  //  <param name="a"></param>
  //  <param name="b"></param>
  static mkInterval(a: Interval, b: Interval) {
    const i = new Interval(a.Start, a.End)
    i.Add(b.Start);
    i.Add(b.End);
    return i
  }

  //  expanding the range to hold v
  //  <param name="v"></param>
  Add(v: number) {
    if (this.Start > v) {
      this.Start = v;
    }

    if (this.End < v) {
      this.End = v;
    }
  }


  get Start(): number {
    return this.start;
  }
  set Start(value: number) {
    this.start = value;
  }

  //  
  get End(): number {
    return this.end;
  }
  set End(value: number) {
    this.end = value;
  }

  //  the length
  get Length(): number {
    return this.End - this.Start
  }

  //  return true if the value is inside the range
  //  <param name="v"></param>
  //  <returns></returns>
  Contains(v: number): boolean {
    return (this.Start <= v && v <= this.End);
  }

  //  bringe v into the range
  //  <param name="v"></param>
  //  <returns></returns>
  GetInRange(v: number): number {
    return v < this.Start ? this.Start : (v > this.End ? this.End : v);
  }

  //  returns true if and only if two intervals are intersecting
  //  <param name="other"></param>
  Intersects(other: Interval): boolean {
    if ((other.Start
      > (this.End + GeomConstants.distanceEpsilon))) {
      return false;
    }

    return !(other.End
      < (this.Start - GeomConstants.distanceEpsilon));
  }
}
