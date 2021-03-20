using Microsoft.Msagl.Core.Layout;

namespace Microsoft.Msagl.Core.Geometry {
    // A search tree for rapid lookup of TData objects keyed by rectangles inside a given rectangular region
    // It is very similar to "R-TREES. A DYNAMIC INDEX STRUCTURE FOR SPATIAL SEARCHING" by Antonin Guttman
    public class RTree<TData> {
        // 
        public RectangleNode<TData> RootNode
        {
            get { return _rootNode; }
            set { _rootNode=value; }
        }

        RectangleNode<TData> _rootNode;
       

        // Create the query tree for a given enumerable of TData keyed by Rectangles
        public RTree(IEnumerable<KeyValuePair<Rectangle, TData>> rectsAndData) {
            _rootNode = RectangleNode<TData>.CreateRectangleNodeOnEnumeration(GetNodeRects(rectsAndData));
        }

        // Create a query tree for a given root node
        public RTree(RectangleNode<TData> rootNode) {
            this._rootNode = rootNode;
        }

        public RTree() {
            
        }

        // The number of data elements of the tree (number of leaf nodes)
        public number Count {
            get { return _rootNode == null ? 0 : _rootNode.Count; }
        }

     
        // Add the given key, value pair
        public  Add(Rectangle key, TData value) {
            Add(new RectangleNode<TData>(value, key));            
        }

          Add(RectangleNode<TData> node) {
            if (_rootNode == null)
                _rootNode = node;
            else if (Count <= 2)
                _rootNode = RectangleNode<TData>.CreateRectangleNodeOnEnumeration(_rootNode.GetAllLeafNodes().Concat(new[] {node}));
            else
                AddNodeToTreeRecursive(node, _rootNode);
        }
        // rebuild the whole tree
        public  Rebuild() {
            _rootNode = RectangleNode<TData>.CreateRectangleNodeOnEnumeration(_rootNode.GetAllLeafNodes());
        }

        static IEnumerable<RectangleNode<TData>> GetNodeRects(IEnumerable<KeyValuePair<Rectangle, TData>> nodes) {
            return nodes.Select(v => new RectangleNode<TData>(v.Value, v.Key));
        }

        static  AddNodeToTreeRecursive(RectangleNode<TData> newNode, RectangleNode<TData> existingNode) {
            if (existingNode.IsLeaf) {
                existingNode.Left = new RectangleNode<TData>(existingNode.UserData, existingNode.Rectangle);
                existingNode.Right = newNode;
                existingNode.Count = 2;
                existingNode.UserData = default(TData);                
            } else {
                existingNode.Count++;
                Rectangle leftBox;
                Rectangle rightBox;
                if (2 * existingNode.Left.Count < existingNode.Right.Count) {
                    //keep the balance
                    AddNodeToTreeRecursive(newNode, existingNode.Left);
                    existingNode.Left.Rectangle = new Rectangle(existingNode.Left.Rectangle, newNode.Rectangle);
                } else if (2 * existingNode.Right.Count < existingNode.Left.Count) {
                    //keep the balance
                    AddNodeToTreeRecursive(newNode, existingNode.Right);
                    existingNode.Right.Rectangle = new Rectangle(existingNode.Right.Rectangle, newNode.Rectangle);
                } else { //decide basing on the boxes
                    leftBox = new Rectangle(existingNode.Left.Rectangle, newNode.Rectangle);
                    var delLeft = leftBox.Area - existingNode.Left.Rectangle.Area;
                    rightBox = new Rectangle(existingNode.Right.Rectangle, newNode.Rectangle);
                    var delRight = rightBox.Area - existingNode.Right.Rectangle.Area;
                    if (delLeft < delRight) {
                        AddNodeToTreeRecursive(newNode, existingNode.Left);
                        existingNode.Left.Rectangle = leftBox;
                    } else if(delLeft>delRight){
                        AddNodeToTreeRecursive(newNode, existingNode.Right);
                        existingNode.Right.Rectangle = rightBox;
                    } else { //the deltas are the same; add to the smallest
                        if(leftBox.Area<rightBox.Area) {
                            AddNodeToTreeRecursive(newNode, existingNode.Left);
                            existingNode.Left.Rectangle = leftBox;
                        }else {
                            AddNodeToTreeRecursive(newNode, existingNode.Right);
                            existingNode.Right.Rectangle = rightBox;
                        }
                    }
                }
            }
            existingNode.Rectangle = new Rectangle(existingNode.Left.Rectangle, existingNode.Right.Rectangle);
        }


        // return all the data elements stored at the leaves of the BSPTree of an IEnumerable
        public IEnumerable<TData> GetAllLeaves() {
            return _rootNode!=null && Count>0 ? _rootNode.GetAllLeaves():new TData[0];
        }

        // Get all data items with rectangles intersecting the specified rectangular region
        public TData[] GetAllIntersecting(Rectangle queryRegion)
        {
            return _rootNode == null || Count == 0 ? new TData[0] : _rootNode.GetNodeItemsIntersectingRectangle(queryRegion).ToArray();
        }

        public bool OneIntersecting(Rectangle queryRegion, out TData intersectedLeaf) {
            if (_rootNode == null || Count == 0) {
                intersectedLeaf = default(TData);
                return false;
            }
            RectangleNode<TData> ret = _rootNode.FirstIntersectedNode(queryRegion);
            if (ret == null) {
                intersectedLeaf = default(TData);
                return false;
            }
            intersectedLeaf = ret.UserData;
            return true;
        }

        // Get all leaf nodes with rectangles intersecting the specified rectangular region
         IEnumerable<RectangleNode<TData>> GetAllLeavesIntersectingRectangle(Rectangle queryRegion) {
            return _rootNode == null || Count == 0 ? new RectangleNode<TData>[0] : _rootNode.GetLeafRectangleNodesIntersectingRectangle(queryRegion);
        }

        // Does minimal work to determine if any objects of the tree intersect with the query region
        public bool IsIntersecting(Rectangle queryRegion) {
            return GetAllIntersecting(queryRegion).Any();
        }

        // return true iff there is a node with the rectangle and UserData that equals to the parameter "userData"
        public bool Contains(Rectangle rectangle, TData userData) {
            if (_rootNode == null) return false;
            return
                _rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle)
                        .Any(node => node.UserData.Equals(userData));
        }

        public TData Remove(Rectangle rectangle, TData userData) {
            if (_rootNode==null)
            {
                return default(TData);
            }
            var ret = _rootNode.GetLeafRectangleNodesIntersectingRectangle(rectangle).FirstOrDefault(node => node.UserData.Equals(userData));
            if (ret == null)
                return default(TData);
            if (RootNode.Count == 1)
                RootNode = null;
            else
                RemoveLeaf(ret);
            return ret.UserData;
        }

         RemoveLeaf(RectangleNode<TData> leaf) {
            Debug.Assert(leaf.IsLeaf);
            
            var unbalancedNode = FindTopUnbalancedNode(leaf);
            if (unbalancedNode != null) {
                RebuildUnderNodeWithoutLeaf(unbalancedNode, leaf);
                UpdateParent(unbalancedNode);
            } else {
                //replace the parent with the sibling and update bounding boxes and counts
                var parent = leaf.Parent;
                if (parent == null) {
                    Debug.Assert(_rootNode == leaf);
                    _rootNode = new RectangleNode<TData>();
                } else {
                    TransferFromSibling(parent, leaf.IsLeftChild ? parent.Right : parent.Left);
                    UpdateParent(parent);
                }
            }
        //   Debug.Assert(TreeIsCorrect(RootNode));
        }

//        static bool TreeIsCorrect(RectangleNode<TData> node)
//        {
//            if (node == null)
//                return true;
//            bool ret= node.Left != null && node.Right != null  ||
//                   node.Left == null && node.Right == null;
//            if (!ret)
//                return false;
//            return TreeIsCorrect(node.Left) && TreeIsCorrect(node.Right);
//        }

        static  UpdateParent(RectangleNode<TData> parent) {
            for(var node=parent.Parent; node!=null; node=node.Parent) {
                node.Count--;
                node.Rectangle=new Rectangle(node.Left.Rectangle, node.Right.Rectangle);
            }
        } 

        static  TransferFromSibling(RectangleNode<TData> parent, RectangleNode<TData> sibling) {
            parent.UserData=sibling.UserData;
            parent.Left = sibling.Left;
            parent.Right=sibling.Right;
            parent.Count--;
            parent.Rectangle = sibling.Rectangle;
        }

        static  RebuildUnderNodeWithoutLeaf(RectangleNode<TData> nodeForRebuild, RectangleNode<TData> leaf)
        {
            Debug.Assert(leaf.IsLeaf);
            Debug.Assert(!nodeForRebuild.IsLeaf);
            var newNode =
                RectangleNode<TData>.CreateRectangleNodeOnEnumeration(
                    nodeForRebuild.GetAllLeafNodes().Where(n => !(n.Equals(leaf))));
            nodeForRebuild.Count = newNode.Count;
            nodeForRebuild.Left = newNode.Left;
            nodeForRebuild.Right = newNode.Right;
            nodeForRebuild.Rectangle = new Rectangle(newNode.Left.rectangle, newNode.Right.rectangle);
        }

        static RectangleNode<TData> FindTopUnbalancedNode(RectangleNode<TData> node) {
            for (var parent = node.Parent; parent != null; parent = parent.Parent)
                if (! Balanced(parent))
                    return parent;
            return null;
        }

        static bool Balanced(RectangleNode<TData> rectangleNode) {
            return 2*rectangleNode.Left.Count >= rectangleNode.Right.Count &&
                   2*rectangleNode.Right.Count >= rectangleNode.Left.Count;
        }

        // Removes everything from the tree
        public  Clear() {
            RootNode = null;
        }

        public bool NumberOfIntersectedIsLessThanBound(Rectangle rect, number bound, Func<TData, bool> conditionFunc ) {
            return NumberOfIntersectedIsLessThanBoundOnNode(_rootNode, rect, ref bound, conditionFunc);
        }

        static bool NumberOfIntersectedIsLessThanBoundOnNode(RectangleNode<TData> node, Rectangle rect, ref number bound, Func<TData, bool> conditionFunc) {
            Debug.Assert(bound > 0);
            if (!node.Rectangle.Intersects(rect)) return true;
            if (node.IsLeaf) {
                if (conditionFunc(node.UserData))
                    return (--bound) != 0;
                return true;
            }

            return NumberOfIntersectedIsLessThanBoundOnNode(node.Left, rect, ref bound, conditionFunc) &&
                   NumberOfIntersectedIsLessThanBoundOnNode(node.Right, rect, ref bound, conditionFunc);

        }
    }

}
