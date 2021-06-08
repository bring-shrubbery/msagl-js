import {Entity} from './entity'
import {Graph} from './graph'
import {Label} from './label'
import {Node} from './node'
export class Edge extends Entity {
  source: Node
  target: Node
  constructor(s: Node, t: Node, parent: Graph) {
    super(parent)
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
  isInterGraphEdge(): boolean {
    return this.source.parent != this.target.parent
  }
  label: Label
}
