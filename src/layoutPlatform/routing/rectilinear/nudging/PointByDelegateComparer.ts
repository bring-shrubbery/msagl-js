import {Point} from '../../../..'
import {compareNumbers} from '../../../utils/compare'
import { Comparison, Comparer } from "@esfx/equatable";
export class PointByDelegateComparer implements Comparer<Point> {
  projection: (p: Point) => number

  public constructor(projection: (p: Point) => number) {
    this.projection = projection
  }

  public compare(x: Point, y: Point): number {
    return compareNumbers(this.projection(x), this.projection(y))
  }
}
