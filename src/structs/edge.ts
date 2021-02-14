import {Entity} from './entity'
import {Node} from './node'
export class Edge extends Entity {
  source: Node
  target: Node
  constructor(s: Node, t: Node) {
    super()
    this.source = s
    this.target = t
    if (s != t) {
      s.outEdges.add(this)
      t.inEdges.add(this)
    } else {
      s.selfEdges.add(this)
    }
  }
  toString(): string {
    return '(' + this.source.toString() + '->' + this.target.toString() + ')'
  }
}
