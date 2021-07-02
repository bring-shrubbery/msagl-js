import {from} from 'linq-to-typescript'
import {Graph} from './graph'
import {Assert} from './../utils/assert'
import {AttrContainer} from './attrContainer'
export abstract class Entity extends AttrContainer {
  parent: Entity = null

  abstract toString(): string

  setParent(parent: Graph): void {
    Assert.assert(!Object.is(parent, this))
    this.parent = parent
  }

  *getAncestors(): IterableIterator<Entity> {
    let p = this.parent
    while (p != null) {
      yield p
      p = p.parent
    }
  }

  // Determines if this node is a descendant of the given graph.
  isDescendantOf(graph: Graph) {
    return from(this.getAncestors()).any((p) => p == graph)
  }
}
