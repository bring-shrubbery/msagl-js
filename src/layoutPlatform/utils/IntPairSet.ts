import {IntPair} from './IntPair'
import {IEnumerable} from 'linq-to-typescript'

export class IntPairSet {
  arrayOfSets: Set<number>[]
  remove(p: IntPair) {
    if (p.x < 0 || p.x >= this.arrayOfSets.length) {
      return
    }
    return this.arrayOfSets[p.x].delete(p.y)
  }
  has(x: number, y: number): boolean {
    if (x < 0 || x >= this.arrayOfSets.length) {
      return false
    }
    const s = this.arrayOfSets[x]
    return s != undefined && s.has(y)
  }

  constructor() {
    this.arrayOfSets = new Array<Set<number>>()
  }

  static mk(ps: IEnumerable<IntPair>) {
    const r = new IntPairSet()
    for (const p of ps) r.add(p)
    return r
  }

  *values(): IterableIterator<IntPair> {
    for (let i = 0; i < this.arrayOfSets.length; i++)
      for (const j of this.arrayOfSets[i]) yield new IntPair(i, j)
  }
  add(p: IntPair) {
    let s = this.arrayOfSets[p.x]
    if (s == undefined) {
      this.arrayOfSets[p.x] = s = new Set<number>()
    }
    s.add(p.y)
  }
  addNN(x: number, y: number) {
    let s = this.arrayOfSets[x]
    if (s == undefined) {
      this.arrayOfSets[x] = s = new Set<number>()
    }
    s.add(y)
  }

  clear() {
    for (const s of this.arrayOfSets) {
      if (s) s.clear()
    }
  }
}
