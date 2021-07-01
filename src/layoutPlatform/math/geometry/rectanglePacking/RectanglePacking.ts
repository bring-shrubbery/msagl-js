﻿import {Stack} from 'stack-typescript'
import {Point} from '../point'
import {Rectangle} from '../rectangle'
import {Packing} from './Packing'

//  Greedily pack rectangles (without rotation) into a given aspect ratio
export class GreedyRectanglePacking extends Packing {
  rectanglesByDescendingHeight: Rectangle[]

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
    this.rectsToCenters = new Map<Rectangle, Point>()
    this.rectanglesByDescendingHeight = rectanglesPresorted
      ? rectangles
      : GreedyRectanglePacking.SortRectangles(rectangles)
    this.wrapWidth = wrapWidth
  }

  //  Sort rectangles by height
  public static SortRectangles(rectangles: Rectangle[]): Rectangle[] {
    rectangles.sort((a, b) => b.height - a.height)
    return rectangles
  }

  //  Pack rectangles tallest to shortest, left to right until wrapWidth is reached,
  //  then wrap to right-most rectangle still with vertical space to fit the next rectangle
  run() {
    this.Pack()
  }

  //  Traverses the rectangleEnumerator and places rectangles at the next available slot beneath the current parent,
  //  until the parent is filled or until maxRowWidth is reached.  Each successfully placed rectangle is pushed onto
  //  a stack, when there is no room for the rectangle we pop the stack for a new parent and try again.
  Pack() {
    this.PackedWidth = 0
    this.PackedHeight = 0
    //  get next rectangle
    const stack = new Stack<Rectangle>()
    let wrap = false
    let verticalPosition = 0
    let packedWidth = 0
    let packedHeight = 0
    const rects = this.rectanglesByDescendingHeight
    for (let i = 0; wrap || i < rects.length; ) {
      const r = rects[i]
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
        const center = leftBottom.add(new Point(r.width / 2, r.height / 2))
        r.center = center
        this.rectsToCenters.set(r, center)

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
