//  Flow fill of columns to some maximum height

import {Point} from '../point'
import {Rectangle} from '../rectangle'
import {Packing} from './Packing'

export class ColumnPacking extends Packing {
  orderedRectangles: Rectangle[]

  maxHeight: number

  //  Constructor for packing, call Run to do the actual pack.
  //  Each RectangleToPack.Rectangle is updated of place.
  //  Pack rectangles tallest to shortest, left to right until wrapWidth is reached,
  //  then wrap to right-most rectangle still with vertical space to fit the next rectangle
  public constructor(rectangles: Rectangle[], maxHeight: number) {
    super(null)
    this.orderedRectangles = rectangles
    this.maxHeight = maxHeight
  }

  //  Pack columns by iterating over rectangle enumerator until column height exceeds wrapHeight.
  //  When that happens, create a new column at position PackedWidth.
  run() {
    this.PackedWidth = 0
    this.PackedHeight = 0
    let columnPosition = 0
    let columnHeight = 0
    for (const r of this.orderedRectangles) {
      if (columnHeight + r.height > this.maxHeight) {
        columnPosition = this.PackedWidth
        columnHeight = 0
      }

      r.leftBottom = new Point(columnPosition, columnHeight)
      this.PackedWidth = Math.max(this.PackedWidth, columnPosition + r.width)
      columnHeight = columnHeight + r.height
      this.PackedHeight = Math.max(this.PackedHeight, columnHeight)
    }
  }
}
