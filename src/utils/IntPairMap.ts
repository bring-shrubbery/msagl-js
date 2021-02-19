export class IntPairMap<T> {
  set(x: number, y: number, v: T) {
    this.map[x].set(y, v)
  }
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
