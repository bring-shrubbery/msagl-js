import {Stack} from 'stack-typescript'
import {Point} from '../point'
import {Rectangle} from '../rectangle'
import {Packing} from './Packing'

//  Greedily pack rectangles (without rotation) into a given aspect ratio
export class RectanglePacking extends Packing {
  rectanglesByDescendingHeight: Rectangle[]
  getRects() {
    return this.rectanglesByDescendingHeight
  }
  wrapWidth: number

  //  Constructor for packing, call Run to do the actual pack.
  //  Each RectangleToPack.Rectangle is updated in place.
  //  Pack rectangles tallest to shortest, left to right until wrapWidth is reached,
  //  then wrap to right-most rectangle still with vertical space to fit the next rectangle
  constructor(
    rectangles: Rectangle[],
    wrapWidth: number,
    rectanglesPresorted = false,
  ) {
    super(null)
    this.rectanglesByDescendingHeight = rectanglesPresorted
      ? rectangles.map((r) => r.clone())
      : RectanglePacking.SortRectangles(rectangles).map((r) => r.clone())
    this.wrapWidth = wrapWidth
  }

  //  Sort rectangles by height
  public static SortRectangles(rectangles: Rectangle[]): Rectangle[] {
    rectangles.sort((a, b) => a.height - b.height)
    return rectangles
  }

  //  Pack rectangles tallest to shortest, left to right until wrapWidth is reached,
  //  then wrap to right-most rectangle still with vertical space to fit the next rectangle
  run() {
    this.Pack(this.rectanglesByDescendingHeight)
  }

  //  Traverses the rectangleEnumerator and places rectangles at the next available slot beneath the current parent,
  //  until the parent is filled or until maxRowWidth is reached.  Each successfully placed rectangle is pushed onto
  //  a stack, when there is no room for the rectangle we pop the stack for a new parent and try again.
  Pack(rects: Rectangle[]) {
    this.PackedWidth = 0
    this.PackedHeight = 0
    //  get next rectangle
    const stack = new Stack<Rectangle>()
    let wrap = false
    let verticalPosition = 0
    let packedWidth = 0
    let packedHeight = 0
    for (let i = 0; wrap || i < rects.length; ) {
      let r = rects[i]
      const parent = stack.length > 0 ? stack.top : null
      if (
        parent == null ||
        (parent.right + r.width <= this.wrapWidth &&
          verticalPosition + r.height <= parent.top)
      ) {
        const leftBottom = new Point(
          parent ? parent.right : 0,
          verticalPosition,
        )
        r = rects[i] = Rectangle.rectangleFromLeftBottomAndSize(
          leftBottom.x,
          leftBottom.y,
          new Point(r.width, r.height),
        )

        packedWidth = Math.max(packedWidth, r.right)
        packedHeight = Math.max(packedHeight, r.top)
        stack.push(r)
        wrap = false
      } else {
        verticalPosition = parent.top
        stack.pop()
        wrap = true
      }
      if (!wrap) i++
    }

    this.PackedWidth = packedWidth
    this.PackedHeight = packedHeight
  }
}
