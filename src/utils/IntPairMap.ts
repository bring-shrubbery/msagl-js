import {IntPair} from './IntPair'
export class IntPairMap<T> {
  map: Map<number, T>[]
  get(x: number, y: number) {
    if (x < 0 || x >= this.map.length) {
      return null
    }
    return this.map[x].get(y)
  }
  constructor(n: number) {
    this.map = new Array<Map<number, T>>(n)
    for (let i = 0; i < n; i++) this.map[i] = new Map<number, T>()
  }
}
