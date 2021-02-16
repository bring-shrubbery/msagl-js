import {IHasClusters} from './graph'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'
export class Cluster extends Node implements IHasClusters {
  clusters: Cluster[]
  isCollapsed = false
  nodeCollection: NodeCollection = new NodeCollection()
}
