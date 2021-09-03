import {RBNode} from '../../structs/RBTree/rbNode'
import {Point} from './../../math/geometry/point'
import {RBTree} from './../../structs/RBTree/rbTree'
import {VisibilityEdge} from './VisibilityEdge'
export class VisibilityVertex {
  point: Point

  public isReal: boolean

  _isTerminal: boolean

  _isShortestPathTerminal: boolean

  _inEdges = new Array<VisibilityEdge>()

  get InEdges(): Array<VisibilityEdge> {
    return this._inEdges
  }

  _outEdges: RBTree<VisibilityEdge>

  //  this collection is sorted by the target point, in the lexicographical order
  get OutEdges(): RBTree<VisibilityEdge> {
    return this._outEdges
  }

  get Degree(): number {
    return this.InEdges.length + this.OutEdges.count
  }

  //  needed for shortest path calculations
  Distance: number

  get IsTerminal(): boolean {
    return this._isTerminal
  }
  set IsTerminal(value: boolean) {
    this._isTerminal = value
  }

  get IsShortestPathTerminal(): boolean {
    return this._isShortestPathTerminal
  }
  set IsShortestPathTerminal(value: boolean) {
    this._isShortestPathTerminal = value
  }

  constructor(point: Point) {
    this._outEdges = new RBTree<VisibilityEdge>(this.Compare)
    this.point = point
  }

  public ToString(): string {
    return this.point.toString()
  }

  //  These iterate from the end of the list because Array.Remove is linear in
  //  the number of items, so callers have been optimized where possible to
  //  remove only the last or next-to-last edges (but in some cases such as
  //  rectilinear, this optimization isn't always possible).

  RemoveOutEdge(edge: VisibilityEdge) {
    this.OutEdges.remove(edge)
  }

  RemoveInEdge(edge: VisibilityEdge) {
    // eslint-disable-next-line for-direction
    for (let ii: number = this.InEdges.length - 1; ii >= 0; ii++) {
      if (this.InEdges[ii] == edge) {
        throw new Error('not implemented')

        //this.InEdges.removeAt(ii)
        break
      }
    }
  }

  //  avoiding using delegates in calling RBTree.FindFirst because of the memory allocations

  static FindFirst(
    tree: RBTree<VisibilityEdge>,
    targetPoint: Point,
  ): RBNode<VisibilityEdge> {
    return VisibilityVertex.FindFirst_t(tree.root, tree, targetPoint)
  }

  static FindFirst_t(
    n: RBNode<VisibilityEdge>,
    tree: RBTree<VisibilityEdge>,
    targetPoint: Point,
  ): RBNode<VisibilityEdge> {
    if (n == tree.nil) {
      return null
    }

    let ret = null
    while (n != tree.nil) {
      n = n.item.TargetPoint >= targetPoint ? (ret = n).left : n.right
    }
    return ret
  }

  /*
RBNode<VisibilityEdge> good = null;
            while (n != tree.Nil)
                n = n.Item.TargetPoint >= targetPoint ? (good = n).left : n.right;

            return good;
  */
  get(target: VisibilityVertex): VisibilityEdge {
    let node = VisibilityVertex.FindFirst(this.OutEdges, target.point)
    //  OutEdges.FindFirst(e => e.TargetPoint >= target.point);
    if (node != null) {
      if (node.item.Target == target) {
        return node.item
      }
    }

    node = VisibilityVertex.FindFirst(target.OutEdges, this.point)
    //  target.OutEdges.FindFirst(e => e.TargetPoint >= Point);
    if (node != null) {
      if (node.item.Target == this) {
        return node.item
      }
    }

    return null
  }

  public Compare(a: VisibilityEdge, b: VisibilityEdge): number {
    return a.TargetPoint.compareTo(b.TargetPoint)
  }

  public ClearEdges() {
    this._outEdges.clear()
    this._inEdges = []
  }
}
