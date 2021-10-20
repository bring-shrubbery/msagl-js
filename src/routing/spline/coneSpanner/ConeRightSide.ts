import {Point} from '@/src'
import {Cone} from './Cone'
import {ConeSide} from './ConeSide'

export class ConeRightSide extends ConeSide {
  constructor(cone: Cone) {
    super()
    super.Cone = cone
  }

  get Start(): Point {
    return super.Cone.Apex
  }

  get Direction(): Point {
    return super.Cone.RightSideDirection
  }

  toString(): string {
    return 'ConeRightSide ' + (this.Start + (' ' + this.Direction))
  }
}
