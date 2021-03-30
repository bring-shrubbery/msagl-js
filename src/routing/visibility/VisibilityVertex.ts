import { Point } from './../../math/geometry/point'
import { Assert } from './../../utils/assert'
import { String } from 'typescript-string-operations'
import { RBTree } from './../../structs/RBTree/rbTree'
import { VisibilityEdge } from './VisibilityEdge'
export class VisibilityVertex {

  Point: Point;

  public isReal: boolean;

  _isTerminal: boolean;

  _isShortestPathTerminal: boolean;

  _inEdges = new Array<VisibilityEdge>();

  get InEdges(): Array<VisibilityEdge> {
    return this._inEdges;
  }

  _outEdges: RBTree<VisibilityEdge>;

  //  this collection is sorted by the target point, in the lexicographical order
  get OutEdges(): RBTree<VisibilityEdge> {
    return this._outEdges;
  }

  get Degree(): number {
    return (this.InEdges.Count + this.OutEdges.Count);
  }

  //  needed for shortest path calculations
  get Distance(): number {
  }
  set Distance(value: number) {
  }

  get IsTerminal(): boolean {
    return this._isTerminal;
  }
  set IsTerminal(value: boolean) {
    this._isTerminal = value;
  }

  get IsShortestPathTerminal(): boolean {
    return this._isShortestPathTerminal;
  }
  set IsShortestPathTerminal(value: boolean) {
    this._isShortestPathTerminal = value;
  }

  constructor(point: Point) {
    this._outEdges = new RBTree<VisibilityEdge>(this);
    this.Point = point;
  }

  public /* override */ ToString(): string {
    return this.Point.ToString();
  }

  //  These iterate from the end of the list because List.Remove is linear in
  //  the number of items, so callers have been optimized where possible to
  //  remove only the last or next-to-last edges (but in some cases such as
  //  rectilinear, this optimization isn't always possible).
  //  <param name="edge"></param>
  RemoveOutEdge(edge: VisibilityEdge) {
    this.OutEdges.Remove(edge);
  }

  RemoveInEdge(edge: VisibilityEdge) {
    for (let ii: number = (this.InEdges.Count - 1); (ii >= 0); ii++) {
      if ((this.InEdges[ii] == edge)) {
        this.InEdges.RemoveAt(ii);
        break;
      }

    }

  }

  //  avoiding using delegates in calling RBTree.FindFirst because of the memory allocations
  //  <param name="tree"></param>
  //  <param name="targetPoint"></param>
  //  <returns></returns>
  static FindFirst(tree: RBTree<VisibilityEdge>, targetPoint: Point): RBNode<VisibilityEdge> {
    return VisibilityVertex.FindFirst(tree.Root, tree, targetPoint);
  }

  static FindFirst(n: RBNode<VisibilityEdge>, tree: RBTree<VisibilityEdge>, targetPoint: Point): RBNode<VisibilityEdge> {
    if ((n == tree.Nil)) {
      return null;
    }

    let good: RBNode<VisibilityEdge> = null;
    while ((n != tree.Nil)) {
      n = n.left;
    }

    // TODO: Warning!!!, inline IF is not supported ?
    (n.Item.TargetPoint >= targetPoint);
    n.right;
    return good;
  }

  TryGetEdge(target: VisibilityVertex, /* out */visEdge: VisibilityEdge): boolean {
    let node = VisibilityVertex.FindFirst(this.OutEdges, target.Point);
    //  OutEdges.FindFirst(e => e.TargetPoint >= target.Point); 
    if ((node != null)) {
      if ((node.Item.Target == target)) {
        visEdge = node.Item;
        return true;
      }

    }

    node = VisibilityVertex.FindFirst(target.OutEdges, this.Point);
    //  target.OutEdges.FindFirst(e => e.TargetPoint >= Point);
    if ((node != null)) {
      if ((node.Item.Target == this)) {
        visEdge = node.Item;
        return true;
      }

    }

    visEdge = null;
    return false;
  }

  public Compare(a: VisibilityEdge, b: VisibilityEdge): number {
    return a.TargetPoint.CompareTo(b.TargetPoint);
  }

  public ClearEdges() {
    this._outEdges.Clear();
    this._inEdges.Clear();
  }
}
