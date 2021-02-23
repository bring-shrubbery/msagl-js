import { IntPair } from './IntPair'
import { IEnumerable } from 'linq-to-typescript'

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
    return this.arrayOfSets[x].has(y)
  }

  constructor(n: number) {
    this.arrayOfSets = new Array<Set<number>>(n)
    for (let i = 0; i < n; i++) this.arrayOfSets[i] = new Set<number>()
  }

  static mk(ps: IEnumerable<IntPair>) {
    const length = ps.max((p) => p.x) + 1
    const r = new IntPairSet(length)
    for (const p of ps)
      r.add(p)
    return r
  }

  *iter(): IterableIterator<IntPair> {
    for (let i = 0; i < this.arrayOfSets.length; i++)
      for (const j of this.arrayOfSets[i]) yield new IntPair(i, j)
  }
  add(p: IntPair) {
    this.arrayOfSets[p.x].add(p.y)
  }
}
