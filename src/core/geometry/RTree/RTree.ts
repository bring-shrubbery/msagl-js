
//  A search tree for rapid lookup of TData objects keyed by rectangles inside a given rectangular region
//  It is very similar to "R-TREES. A DYNAMIC INDEX STRUCTURE FOR SPATIAL SEARCHING" by Antonin Guttman
export class RTree<TData> {

    //  
    public get RootNode(): RectangleNode<TData> {
        return _rootNode;
    }
    public set RootNode(value: RectangleNode<TData>) {
        _rootNode = value;
    }

    _rootNode: RectangleNode<TData>;

    //  Create the query tree for a given enumerable of TData keyed by Rectangles
    public constructor(rectsAndData: IEnumerable<KeyValuePair<Rectangle, TData>>) {
        this._rootNode = RectangleNode.CreateRectangleNodeOnEnumeration(GetNodeRects(rectsAndData));
    }

    //  Create a query tree for a given root node
    public constructor(rootNode: RectangleNode<TData>) {
        this._rootNode = rootNode;
    }

    public constructor() {

    }

    //  The number of data elements of the tree (number of leaf nodes)
    public get Count(): number {
        return 0;
        // TODO: Warning!!!, inline IF is not supported ?
        (this._rootNode == null);
        this._rootNode.Count;
    }

    key: Rectangle;

    TData: Rectangle;

    key: Rectangle;
}
}
UnknownUnknownelseAddNodeToTreeRecursive(node, _rootNode);
Unknown//  rebuild the whole tree
publicRebuild();
{
    _rootNode = RectangleNode.CreateRectangleNodeOnEnumeration(_rootNode.GetAllLeafNodes());
    UnknownstaticAddNodeToTreeRecursive(RectangleNode, newNode, RectangleNode, existingNode);
    {
        if (existingNode.IsLeaf) {
            existingNode.Left = new RectangleNode<TData>(existingNode.UserData, existingNode.Rectangle);
            existingNode.Right = newNode;
            existingNode.Count = 2;
        }
        else {
            existingNode.Count++;
            let leftBox: Rectangle;
            let rightBox: Rectangle;
            if (((2 * existingNode.Left.Count)
                < existingNode.Right.Count)) {
                // keep the balance
                AddNodeToTreeRecursive(newNode, existingNode.Left);
                existingNode.Left.Rectangle = new Rectangle(existingNode.Left.Rectangle, newNode.Rectangle);
            }
            else if (((2 * existingNode.Right.Count)
                < existingNode.Left.Count)) {
                // keep the balance
                AddNodeToTreeRecursive(newNode, existingNode.Right);
                existingNode.Right.Rectangle = new Rectangle(existingNode.Right.Rectangle, newNode.Rectangle);
            }
            else {
                // decide basing on the boxes
                leftBox = new Rectangle(existingNode.Left.Rectangle, newNode.Rectangle);
                let delLeft = (leftBox.Area - existingNode.Left.Rectangle.Area);
                rightBox = new Rectangle(existingNode.Right.Rectangle, newNode.Rectangle);
                let delRight = (rightBox.Area - existingNode.Right.Rectangle.Area);
                if ((delLeft < delRight)) {
                    AddNodeToTreeRecursive(newNode, existingNode.Left);
                    existingNode.Left.Rectangle = leftBox;
                }
                else if ((delLeft > delRight)) {
                    AddNodeToTreeRecursive(newNode, existingNode.Right);
                    existingNode.Right.Rectangle = rightBox;
                }
                else {
                    // the deltas are the same; add to the smallest
                    if ((leftBox.Area < rightBox.Area)) {
                        AddNodeToTreeRecursive(newNode, existingNode.Left);
                        existingNode.Left.Rectangle = leftBox;
                    }
                    else {
                        AddNodeToTreeRecursive(newNode, existingNode.Right);
                        existingNode.Right.Rectangle = rightBox;
                    }

                }

            }

        }

        existingNode.Rectangle = new Rectangle(existingNode.Left.Rectangle, existingNode.Right.Rectangle);
        UnknownRemoveLeaf(RectangleNode, leaf);
        {
            Debug.Assert(leaf.IsLeaf);
            if ((unbalancedNode != null)) {
                RebuildUnderNodeWithoutLeaf(unbalancedNode, leaf);
                UpdateParent(unbalancedNode);
            }
            else {
                // replace the parent with the sibling and update bounding boxes and counts
                let parent = leaf.Parent;
                if ((parent == null)) {
                    Debug.Assert((_rootNode == leaf));
                    _rootNode = new RectangleNode<TData>();
                }
                else {
                    TransferFromSibling(parent, parent.Right);
                    // TODO: Warning!!!, inline IF is not supported ?
                    leaf.IsLeftChild;
                    parent.Left;
                    UpdateParent(parent);
                }

            }

            //    Debug.Assert(TreeIsCorrect(RootNode));
            Unknown//         static bool TreeIsCorrect(RectangleNode<TData> node)
            //         {
            //             if (node == null)
            //                 return true;
            //             bool ret= node.Left != null && node.Right != null  ||
            //                    node.Left == null && node.Right == null;
            //             if (!ret)
            //                 return false;
            //             return TreeIsCorrect(node.Left) && TreeIsCorrect(node.Right);
            //         }
            staticUpdateParent(RectangleNode, parent);
            {
                for (let node = parent.Parent; (node != null); node = node.Parent) {
                    node.Count--;
                    node.Rectangle = new Rectangle(node.Left.Rectangle, node.Right.Rectangle);
                }

                UnknownstaticTransferFromSibling(RectangleNode, parent, RectangleNode, sibling);
                {
                    parent.UserData = sibling.UserData;
                    parent.Left = sibling.Left;
                    parent.Right = sibling.Right;
                    parent.Count--;
                    parent.Rectangle = sibling.Rectangle;
                    UnknownstaticRebuildUnderNodeWithoutLeaf(RectangleNode, nodeForRebuild, RectangleNode, leaf);
                    {
                        Debug.Assert(leaf.IsLeaf);
                        Debug.Assert(!nodeForRebuild.IsLeaf);
                        nodeForRebuild.Count = newNode.Count;
                        nodeForRebuild.Left = newNode.Left;
                        nodeForRebuild.Right = newNode.Right;
                        nodeForRebuild.Rectangle = new Rectangle(newNode.Left.rectangle, newNode.Right.rectangle);
                        Unknown//  Removes everything from the tree
                        publicClear();
                        {
                            RootNode = null;
                            UnknownUnknownUnknown
    
    static GetNodeRects(nodes: IEnumerable<KeyValuePair<Rectangle, TData>>): IEnumerable < RectangleNode < TData >> {
                                return nodes.Select(() => { }, new RectangleNode<TData>(v.Value, v.Key));
                            }

    //  return all the data elements stored at the leaves of the BSPTree of an IEnumerable
    public GetAllLeaves(): IEnumerable < TData > {
                                return _rootNode.GetAllLeaves();
        // TODO: Warning!!!, inline IF is not supported ?
        ((_rootNode != null)
                                    && (Count > 0));
                            new Array(0);
                        }

    //  Get all data items with rectangles intersecting the specified rectangular region
    public GetAllIntersecting(queryRegion: Rectangle): TData[] {
                            return new Array(0);
                            // TODO: Warning!!!, inline IF is not supported ?
                            ((_rootNode == null)
                                || (Count == 0));
                            _rootNode.GetNodeItemsIntersectingRectangle(queryRegion).ToArray();
                        }
    
    public OneIntersecting(queryRegion: Rectangle, /* out */intersectedLeaf: TData): boolean {
                            if (((_rootNode == null)
                                || (Count == 0))) {
                                return false;
                            }

                            let ret: RectangleNode<TData> = _rootNode.FirstIntersectedNode(queryRegion);
                            if ((ret == null)) {
                                return false;
                            }

                            intersectedLeaf = ret.UserData;
                            return true;
                        }

                        //  Get all leaf nodes with rectangles intersecting the specified rectangular region
                        GetAllLeavesIntersectingRectangle(queryRegion: Rectangle): IEnumerable < RectangleNode < TData >> {
                            return new Array(0);
        // TODO: Warning!!!, inline IF is not supported ?
        ((_rootNode == null)
                                || (Count == 0));
                        _rootNode.GetLeafRectangleNodesIntersectingRectangle(queryRegion);
                    }

    //  Does minimal work to determine if any objects of the tree intersect with the query region
    public IsIntersecting(queryRegion: Rectangle): boolean {
                        return GetAllIntersecting(queryRegion).Any();
                    }

    //  return true iff there is a node with the rectangle and UserData that equals to the parameter "userData"
    public Contains(rectangle: Rectangle, userData: TData): boolean {
                        if ((_rootNode == null)) {
                            return false;
                        }

                        return _rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle).Any(() => { }, node.UserData.Equals(userData));
                    }
    
    public Remove(rectangle: Rectangle, userData: TData): TData {
                        if ((_rootNode == null)) {
                            return;
                        }

                        let ret = _rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle).FirstOrDefault(() => { }, node.UserData.Equals(userData));
                        if ((ret == null)) {
                            return;
                        }

                        if ((RootNode.Count == 1)) {
                            RootNode = null;
                        }
                        else {
                            RemoveLeaf(ret);
                        }

                        return ret.UserData;
                    }

                    unbalancedNode: var = FindTopUnbalancedNode(leaf);

                    newNode: var = RectangleNode.CreateRectangleNodeOnEnumeration(nodeForRebuild.GetAllLeafNodes().Where(() => { }, !n.Equals(leaf)));
    
    static FindTopUnbalancedNode(node: RectangleNode<TData>): RectangleNode < TData > {
                        for(let parent = node.Parent; (parent != null); parent = parent.Parent) {
                        if (!Balanced(parent)) {
                            return parent;
                        }

                    }

                    return null;
                }
    
    static Balanced(rectangleNode: RectangleNode<TData>): boolean {
                    return(((2 * rectangleNode.Left.Count)
                        >= rectangleNode.Right.Count)
                    && ((2 * rectangleNode.Right.Count)
                        >= rectangleNode.Left.Count));
            }
    
    public NumberOfIntersectedIsLessThanBound(rect: Rectangle, bound: number, conditionFunc: Func<TData, boolean>): boolean {
                return NumberOfIntersectedIsLessThanBoundOnNode(_rootNode, rect, /* ref */bound, conditionFunc);
            }
    
    static NumberOfIntersectedIsLessThanBoundOnNode(node: RectangleNode < TData >, rect: Rectangle, /* ref */bound: number, conditionFunc: Func<TData, boolean>): boolean {
                Debug.Assert((bound > 0));
                if(!node.Rectangle.Intersects(rect)) {
                return true;
            }
        
        if (node.IsLeaf) {
                if (conditionFunc(node.UserData)) {
                    return ((bound + 1)
                        != 0);
                }

                return true;
            }

            return (NumberOfIntersectedIsLessThanBoundOnNode(node.Left, rect, /* ref */bound, conditionFunc) && NumberOfIntersectedIsLessThanBoundOnNode(node.Right, rect, /* ref */bound, conditionFunc));
        }
    }