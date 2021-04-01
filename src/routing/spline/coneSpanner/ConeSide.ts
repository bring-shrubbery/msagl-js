import {Point} from '../../../math/geometry/point'
import {Cone} from './Cone'

export abstract class ConeSide {
  abstract get Start(): Point

  abstract get Direction(): Point

  abstract get Cone(): Cone
  abstract set Cone(value: Cone)

  abstract get Removed(): boolean
  abstract set Removed(value: boolean)
}
