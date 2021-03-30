import { from, IEnumerable } from 'linq-to-typescript';
import { Rectangle } from '../../../math/geometry/rectangle';
import { Assert } from '../../../utils/assert';
import { RectangleNode, mkRectangleNode, CreateRectangleNodeOnEnumeration, CreateRectangleNodeOnListOfNodes } from './RectangleNode'

//  A search tree for rapid lookup of TData objects keyed by rectangles inside a given rectangular region
//  It is very similar to "R-TREES. A DYNAMIC INDEX STRUCTURE FOR SPATIAL SEARCHING" by Antonin Guttman


//  Create the query tree for a given enumerable of TData keyed by Rectangles
export function mkRTree<TData>(rectsAndData: IEnumerable<[Rectangle, TData]>): RTree<TData> {
  return new RTree<TData>(CreateRectangleNodeOnEnumeration(
    rectsAndData.select(([k, v]) => mkRectangleNode<TData>(v, k))))
}

function TransferFromSibling<TData>(parent: RectangleNode<TData>, sibling: RectangleNode<TData>) {
  parent.UserData = sibling.UserData;
  parent.Left = sibling.Left;
  parent.Right = sibling.Right;
  parent.Count--;
  parent.Rectangle = sibling.Rectangle;
}

function UpdateParent<TData>(parent: RectangleNode<TData>) {
  for (let node = parent.Parent; node != null; node = node.Parent) {
    node.Count--;
    node.Rectangle = Rectangle.rectangleOnRectangles([node.Left.Rectangle, node.Right.Rectangle])
  }
}

function RebuildUnderNodeWithoutLeaf<TData>(nodeForRebuild: RectangleNode<TData>, leaf: RectangleNode<TData>) {
  Assert.assert(leaf.IsLeaf);
  Assert.assert(!nodeForRebuild.IsLeaf);
  const newNode = CreateRectangleNodeOnEnumeration<TData>(
    nodeForRebuild.GetAllLeafNodes().where(n => n != leaf))
  nodeForRebuild.Count = newNode.Count;
  nodeForRebuild.Left = newNode.Left;
  nodeForRebuild.Right = newNode.Right;
  nodeForRebuild.Rectangle = Rectangle.rectangleOnRectangles([newNode.Left.Rectangle, newNode.Right.Rectangle]);
}

function FindTopUnbalancedNode<TData>(node: RectangleNode<TData>): RectangleNode<TData> {
  for (let parent = node.Parent; parent != null; parent = parent.Parent)
    if (!Balanced(parent))
      return parent;
  return null;
}

function Balanced<TData>(rectangleNode: RectangleNode<TData>): boolean {
  return 2 * rectangleNode.Left.Count >= rectangleNode.Right.Count &&
    2 * rectangleNode.Right.Count >= rectangleNode.Left.Count;
}


function NumberOfIntersectedIsLessThanBoundOnNode<TData>(node: RectangleNode<TData>, rect: Rectangle,
  t: { bound: number }, conditionFunc: (t: TData) => boolean) {
  Assert.assert(t.bound > 0);
  if (!node.Rectangle.intersects(rect)) return true;
  if (node.IsLeaf) {
    if (conditionFunc(node.UserData))
      return (--t.bound) != 0;
    return true;
  }

  return NumberOfIntersectedIsLessThanBoundOnNode(node.Left, rect, t, conditionFunc) &&
    NumberOfIntersectedIsLessThanBoundOnNode(node.Right, rect, t, conditionFunc);

}

export class RTree<TData> {
  _rootNode: RectangleNode<TData>;
  // <summary>
  // Removes everything from the tree
  // </summary>
  Clear() {
    this.RootNode = null;
  }

  NumberOfIntersectedIsLessThanBound(rect: Rectangle, bound: number, conditionFunc: (t: TData) => boolean) {
    return NumberOfIntersectedIsLessThanBoundOnNode(this._rootNode, rect, { bound: bound }, conditionFunc);
  }

  get RootNode(): RectangleNode<TData> {
    return this._rootNode;
  }

  set RootNode(value: RectangleNode<TData>) {
    this._rootNode = value;
  }

  //  Create a query tree for a given root node
  constructor(rootNode: RectangleNode<TData>) {
    this._rootNode = rootNode;
  }

  GetAllLeaves(): IEnumerable<TData> {
    return this._rootNode != null && this.Count > 0 ? this._rootNode.GetAllLeaves() : from([])
  }


  //  The number of data elements of the tree (number of leaf nodes)
  get Count(): number {
    return this._rootNode == null ? 0 : this._rootNode.Count;
  }

  Add(key: Rectangle, value: TData) {
    this.AddNode(mkRectangleNode<TData>(value, key));
  }

  AddNode(node: RectangleNode<TData>) {
    if (this._rootNode == null)
      this._rootNode = node;
    else if (this.Count <= 2)
      this._rootNode = CreateRectangleNodeOnListOfNodes<TData>(Array.from(this._rootNode.GetAllLeafNodes()).concat([node]));
    else
      this.AddNodeToTreeRecursive(node, this._rootNode);
  }

  Rebuild() {
    this._rootNode = CreateRectangleNodeOnEnumeration(this._rootNode.GetAllLeafNodes());
  }

  private AddNodeToTreeRecursive(newNode: RectangleNode<TData>, existingNode: RectangleNode<TData>) {
    if (existingNode.IsLeaf) {
      existingNode.Left = mkRectangleNode<TData>(existingNode.UserData, existingNode.Rectangle);
      existingNode.Right = newNode;
      existingNode.Count = 2;
    }
    else {
      existingNode.Count++;
      let leftBox: Rectangle;
      let rightBox: Rectangle;
      if (2 * existingNode.Left.Count
        < existingNode.Right.Count) {
        // keep the balance
        this.AddNodeToTreeRecursive(newNode, existingNode.Left);
        existingNode.Left.Rectangle = Rectangle.rectangleOnRectangles([existingNode.Left.Rectangle, newNode.Rectangle]);
      }
      else if (2 * existingNode.Right.Count < existingNode.Left.Count) {
        // keep the balance
        this.AddNodeToTreeRecursive(newNode, existingNode.Right);
        existingNode.Right.Rectangle = Rectangle.rectangleOnRectangles([existingNode.Right.Rectangle, newNode.Rectangle]);
      }
      else {
        // decide basing on the boxes
        leftBox = Rectangle.rectangleOnRectangles([existingNode.Left.Rectangle, newNode.Rectangle]);
        const delLeft = (leftBox.area - existingNode.Left.Rectangle.area);
        rightBox = Rectangle.rectangleOnRectangles([existingNode.Right.Rectangle, newNode.Rectangle]);
        const delRight = (rightBox.area - existingNode.Right.Rectangle.area);
        if ((delLeft < delRight)) {
          this.AddNodeToTreeRecursive(newNode, existingNode.Left);
          existingNode.Left.Rectangle = leftBox;
        }
        else if ((delLeft > delRight)) {
          this.AddNodeToTreeRecursive(newNode, existingNode.Right);
          existingNode.Right.Rectangle = rightBox;
        }
        else {
          // the deltas are the same; add to the smallest
          if ((leftBox.area < rightBox.area)) {
            this.AddNodeToTreeRecursive(newNode, existingNode.Left);
            existingNode.Left.Rectangle = leftBox;
          }
          else {
            this.AddNodeToTreeRecursive(newNode, existingNode.Right);
            existingNode.Right.Rectangle = rightBox;
          }

        }

      }

    }

    existingNode.Rectangle = Rectangle.rectangleOnRectangles([existingNode.Left.Rectangle, existingNode.Right.Rectangle]);
  }
  public GetAllIntersecting(queryRegion: Rectangle): TData[] {
    return this._rootNode == null || this.Count == 0 ? [] : from(this._rootNode.GetNodeItemsIntersectingRectangle(queryRegion)).toArray();
  }

  public OneIntersecting(queryRegion: Rectangle): { intersectedLeaf: TData } {
    if (this._rootNode == null || this.Count == 0) {
      return
    }

    const ret: RectangleNode<TData> = this._rootNode.FirstIntersectedNode(queryRegion);
    if (ret == null) {
      return
    }
    return { intersectedLeaf: ret.UserData }
  }

  //  Get all leaf nodes with rectangles intersecting the specified rectangular region
  GetAllLeavesIntersectingRectangle(queryRegion: Rectangle): IEnumerable<RectangleNode<TData>> {
    return this._rootNode == null || this.Count == 0 ? from([]) : from(this._rootNode.GetLeafRectangleNodesIntersectingRectangle(queryRegion));

  }

  //  Does minimal work to determine if any objects of the tree intersect with the query region
  public IsIntersecting(queryRegion: Rectangle): boolean {
    if (this._rootNode == null || this.Count == 0)
      return false;
    return from(this._rootNode.GetNodeItemsIntersectingRectangle(queryRegion)).any()
  }

  //  return true iff there is a node with the rectangle and UserData that equals to the parameter "userData"
  public Contains(rectangle: Rectangle, userData: TData): boolean {
    if ((this._rootNode == null)) {
      return false;
    }

    return from(this._rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle)).any(node => node.UserData == userData);
  }

  public Remove(rectangle: Rectangle, userData: TData): TData {
    if (this._rootNode == null) { return; }

    const ret = from(this._rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle)).firstOrDefault(node => node.UserData == userData);
    if (ret == null) {
      return;
    }

    if (this.RootNode.Count == 1) {
      this.RootNode = null;
    }
    else {
      this.RemoveLeaf(ret);
    }

    return ret.UserData;
  }

  RemoveLeaf(leaf: RectangleNode<TData>) {
    Assert.assert(leaf.IsLeaf);
    const unbalancedNode = FindTopUnbalancedNode(leaf);
    if (unbalancedNode != null) {
      RebuildUnderNodeWithoutLeaf(unbalancedNode, leaf);
      UpdateParent(unbalancedNode);
    } else {
      //replace the parent with the sibling and update bounding boxes and counts
      const parent = leaf.Parent;
      if (parent == null) {
        Assert.assert(this._rootNode == leaf);
        this._rootNode = new RectangleNode<TData>();
      } else {
        TransferFromSibling(parent, leaf.IsLeftChild ? parent.Right : parent.Left);
        UpdateParent(parent);
      }
    }
    //   Assert.assert(TreeIsCorrect(RootNode));
  }

  UnbalancedNode(node: RectangleNode<TData>): RectangleNode<TData> {
    for (let parent = node.Parent; (parent != null); parent = parent.Parent) {
      if (!Balanced(parent)) {
        return parent;
      }

    }
    return null;
  }
}
