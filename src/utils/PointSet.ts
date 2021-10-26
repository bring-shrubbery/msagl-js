import {Point} from '../math/geometry/point'

export class PointSet {
  mapOfSets: Map<number, Set<number>>
  private size_ = 0
  deleteP(point: Point) {
    this.delete(point.x, point.y)
  }
  clear() {
    this.mapOfSets.clear()
    this.size_ = 0
  }

  get size(): number {
    return this.size_
  }

  static mk(points: Iterable<Point>): PointSet {
    const ret = new PointSet()
    for (const p of points) {
      ret.add(p)
    }
    return ret
  }

  addxy(x: number, y: number) {
    let m = this.mapOfSets.get(x)
    if (m == null) this.mapOfSets.set(x, (m = new Set<number>()))

    if (!m.has(y)) {
      this.size_++
    }
    m.add(y)
  }
  add(p: Point) {
    this.addxy(p.x, p.y)
  }

  delete(x: number, y: number) {
    const m = this.mapOfSets.get(x)
    if (m != null) {
      if (m.delete(y)) this.size_--
    }
  }

  has(x: number, y: number): boolean {
    return this.mapOfSets.has(x) && this.mapOfSets.get(x).has(y)
  }
  hasP(p: Point) {
    return this.has(p.x, p.y)
  }

  constructor() {
    this.mapOfSets = new Map<number, Set<number>>()
  }

  *values(): IterableIterator<Point> {
    for (const p of this.mapOfSets) {
      for (const yV of p[1]) {
        yield new Point(p[0], yV)
      }
    }
  }
}
