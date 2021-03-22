import { IEnumerable } from 'linq-to-typescript'
import { Stack } from 'stack-typescript'
import { Point } from '../../../math/geometry/point'
import { Rectangle } from '../../../math/geometry/rectangle'
import { Assert } from '../../../utils/assert'
import { HitTestBehavior } from './HitTestBehavior'


function DivideNodes<TData>(nodes: RectangleNode<TData>[],
  seed0: number,
  seed1: number,
  gr0: RectangleNode<TData>[],
  gr1: RectangleNode<TData>[],
  t: { box0: Rectangle, box1: Rectangle }) {
  const groupSplitThreshold = 2
  for (let i = 0; i < nodes.length; i++) {
    if (i == seed0 || i == seed1)
      continue;

    // ReSharper disable InconsistentNaming
    const box0_ = Rectangle.rectangleOnRectangles([t.box0, nodes[i].Rectangle]);
    const delta0 = box0_.area - t.box0.area;

    const box1_ = Rectangle.rectangleOnRectangles([t.box1, nodes[i].Rectangle]);
    const delta1 = box1_.area - t.box1.area;
    // ReSharper restore InconsistentNaming

    //keep the tree roughly balanced

    if (gr0.length * groupSplitThreshold < gr1.length) {
      gr0.push(nodes[i]);
      t.box0 = box0_;
    } else if (gr1.length * groupSplitThreshold < gr0.length) {
      gr1.push(nodes[i]);
      t.box1 = box1_;
    } else if (delta0 < delta1) {
      gr0.push(nodes[i]);
      t.box0 = box0_;
    } else if (delta1 < delta0) {
      gr1.push(nodes[i]);
      t.box1 = box1_;
    } else if (t.box0.area < t.box1.area) {
      gr0.push(nodes[i]);
      t.box0 = box0_;
    } else {
      gr1.push(nodes[i]);
      t.box1 = box1_;
    }
  }
}

function CreateRectangleNodeOnListOfNodes<TData>(nodes: RectangleNode<TData>[]): RectangleNode<TData> {
  if (nodes.length == 0) return null;

  if (nodes.length == 1) return nodes[0];

  //Finding the seeds
  const t = { b0: nodes[0].Rectangle, seed0: 1 }
  const seed1 = ChooseSeeds(nodes, t);

  //We have two seeds at hand. Build two groups.
  const gr0 = []
  const gr1 = [];

  gr0.push(nodes[t.seed0]);
  gr1.push(nodes[seed1]);

  //divide nodes on two groups
  const p = { box0: nodes[t.seed0].Rectangle, box1: nodes[seed1].Rectangle }
  DivideNodes(nodes, t.seed0, seed1, gr0, gr1, p);
  const ret = mkRectangleNodeWithCount<TData>(nodes.length);
  ret.Rectangle = Rectangle.rectangleOnRectangles([p.box0, p.box1])
  ret.Left = CreateRectangleNodeOnListOfNodes(gr0)
  ret.Right = CreateRectangleNodeOnListOfNodes(gr1)
  return ret;
}

function ChooseSeeds<TData>(nodes: RectangleNode<TData>[], t: { b0: Rectangle, seed0: number }): number {
  let area = Rectangle.rectangleOnRectangles([t.b0, nodes[t.seed0].Rectangle]).area;
  for (let i = 2; i < nodes.length; i++) {
    let area0 = Rectangle.rectangleOnRectangles([t.b0, nodes[i].Rectangle]).area;
    if (area0 > area) {
      t.seed0 = i;
      area = area0;
    }
  }

  //Got the first seed seed0
  //Now looking for a seed for the second group
  let seed1: number

  //init seed1
  for (let i = 0; i < nodes.length; i++) {
    if (i != t.seed0) {
      seed1 = i;
      break;
    }
  }

  area = Rectangle.rectangleOnRectangles([nodes[t.seed0].Rectangle, nodes[seed1].Rectangle]).area;
  //Now try to improve the second seed

  for (let i = 0; i < nodes.length; i++) {
    if (i == t.seed0)
      continue;
    const area1 = Rectangle.rectangleOnRectangles([nodes[t.seed0].Rectangle, nodes[i].Rectangle]).area;
    if (area1 > area) {
      seed1 = i;
      area = area1;
    }
  }
  return seed1;
}


// calculates a tree based on the given nodes
export function CreateRectangleNodeOnEnumeration<TData>(nodes: IEnumerable<RectangleNode<TData>>): RectangleNode<TData> {
  if (nodes == null)
    return null;
  return CreateRectangleNodeOnListOfNodes(nodes.toArray());
}

//calculates a tree based on the given nodes
export function CreateRectangleNodeOnData<TData>(dataEnumeration: IEnumerable<TData>, rectangleDelegate: (t: TData) => Rectangle): RectangleNode<TData> {
  if (dataEnumeration == null || rectangleDelegate == null)
    return null;
  var nodeList = dataEnumeration.select(d => mkRectangleNode(d, rectangleDelegate(d))).toArray();
  return CreateRectangleNodeOnListOfNodes(nodeList);
}


function mkRectangleNodeWithCount<TData>(count: number): RectangleNode<TData> {
  const r = new RectangleNode<TData>()
  r.Count = count;
  return r
}

function mkRectangleNode<TData>(data: TData, rect: Rectangle): RectangleNode<TData> {
  const r = new RectangleNode<TData>()
  r.UserData = data;
  r.Rectangle = rect;
  r.Count = 1;
  return r
}

// it should be a static function of a class but declaring it such creates an error
function VisitTreeStatic<TData>(rectangleNode: RectangleNode<TData>, hitTest: (data: TData) => HitTestBehavior, hitRectangle: Rectangle): HitTestBehavior {
  if (rectangleNode.Rectangle.intersects(hitRectangle)) {
    if (hitTest(rectangleNode.UserData) == HitTestBehavior.Continue) {
      if (rectangleNode.Left != null) {
        // If rectangleNode.Left is not null, rectangleNode.Right won't be either.
        if (VisitTreeStatic(rectangleNode.Left, hitTest, hitRectangle) == HitTestBehavior.Continue &&
          VisitTreeStatic(rectangleNode.Right, hitTest, hitRectangle) == HitTestBehavior.Continue) {
          return HitTestBehavior.Continue;
        }
        return HitTestBehavior.Stop;
      }
      return HitTestBehavior.Continue;
    }
    return HitTestBehavior.Stop;
  }
  return HitTestBehavior.Continue;
}

// Represents a node containing a box and some user data.
// Is used of curve intersections routines.
export class RectangleNode<TData> {
  UserData: TData
  Count: number
  left: RectangleNode<TData>
  right: RectangleNode<TData>
  Rectangle: Rectangle;


  toString() {
    return this.IsLeaf ? this.Count.toString() + " " + this.UserData : this.Count.toString();
  }

  Parent: RectangleNode<TData>



  // false if it is an  node and true if it is a leaf
  get IsLeaf(): boolean {
    return this.left == null /*&& right==null*/;
  } //if left is a null then right is also a null

  // 
  get Left() { return this.left; }
  set Left(value) {
    if (this.left != null && this.left.Parent == this)
      this.left.Parent = null;
    this.left = value;
    if (this.left != null)
      this.left.Parent = this;
  }

  get Right() { return this.right; }
  set Right(value) {
    if (this.right != null && this.right.Parent == this)
      this.right.Parent = null;
    this.right = value;
    if (this.right != null)
      this.right.Parent = this;
  }


  get IsLeftChild(): boolean {
    Assert.assert(this.Parent != null);
    return this == this.Parent.Left
  }


  // brings the first leaf which rectangle was hit and the delegate is happy with the object
  FirstHitNodePF(point: Point, hitTestForPointDelegate: (point: Point, data: TData) => HitTestBehavior) {
    if (this.Rectangle.contains(point)) {
      if (this.IsLeaf) {
        if (hitTestForPointDelegate != null) {
          return hitTestForPointDelegate(point, this.UserData) == HitTestBehavior.Stop ? this : null;
        }
        return this;
      }
      return this.Left.FirstHitNodePF(point, hitTestForPointDelegate) ??
        this.Right.FirstHitNodePF(point, hitTestForPointDelegate);
    }
    return null;
  }


  // brings the first leaf which rectangle was intersected
  FirstIntersectedNode(r: Rectangle): RectangleNode<TData> {
    if (r.intersects(this.Rectangle)) {
      if (this.IsLeaf)
        return this;
      return this.Left.FirstIntersectedNode(r) ?? this.Right.FirstIntersectedNode(r);
    }
    return null;
  }



  // brings the first leaf which rectangle was hit and the delegate is happy with the object
  FirstHitNode(point: Point): RectangleNode<TData> {
    if (this.Rectangle.contains(point)) {
      if (this.IsLeaf)
        return this;
      return this.Left.FirstHitNode(point) ?? this.Right.FirstHitNode(point);
    }
    return null;
  }


  // returns all leaf nodes for which the rectangle was hit and the delegate is happy with the object
  * AllHitItems(rectanglePar: Rectangle, hitTestAccept: (data: TData) => boolean): IterableIterator<TData> {
    var stack = new Stack<RectangleNode<TData>>();
    stack.push(this);
    while (stack.size > 0) {
      const node = stack.pop();
      if (node.Rectangle.intersects(rectanglePar)) {
        if (node.IsLeaf) {
          if ((null == hitTestAccept) || hitTestAccept(node.UserData)) {
            yield node.UserData;
          }
        }
        else {
          stack.push(node.left);
          stack.push(node.right);
        }
      }
    }
  }

  // returns all items for which the rectangle contains the point
  *AllHitItems_(point: Point): IterableIterator<TData> {
    var stack = new Stack<RectangleNode<TData>>();
    stack.push(this);
    while (stack.size > 0) {
      const node = stack.pop();
      if (node.Rectangle.contains(point)) {
        if (node.IsLeaf)
          yield node.UserData;
        else {
          stack.push(node.left);
          stack.push(node.right);
        }
      }
    }
  }


  // Returns all leaves whose rectangles intersect hitRectangle (or all leaves before hitTest returns false).
  VisitTree(hitTest: (data: TData) => HitTestBehavior, hitRectangle: Rectangle) {
    VisitTreeStatic(this, hitTest, hitRectangle);
  }


  // 
  Clone(): RectangleNode<TData> {
    var ret = mkRectangleNodeWithCount<TData>(this.Count)
    ret.UserData = this.UserData
    ret.Rectangle = this.Rectangle
    if (this.Left != null)
      ret.Left = this.Left.Clone();
    if (this.Right != null)
      ret.Right = this.Right.Clone();
    return ret;
  }

  // yields all leaves which rectangles intersect the given one. We suppose that leaves are all nodes having UserData not a null.
  *GetNodeItemsIntersectingRectangle(rectanglePar: Rectangle) {
    for (const n of this.GetLeafRectangleNodesIntersectingRectangle(rectanglePar))
      yield n.UserData
  }

  // yields all leaves whose rectangles intersect the given one. We suppose that leaves are all nodes having UserData not a null.
  * GetLeafRectangleNodesIntersectingRectangle(rectanglePar: Rectangle): IterableIterator<RectangleNode<TData>> {
    var stack = new Stack<RectangleNode<TData>>();
    stack.push(this);
    while (stack.size > 0) {
      const node = stack.pop();
      if (node.Rectangle.intersects(rectanglePar)) {
        if (node.IsLeaf) {
          yield node;
        } else {
          stack.push(node.left);
          stack.push(node.right);
        }
      }
    }
  }

  // Walk the tree and return the data from all leaves
  *GetAllLeaves(): IterableIterator<TData> {
    for (const n of this.GetAllLeafNodes())
      yield n.UserData
  }

  *GetAllLeafNodes(): IterableIterator<RectangleNode<TData>> {
    return this.EnumRectangleNodes(true /*leafOnly*/);
  }

  *EnumRectangleNodes(leafOnly: boolean): IterableIterator<RectangleNode<TData>> {
    var stack = new Stack<RectangleNode<TData>>();
    stack.push(this);
    while (stack.size > 0) {
      var node = stack.pop();
      if (node.IsLeaf || !leafOnly) {
        yield node;
      }
      if (!node.IsLeaf) {
        stack.push(node.left);
        stack.push(node.right);
      }
    }
  }





  // 



  // Walk the tree from node down and apply visitor to all nodes
  TraverseHierarchy(node: RectangleNode<TData>, visitor: (n: RectangleNode<TData>) => void) {
    visitor(node);
    if (node.Left != null)
      this.TraverseHierarchy(node.Left, visitor);
    if (node.Right != null)
      this.TraverseHierarchy(node.Right, visitor);
  }
}

