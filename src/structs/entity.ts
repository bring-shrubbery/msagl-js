import {Graph} from './graph'
import {AttrContainer} from './attrContainer'
export abstract class Entity extends AttrContainer {
  private _parent: Entity = null
  public get parent(): Entity {
    return this._parent
  }
  public set parent(value: Entity) {
    this._parent = value
  }

  abstract toString(): string

  *getAncestors(): IterableIterator<Entity> {
    let p = this.parent
    while (p != null) {
      yield p
      p = p.parent
    }
  }

  // Determines if this node is a descendant of the given graph.
  isDescendantOf(graph: Graph): boolean {
    for (const p of this.getAncestors()) {
      if (p == graph) return true
    }
    return false
  }
}
