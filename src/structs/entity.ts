import {from} from 'linq-to-typescript'
import {Cluster} from './cluster'
import {Assert} from './../utils/assert'
import {AttrContainer} from './attrContainer'
export abstract class Entity extends AttrContainer {
  parent: Entity = null
  clusterParent: Cluster = null

  abstract toString(): string

  setClusterParent(parent: Cluster): void {
    Assert.assert(!Object.is(parent, this))
    this.clusterParent = parent
  }

  *allClusterAncestors(): IterableIterator<Cluster> {
    let parent = this.clusterParent
    while (parent != null) {
      yield parent
      parent = parent.clusterParent
    }
  }

  // Determines if this node is a descendant of the given cluster.
  isDescendantOf(cluster: Cluster) {
    return from(this.allClusterAncestors()).any((p) => p == cluster)
  }

  isUnderCollapsedCluster(): boolean {
    return this.clusterParent != null && this.clusterParent.isCollapsed
  }
}
