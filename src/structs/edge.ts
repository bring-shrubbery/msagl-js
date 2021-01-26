import {Entity} from './entity'
import {Node} from './node'
export class Edge extends Entity {
  source: Node
  target: Node
  constructor(s: Node, t: Node) {
    super('(' + s.toString() + '->' + t.toString() + ')')
    this.source = s
    this.target = t
    if (s != t) {
      s.outEdges.add(this)
      t.inEdges.add(this)
    } else {
      s.selfEdges.add(this)
    }
  }
}
