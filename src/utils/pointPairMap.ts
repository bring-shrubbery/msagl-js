import {Point} from '../math/geometry/point'
import {PointMap} from './PointMap'

export class PointPairMap<T> {
  mapOfMaps: PointMap<PointMap<T>>
  private size_ = 0
  clear() {
    this.mapOfMaps.clear()
    this.size_ = 0
  }

  get size(): number {
    return this.size_
  }
  setA(pp: [Point, Point], v: T) {
    this.set(pp[0], pp[1], v)
  }
  set(x: Point, y: Point, v: T) {
    let m = this.mapOfMaps.get(x)
    if (m == null) this.mapOfMaps.set(x, (m = new PointMap<T>()))

    if (!m.hasP(y)) {
      this.size_++
    }
    m.set(y, v)
  }

  delete(x: Point, y: Point) {
    const m = this.mapOfMaps.get(x)
    if (m != null) {
      if (m.deleteP(y)) this.size_--
    }
  }

  has(x: Point, y: Point): boolean {
    const m = this.mapOfMaps.get(x)
    return m != null && m.hasP(y)
  }
  hasA(p: [Point, Point]): boolean {
    return this.has(p[0], p[1])
  }
  get(x: Point, y: Point): T {
    const m = this.mapOfMaps.get(x)
    if (m == null) return

    return m.get(y)
  }
  getA(p: [Point, Point]): T {
    return this.get(p[0], p[1])
  }
  constructor() {
    this.mapOfMaps = new PointMap<PointMap<T>>()
  }

  *keys(): IterableIterator<[Point, Point]> {
    for (const p of this.mapOfMaps) {
      for (const yp of p[1]) {
        yield [p[0], yp[0]]
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<[[Point, Point], T]> {
    for (const [x, m] of this.mapOfMaps) {
      for (const [y, t] of m) {
        yield [[x, y], t]
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
