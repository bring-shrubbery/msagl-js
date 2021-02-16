import {Node} from './node'
import {NodeCollection} from './nodeCollection'
export class Cluster extends Node {
  isCollapsed = false
  nodeCollection: NodeCollection = new NodeCollection()
}
