import {Algorithm} from '../../../utils/algorithm'
import {Rectangle} from '../rectangle'

//  Algorithm to pack rectangles
export abstract class Packing extends Algorithm {
  //  The width of the widest row in the packed solution
  private packedWidth: number
  public get PackedWidth(): number {
    return this.packedWidth
  }
  public set PackedWidth(value: number) {
    this.packedWidth = value
  }

  //  The height of the bounding box of the packed solution
  private packedHeight: number
  public get PackedHeight(): number {
    return this.packedHeight
  }
  public set PackedHeight(value: number) {
    this.packedHeight = value
  }

  //  Aspect ratio of the bounding box of the packed solution
  public get PackedAspectRatio(): number {
    return this.PackedWidth / this.PackedHeight
  }

  abstract getRects(): Rectangle[]
}
