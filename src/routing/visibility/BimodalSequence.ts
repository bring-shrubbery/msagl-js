import { extremum, UnimodalSequence } from './UnimodalSequence'

//  For our purposes, it suffices to define a bimodal function as
//  one for which there is an r in [0, n-1] such that
// [f(r), f(r + 1), . . . , f(n), f( 1), . . . ,  f(r - 1)] is unimodal. In our case no three sequential elements have the same value
export class BimodalSequence {
  f: (m: number) => number;

  length: number;

  r: number
  arr: number[]
  toArray() {
    const r = []
    for (let i = 0; i < this.length; i++)
      r.push(this.f(i))
    return r
  }
  constructor(sequence: (m: number) => number, length: number) {
    this.f = sequence;
    this.length = length;
    this.arr = this.toArray()
    this.r = this.findR()
  }

  //  the length of the sequence: the sequence starts from 0
  get Length(): number {
    return this.length;
  }

  // following Chazelle, Dobkin
  FindMinimum(): number {
    // need to map O to r, 1 to r+1 etc.
    const adjustedF = (i: number) => {
      return this.f((i + this.r) % this.length)
    }
    const ret = new UnimodalSequence(adjustedF, this.length).FindMinimum()
    return (ret + this.r) % this.length
  }

  isR(rCandidate: number): boolean {
    if (this.arr[rCandidate] < this.arr[rCandidate + 1])
      return this.isROnHat(rCandidate)
    else return this.isROnV(rCandidate)
  }
  c(i: number) {
    return i < this.length ? i : this.length - i
  }
  isROnV(r: number): boolean {
    let i = 0
    for (; i < this.length - 1; i++) {
      if (this.arr[this.c(i + r)] <= this.arr[this.c(i + r + 1)])
        break

    }
    for (; i < this.length - 1; i++) {
      if (this.arr[this.c(i + r)] >= this.arr[this.c(i + r + 1)])
        return false
    }
    return true
  }

  isROnHat(r: number): boolean {
    let i = 0
    for (; i < this.length - 1; i++) {
      if (this.arr[this.c(i + r)] >= this.arr[this.c(i + r + 1)])
        break
    }
    for (; i < this.length - 1; i++) {
      if (this.arr[this.c(i + r)] <= this.arr[this.c(i + r + 1)])

        return false
    }
    return true
  }

  findR(): number {
    const exs: number[] = this.getExtremuma()
    if (exs.length < 2)
      return 0
    if (exs.length > 2)
      throw new Error('not a bimodal sequence, because it has more than two extremuma')
    if (this.isR(exs[0]))
      return exs[0]
    if (this.isR(exs[1]))
      return exs[1]
    throw new Error('not a bimodal sequence because it cannot be transformed to a unimodal one')
  }
  getExtremuma(): number[] {
    const exs = []
    for (let i = 1; i < this.length; i++) {
      if (this.extremum(i)) exs.push(i)

    }
    return exs
  }
  extremum(i: number): boolean {
    const a = this.arr[i - 1] - this.arr[i]
    const b = this.arr[i + 1] - this.arr[i]
    return (a > 0 && b > 0) || (a < 0 && b < 0)
  }

  FindMaximum(): number {
    const adjustedF = (i: number) => this.f((this.r + i) % this.length)
    const ret = new UnimodalSequence(adjustedF, this.length).FindMaximum();
    return this.c(ret + this.r)
  }
}


