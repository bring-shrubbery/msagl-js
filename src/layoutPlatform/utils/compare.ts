import {Point} from '../math/geometry/point'

export function compareBooleans(a: boolean, b: boolean): number {
  // return a - b
  return (a ? 1 : 0) - (b ? 1 : 0)
}
export function compareNumbers(a: number, b: number): number {
  return a > b ? 1 : a < b ? -1 : 0
}

export function comparePointsYFirst(a: Point, b: Point) {
  const cmp = compareNumbers(a.y, b.y)
  return cmp ? cmp : compareNumbers(a.x, b.x)
}
