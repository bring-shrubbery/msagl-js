import {BasicGraph} from '../../structs/BasicGraph'
import {PolyIntEdge} from './polyIntEdge'
import {Node} from '../../structs/node'
import {IEdge} from '../../structs/iedge'
import {GeomNode} from '../core/geomNode'
import {BasicGraphOnEdges} from '../../structs/basicGraphOnEdges'
import {IntPair} from '../../utils/IntPair'
import {IntPairSet} from '../../utils/IntPairSet'

export class CycleRemoval {
  static getFeedbackSetWithConstraints(
    arg0: BasicGraphOnEdges<IntPair>,
    arg1: IntPairSet,
  ): IntPair[] {
    throw new Error('Method not implemented.')
  }
  static getFeedbackSet(intGraph: BasicGraph<GeomNode, PolyIntEdge>): IEdge[] {
    throw new Error('not implemented')
  }
}
