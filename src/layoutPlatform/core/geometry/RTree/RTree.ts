import {from, IEnumerable} from 'linq-to-typescript'
import {Assert} from '../../../utils/assert'
import {IRectangle} from '../IRectangle'
import {
  RectangleNode,
  mkRectangleNode,
  CreateRectangleNodeOnEnumeration,
  CreateRectangleNodeOnListOfNodes,
} from './RectangleNode'

//  A search tree for rapid lookup of T objects keyed by rectangles inside a given rectangular region
//  It is very similar to "R-TREES. A DYNAMIC INDEX STRUCTURE FOR SPATIAL SEARCHING" by Antonin Guttman

//  Create the query tree for a given enumerable of T keyed by Rectangles
export function mkRTree<T, P>(
  rectsAndData: IEnumerable<[IRectangle<P>, T]>,
): RTree<T, P> {
  return new RTree<T, P>(
    CreateRectangleNodeOnEnumeration(
      rectsAndData.select(([k, v]) => mkRectangleNode<T, P>(v, k)),
    ),
  )
}

function TransferFromSibling<T, P>(
  parent: RectangleNode<T, P>,
  sibling: RectangleNode<T, P>,
) {
  parent.UserData = sibling.UserData
  parent.Left = sibling.Left
  parent.Right = sibling.Right
  parent.Count--
  parent.irect = sibling.irect
}

function UpdateParent<T, P>(parent: RectangleNode<T, P>) {
  for (let node = parent.Parent; node != null; node = node.Parent) {
    node.Count--
    node.irect = node.Left.irect.add_rect(node.Right.irect)
  }
}

function RebuildUnderNodeWithoutLeaf<T, P>(
  nodeForRebuild: RectangleNode<T, P>,
  leaf: RectangleNode<T, P>,
) {
  Assert.assert(leaf.IsLeaf)
  Assert.assert(!nodeForRebuild.IsLeaf)
  const newNode = CreateRectangleNodeOnEnumeration<T, P>(
    nodeForRebuild.GetAllLeafNodes().where((n) => n != leaf),
  )
  nodeForRebuild.Count = newNode.Count
  nodeForRebuild.Left = newNode.Left
  nodeForRebuild.Right = newNode.Right
  nodeForRebuild.irect = newNode.Left.irect.add_rect(newNode.Right.irect)
}

function FindTopUnbalancedNode<T, P>(
  node: RectangleNode<T, P>,
): RectangleNode<T, P> {
  for (let parent = node.Parent; parent != null; parent = parent.Parent)
    if (!Balanced(parent)) return parent
  return null
}

function Balanced<T, P>(rectangleNode: RectangleNode<T, P>): boolean {
  return (
    2 * rectangleNode.Left.Count >= rectangleNode.Right.Count &&
    2 * rectangleNode.Right.Count >= rectangleNode.Left.Count
  )
}

function NumberOfIntersectedIsLessThanBoundOnNode<T, P>(
  node: RectangleNode<T, P>,
  rect: IRectangle<P>,
  t: {bound: number},
  conditionFunc: (t: T) => boolean,
) {
  Assert.assert(t.bound > 0)
  if (!node.irect.intersects_rect(rect)) return true
  if (node.IsLeaf) {
    if (conditionFunc(node.UserData)) return --t.bound != 0
    return true
  }

  return (
    NumberOfIntersectedIsLessThanBoundOnNode(
      node.Left,
      rect,
      t,
      conditionFunc,
    ) &&
    NumberOfIntersectedIsLessThanBoundOnNode(node.Right, rect, t, conditionFunc)
  )
}

export class RTree<T, P> {
  _rootNode: RectangleNode<T, P>
  // <summary>
  // Removes everything from the tree
  // </summary>
  Clear() {
    this.RootNode = null
  }

  NumberOfIntersectedIsLessThanBound(
    rect: IRectangle<P>,
    bound: number,
    conditionFunc: (t: T) => boolean,
  ) {
    return NumberOfIntersectedIsLessThanBoundOnNode(
      this._rootNode,
      rect,
      {bound: bound},
      conditionFunc,
    )
  }

  get RootNode(): RectangleNode<T, P> {
    return this._rootNode
  }

  set RootNode(value: RectangleNode<T, P>) {
    this._rootNode = value
  }

  //  Create a query tree for a given root node
  constructor(rootNode: RectangleNode<T, P>) {
    this._rootNode = rootNode
  }

  GetAllLeaves(): IEnumerable<T> {
    return this._rootNode != null && this.Count > 0
      ? this._rootNode.GetAllLeaves()
      : from([])
  }

  //  The number of data elements of the tree (number of leaf nodes)
  get Count(): number {
    return this._rootNode == null ? 0 : this._rootNode.Count
  }

  Add(key: IRectangle<P>, value: T) {
    this.AddNode(mkRectangleNode<T, P>(value, key))
  }

  AddNode(node: RectangleNode<T, P>) {
    if (this._rootNode == null) this._rootNode = node
    else if (this.Count <= 2)
      this._rootNode = CreateRectangleNodeOnListOfNodes<T, P>(
        Array.from(this._rootNode.GetAllLeafNodes()).concat([node]),
      )
    else this.AddNodeToTreeRecursive(node, this._rootNode)
  }

  Rebuild() {
    this._rootNode = CreateRectangleNodeOnEnumeration(
      this._rootNode.GetAllLeafNodes(),
    )
  }

  private AddNodeToTreeRecursive(
    newNode: RectangleNode<T, P>,
    existingNode: RectangleNode<T, P>,
  ) {
    if (existingNode.IsLeaf) {
      existingNode.Left = mkRectangleNode<T, P>(
        existingNode.UserData,
        existingNode.irect,
      )
      existingNode.Right = newNode
      existingNode.Count = 2
    } else {
      existingNode.Count++
      let leftBox: IRectangle<P>
      let rightBox: IRectangle<P>
      if (2 * existingNode.Left.Count < existingNode.Right.Count) {
        // keep the balance
        this.AddNodeToTreeRecursive(newNode, existingNode.Left)
        existingNode.Left.irect = existingNode.Left.irect.add_rect(
          newNode.irect,
        )
      } else if (2 * existingNode.Right.Count < existingNode.Left.Count) {
        // keep the balance
        this.AddNodeToTreeRecursive(newNode, existingNode.Right)
        existingNode.Right.irect = existingNode.Right.irect.add_rect(
          newNode.irect,
        )
      } else {
        // decide basing on the boxes
        leftBox = existingNode.Left.irect.add_rect(newNode.irect)
        const delLeft = leftBox.area - existingNode.Left.irect.area
        rightBox = existingNode.Right.irect.add_rect(newNode.irect)
        const delRight = rightBox.area - existingNode.Right.irect.area
        if (delLeft < delRight) {
          this.AddNodeToTreeRecursive(newNode, existingNode.Left)
          existingNode.Left.irect = leftBox
        } else if (delLeft > delRight) {
          this.AddNodeToTreeRecursive(newNode, existingNode.Right)
          existingNode.Right.irect = rightBox
        } else {
          // the deltas are the same; add to the smallest
          if (leftBox.area < rightBox.area) {
            this.AddNodeToTreeRecursive(newNode, existingNode.Left)
            existingNode.Left.irect = leftBox
          } else {
            this.AddNodeToTreeRecursive(newNode, existingNode.Right)
            existingNode.Right.irect = rightBox
          }
        }
      }
    }

    existingNode.irect = existingNode.Left.irect.add_rect(
      existingNode.Right.irect,
    )
  }
  public GetAllIntersecting(queryRegion: IRectangle<P>): T[] {
    return this._rootNode == null || this.Count == 0
      ? []
      : Array.from(
          this._rootNode.GetNodeItemsIntersectingRectangle(queryRegion),
        )
  }

  public OneIntersecting(queryRegion: IRectangle<P>): {intersectedLeaf: T} {
    if (this._rootNode == null || this.Count == 0) {
      return
    }

    const ret: RectangleNode<T, P> = this._rootNode.FirstIntersectedNode(
      queryRegion,
    )
    if (ret == null) {
      return
    }
    return {intersectedLeaf: ret.UserData}
  }

  //  Get all leaf nodes with rectangles intersecting the specified rectangular region
  GetAllLeavesIntersectingRectangle(
    queryRegion: IRectangle<P>,
  ): IEnumerable<RectangleNode<T, P>> {
    return this._rootNode == null || this.Count == 0
      ? from([])
      : from(
          this._rootNode.GetLeafRectangleNodesIntersectingRectangle(
            queryRegion,
          ),
        )
  }

  //  Does minimal work to determine if any objects of the tree intersect with the query region
  public IsIntersecting(queryRegion: IRectangle<P>): boolean {
    if (this._rootNode == null || this.Count == 0) return false
    return from(
      this._rootNode.GetNodeItemsIntersectingRectangle(queryRegion),
    ).any()
  }

  //  return true iff there is a node with the rectangle and UserData that equals to the parameter "userData"
  public Contains(rectangle: IRectangle<P>, userData: T): boolean {
    if (this._rootNode == null) {
      return false
    }

    return from(
      this._rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle),
    ).any((node) => node.UserData == userData)
  }

  public Remove(rectangle: IRectangle<P>, userData: T): T {
    if (this._rootNode == null) {
      return
    }

    const ret = from(
      this._rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle),
    ).firstOrDefault((node) => node.UserData == userData)
    if (ret == null) {
      return
    }

    if (this.RootNode.Count == 1) {
      this.RootNode = null
    } else {
      this.RemoveLeaf(ret)
    }

    return ret.UserData
  }

  RemoveLeaf(leaf: RectangleNode<T, P>) {
    Assert.assert(leaf.IsLeaf)
    const unbalancedNode = FindTopUnbalancedNode(leaf)
    if (unbalancedNode != null) {
      RebuildUnderNodeWithoutLeaf(unbalancedNode, leaf)
      UpdateParent(unbalancedNode)
    } else {
      //replace the parent with the sibling and update bounding boxes and counts
      const parent = leaf.Parent
      if (parent == null) {
        Assert.assert(this._rootNode == leaf)
        this._rootNode = new RectangleNode<T, P>()
      } else {
        TransferFromSibling(
          parent,
          leaf.IsLeftChild ? parent.Right : parent.Left,
        )
        UpdateParent(parent)
      }
    }
    //   Assert.assert(TreeIsCorrect(RootNode));
  }

  UnbalancedNode(node: RectangleNode<T, P>): RectangleNode<T, P> {
    for (let parent = node.Parent; parent != null; parent = parent.Parent) {
      if (!Balanced(parent)) {
        return parent
      }
    }
    return null
  }
}
