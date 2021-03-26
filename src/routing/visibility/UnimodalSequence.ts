import { Assert } from "../../utils/assert";

enum Behavior { Increasing, Decreasing, Extremum }

//  A real valued function f defined on
//  the integers 0, 1, . . . , n-1 is said to be unimodal if there exists an integer m such that
// f is strictly increasing (respectively, decreasing) on [ 0, m] and
//  decreasing (respectively, increasing) on [m + 1, n-1]
//  No three sequential elements have the same value
export class UnimodalSequence {

  toArray() {
    const r = []
    for (let i = 0; i < this.length; i++)
      r.push(this.f(i))
    return r
  }
  isUnimodal(): boolean {
    const arr = this.toArray()
    if (this.length <= 3) return true;
    if (!this.threeSequentialAreDifferent()) return false

    let d = 0
    let k = 0
    let t = [this.f(0), this.f(1), this.f(2)]
    let j = 3
    do {
      if (extremum(t, d)) {
        if (++k > 1)
          return false
      }
      t[d] = this.f(j)
      d = (d + 1) % 3
      j++;

    } while (j < this.length)
    return true
  }



  threeSequentialAreDifferent(): boolean {
    const arr = []
    for (let i = 0; i < this.length; i++) {
      if (arr.length < 2) {
        arr.push(this.f(i))
      }
      else {
        if (arr.includes(this.f(i)))
          return false;
        arr[0] = arr[1]
        arr[1] = this.f(i)
      }
    }
    return true
  }

  f: (m: number) => number;  // int -> double

  //  the sequence values
  get Sequence() {
    return this.f;
  }
  set Sequence(value: (m: number) => number) {
    this.f = value;
  }

  length: number;

  //  the length of the sequence: the sequence starts from 0
  get Length(): number {
    return this.length;
  }
  set Length(value: number) {
    this.length = value;
  }

  constructor(sequenceDelegate: (m: number) => number, length: number) {
    this.f = sequenceDelegate;
    this.Length = length;
    Assert.assert(this.isUnimodal())
  }

  FindMinimum(): number {
    const ttt = []
    for (let i = 0; i < this.length; i++) { ttt.push(this.f(i)) }

    // find out first that the minimum is inside of the domain
    let a: number = 0;
    let b: number = this.Length - 1
    let m: number = a + Math.floor((b - a) / 2)
    let valAtM: number = this.f(m);
    if (valAtM >= this.f(0) && valAtM >= this.f(this.Length - 1))
      return this.f(0) < this.f(this.Length - 1) ? 0 : this.Length - 1;
    while (b - a > 1) {
      m = a + Math.floor((b - a) / 2);
      switch (this.BehaviourAtIndex(m)) {
        case Behavior.Decreasing:
          a = m;
          break;
        case Behavior.Increasing:
          b = m;
          break;
        case Behavior.Extremum:
          return m;
      }
    }

    return (a == b) ? a : (this.f(a) <= this.f(b) ? a : b)
  }

  private BehaviourAtIndex(m: number): Behavior {
    let seqAtM: number = this.f(m);
    if ((m == 0)) {
      let seqAt1: number = this.f(1);
      if ((seqAt1 == seqAtM)) {
        return Behavior.Extremum;
      }

      return seqAt1 > seqAtM ? Behavior.Increasing : Behavior.Decreasing;
    }

    if ((m == (this.Length - 1))) {
      let seqAt1: number = this.f((this.Length - 2));
      if ((seqAt1 == seqAtM)) {
        return Behavior.Extremum;
      }
      return seqAt1 > seqAtM ? Behavior.Decreasing : Behavior.Increasing;
    }

    let delLeft: number = (seqAtM - this.f((m - 1)));
    let delRight: number = (this.f((m + 1)) - seqAtM);
    if (delLeft * delRight <= 0) {
      return Behavior.Extremum;
    }
    return delLeft > 0 ? Behavior.Increasing : Behavior.Decreasing;
  }

  FindMaximum(): number {
    // find out first that the maximum is inside of the domain
    let a: number = 0;
    let b: number = (this.Length - 1);
    let m: number = (a + Math.floor((b - a) / 2));
    let valAtM: number = this.f(m);
    if (((valAtM <= this.f(0))
      && (valAtM <= this.f((this.Length - 1))))) {
      return this.f(0) > this.f(this.Length - 1) ? 0 : this.Length - 1;
    }

    while (b - a > 1) {
      m = a + Math.floor((b - a) / 2);
      switch (this.BehaviourAtIndex(m)) {
        case Behavior.Decreasing:
          b = m;
          break;
        case Behavior.Increasing:
          a = m;
          break;
        case Behavior.Extremum:
          return m;

      }

    }

    return (a == b) ? a : (this.f(a) > this.f(b) ? a : b)
  }
}
export function extremum(arr: number[], d: number): boolean {
  const i0 = d
  const i1 = (d + 1) % 3
  const i2 = (d + 2) % 3
  const a = arr[i0] - arr[i1]
  const b = arr[i2] - arr[i1]
  return a > 0 && b > 0 || a < 0 && b < 0
}
