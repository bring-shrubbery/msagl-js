import {from} from 'linq-to-typescript'
import {Cluster} from './cluster'
import {Assert} from './../utils/assert'

export class Entity {
  parent: Entity = null
  clusterParent: Cluster = null

  private attrs: any[]
  userData: any = undefined
  toString() {
    return this.userData == undefined ? '' : this.userData.toString()
  }
  constructor(userData: any = undefined) {
    this.userData = userData
    // extend the array on demand
    this.attrs = []
  }
  setAtrr(position: number, val: any) {
    if (this.attrs.length < position) {
      do {
        this.attrs.push(null)
      } while (this.attrs.length < position)
      this.attrs.push(val)
    } else if (this.attrs.length == position) this.attrs.push(val)
    else this.attrs[position] = val
  }
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
