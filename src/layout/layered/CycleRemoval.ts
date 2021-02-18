import {BasicGraph} from '../../structs/BasicGraph'
import {PolyIntEdge} from './polyIntEdge'
import {Node} from '../../structs/node'
import {IEdge} from '../../structs/iedge'

export class CycleRemoval {
  static getFeedbackSet(intGraph: BasicGraph<Node, PolyIntEdge>): IEdge[] {
    throw new Error('not implemented')
  }
}
