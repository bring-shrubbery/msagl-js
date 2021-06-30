import {IEnumerable} from 'linq-to-typescript'
import {Assert} from '../../../utils/assert'
import {Rectangle} from '../rectangle'
import {OptimalPacking} from './OptimalPacking'
import {RectanglePacking} from './RectanglePacking'

//  Pack rectangles (without rotation) into a given aspect ratio
export class OptimalRectanglePacking extends OptimalPacking {
  //  Constructor for packing, call Run to do the actual pack.
  //  Each RectangleToPack.Rectangle is updated in place.
  //  Performs a Golden Section Search on packing width for the
  //  closest aspect ratio to the specified desired aspect ratio
  public constructor(rectangles: Rectangle[], aspectRatio: number) {
    super(RectanglePacking.SortRectangles(rectangles), aspectRatio)
    Assert.assert(
      rectangles.length > 0,
      'Expected more than one rectangle in rectangles',
    )
    Assert.assert(aspectRatio > 0, 'aspect ratio should be greater than 0')
    this.createPacking = (rs, width) => new RectanglePacking(rs, width, true)
  }

  //  Performs a Golden Section Search on packing width for the
  //  closest aspect ratio to the specified desired aspect ratio
  run() {
    let minRectWidth: number = Number.MAX_VALUE
    let maxRectWidth = 0
    let totalWidth = 0
    //  initial widthLowerBound is the width of a perfect packing for the desired aspect ratio
    for (const r of this.rectangles) {
      Assert.assert(r.width > 0, 'Width must be greater than 0')
      Assert.assert(r.height > 0, 'Height must be greater than 0')
      const width: number = r.width
      totalWidth = totalWidth + width
      minRectWidth = Math.min(minRectWidth, width)
      maxRectWidth = Math.max(maxRectWidth, width)
    }

    this.Pack(maxRectWidth, totalWidth, minRectWidth)
  }
}
