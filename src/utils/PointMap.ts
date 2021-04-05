import { Point } from '../math/geometry/point'

export class PointMap<T> {
  deleteP(point: Point) {
    this.delete(point.x, point.y)
  }
  mapOfMaps: Map<number, Map<number, T>>
  size_: number
  get size(): number { return this.size_ }
  set(x: number, y: number, v: T) {
    let m = this.mapOfMaps.get(x)
    if (m == null) this.mapOfMaps.set(x, (m = new Map<number, T>()))

    if (!m.has(x)) {
      this.size_++
    }
    m.set(y, v)
  }
  setP(p: Point, v: T) {
    this.set(p.x, p.y, v)
  }

  delete(x: number, y: number) {
    const m = this.mapOfMaps.get(x)
    if (m != null) {
      m.delete(y)
      this.size_--
    }
  }

  has(x: number, y: number): boolean {
    return this.mapOfMaps.has(x) && this.mapOfMaps.get(x).has(y)
  }
  hasP(p: Point) {
    return this.has(p.x, p.y)
  }
  get(x: number, y: number) {
    const m = this.mapOfMaps.get(x)
    if (m == null) return

    return m.get(y)
  }
  getP(p: Point) {
    return this.get(p.x, p.y)
  }
  constructor() {
    this.mapOfMaps = new Map<number, Map<number, T>>()
  }

  *keys(): IterableIterator<Point> {
    for (const p of this.mapOfMaps) {
      for (const yp of p[1]) {
        yield new Point(p[0], yp[0])
      }
    }
  }

  *keyValues(): IterableIterator<[Point, T]> {
    for (const p of this.mapOfMaps) {
      for (const yV of p[1]) {
        yield [new Point(p[0], yV[0]), yV[1]]
      }
    }
  }

  *values(): IterableIterator<T> {
    for (const p of this.mapOfMaps) {
      for (const yV of p[1]) {
        yield yV[1]
      }
    }
  }
}
