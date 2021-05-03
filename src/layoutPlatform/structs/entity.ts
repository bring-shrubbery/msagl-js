import {from} from 'linq-to-typescript'
import {Graph} from './graph'
import {Assert} from './../utils/assert'
import {AttrContainer} from './attrContainer'
export abstract class Entity extends AttrContainer {
  parent: Entity = null
  graphParent: Graph = null

  abstract toString(): string

  setGraphParent(parent: Graph): void {
    Assert.assert(!Object.is(parent, this))
    this.graphParent = parent
  }

  *allGraphAncestors(): IterableIterator<Graph> {
    let parent = this.graphParent
    while (parent != null) {
      yield parent
      parent = parent.graphParent
    }
  }

  // Determines if this node is a descendant of the given graph.
  isDescendantOf(graph: Graph) {
    return from(this.allGraphAncestors()).any((p) => p == graph)
  }

  isUnderCollapsedGraph(): boolean {
    return this.graphParent != null && this.graphParent.isCollapsed
  }
}
