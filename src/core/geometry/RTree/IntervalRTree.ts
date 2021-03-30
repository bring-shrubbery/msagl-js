using Microsoft.Msagl.Layout.LargeGraphLayout;

namespace Microsoft.Msagl.Core.Geometry {
    // A search tree for rapid lookup of TData objects keyed by rectangles inside a given rectangular region
    // It is very similar to "R-TREES. A DYNAMIC INDEX STRUCTURE FOR SPATIAL SEARCHING" by Antonin Guttman
    public class IntervalRTree<TData> {
        // 
        public IntervalNode<TData> RootNode
        {
        get { return rootNode; }
        set { rootNode = value; }
    }

    IntervalNode < TData > rootNode;


        // Create the query tree for a given enumerable of TData keyed by Intervals
        public IntervalRTree(IEnumerable < KeyValuePair < Interval, TData >> rectsAndData) {
        rootNode = IntervalNode<TData>.CreateIntervalNodeOnEnumeration(GetNodeRects(rectsAndData));
    }

        // Create a query tree for a given root node
        public IntervalRTree(IntervalNode < TData > rootNode) {
        this.rootNode = rootNode;
    }

        public IntervalRTree() {

    }

        // The number of data elements of the tree (number of leaf nodes)
        public number Count {
        get { return rootNode == null ? 0 : rootNode.Count; }
    }


        // Add the given key, value pair
        public Add(Interval key, TData value) {
        Add(new IntervalNode<TData>(value, key));
    }

    Add(IntervalNode < TData > node) {

        if (rootNode == null)
            rootNode = node;
        else if (Count <= 2)
            rootNode = IntervalNode<TData>.CreateIntervalNodeOnEnumeration(rootNode.GetAllLeafNodes().Concat(new [] { node }));
        else
            AddNodeToTreeRecursive(node, rootNode);
    }
        // rebuild the whole tree
        public Rebuild() {
        rootNode = IntervalNode<TData>.CreateIntervalNodeOnEnumeration(rootNode.GetAllLeafNodes());
    }

        static IEnumerable < IntervalNode < TData >> GetNodeRects(IEnumerable < KeyValuePair < Interval, TData >> nodes) {
        return nodes.Select(v => new IntervalNode<TData>(v.Value, v.Key));
    }

        static AddNodeToTreeRecursive(IntervalNode < TData > newNode, IntervalNode < TData > existingNode) {
        if (existingNode.IsLeaf) {
            existingNode.Left = new IntervalNode<TData>(existingNode.UserData, existingNode.Interval);
            existingNode.Right = newNode;
            existingNode.Count = 2;
            existingNode.UserData = default (TData);
        } else {
            existingNode.Count++;
            Interval leftBox;
            Interval rightBox;
            if (2 * existingNode.Left.Count < existingNode.Right.Count) {
                //keep the balance
                AddNodeToTreeRecursive(newNode, existingNode.Left);
                existingNode.Left.Interval = new Interval(existingNode.Left.Interval, newNode.Interval);
            } else if (2 * existingNode.Right.Count < existingNode.Left.Count) {
                //keep the balance
                AddNodeToTreeRecursive(newNode, existingNode.Right);
                existingNode.Right.Interval = new Interval(existingNode.Right.Interval, newNode.Interval);
            } else { //decide basing on the boxes
                leftBox = new Interval(existingNode.Left.Interval, newNode.Interval);
                var delLeft = leftBox.Length - existingNode.Left.Interval.Length;
                rightBox = new Interval(existingNode.Right.Interval, newNode.Interval);
                var delRight = rightBox.Length - existingNode.Right.Interval.Length;
                if (delLeft < delRight) {
                    AddNodeToTreeRecursive(newNode, existingNode.Left);
                    existingNode.Left.Interval = leftBox;
                } else if (delLeft > delRight) {
                    AddNodeToTreeRecursive(newNode, existingNode.Right);
                    existingNode.Right.Interval = rightBox;
                } else { //the deltas are the same; add to the smallest
                    if (leftBox.Length < rightBox.Length) {
                        AddNodeToTreeRecursive(newNode, existingNode.Left);
                        existingNode.Left.Interval = leftBox;
                    } else {
                        AddNodeToTreeRecursive(newNode, existingNode.Right);
                        existingNode.Right.Interval = rightBox;
                    }
                }
            }
        }
        existingNode.Interval = new Interval(existingNode.Left.Interval, existingNode.Right.Interval);
    }


        // return all the data elements stored at the leaves of the BSPTree of an IEnumerable
        public IEnumerable < TData > GetAllLeaves() {
        return rootNode != null && Count > 0 ? rootNode.GetAllLeaves() : new TData[0];
    }

        // Get all data items with rectangles intersecting the specified rectangular region
        public IEnumerable < TData > GetAllIntersecting(Interval queryRegion)
    {
        return rootNode == null || Count == 0 ? new TData[0] : rootNode.GetNodeItemsIntersectingInterval(queryRegion);
    }

        // Does minimal work to determine if any objects of the tree intersect with the query region
        public bool IsIntersecting(Interval queryRegion) {
        return GetAllIntersecting(queryRegion).Any();
    }

        // return true iff there is a node with the rectangle and UserData that equals to the parameter "userData"
        public bool Contains(Interval rectangle, TData userData) {
        if (rootNode == null) return false;
        return
        rootNode.GetLeafIntervalNodesIntersectingInterval(rectangle)
            .Any(node => node.UserData.Equals(userData));
    }

        public TData Remove(Interval rectangle, TData userData) {
        if (rootNode == null) {
            return default (TData);
        }
        var ret = rootNode.GetLeafIntervalNodesIntersectingInterval(rectangle).FirstOrDefault(node => node.UserData.Equals(userData));
        if (ret == null)
            return default (TData);
        if (RootNode.Count == 1)
            RootNode = null;
        else
            RemoveLeaf(ret);
        return ret.UserData;
    }

    RemoveLeaf(IntervalNode < TData > leaf) {
        Assert.assert(leaf.IsLeaf);

        var unbalancedNode = FindTopUnbalancedNode(leaf);
        if (unbalancedNode != null) {
            RebuildUnderNodeWithoutLeaf(unbalancedNode, leaf);
            UpdateParent(unbalancedNode);
        } else {
            //replace the parent with the sibling and update bounding boxes and counts
            var parent = leaf.Parent;
            if (parent == null) {
                Assert.assert(rootNode == leaf);
                rootNode = new IntervalNode<TData>();
            } else {
                TransferFromSibling(parent, leaf.IsLeftChild ? parent.Right : parent.Left);
                UpdateParent(parent);
            }
        }
        Assert.assert(TreeIsCorrect(RootNode));
    }

        static bool TreeIsCorrect(IntervalNode < TData > node)
    {
        if (node == null)
            return true;
        bool ret = node.Left != null && node.Right != null ||
            node.Left == null && node.Right == null;
        if (!ret)
            return false;
        return TreeIsCorrect(node.Left) && TreeIsCorrect(node.Right);
    }

        static UpdateParent(IntervalNode < TData > parent) {
        for (var node = parent.Parent; node != null; node = node.Parent) {
            node.Count--;
            node.Interval = new Interval(node.Left.Interval, node.Right.Interval);
        }
    } 

        static TransferFromSibling(IntervalNode < TData > parent, IntervalNode < TData > sibling) {
        parent.UserData = sibling.UserData;
        parent.Left = sibling.Left;
        parent.Right = sibling.Right;
        parent.Count--;
        parent.Interval = sibling.Interval;
    }

        static RebuildUnderNodeWithoutLeaf(IntervalNode < TData > nodeForRebuild, IntervalNode < TData > leaf)
    {
        Assert.assert(leaf.IsLeaf);
        Assert.assert(!nodeForRebuild.IsLeaf);
        var newNode =
            IntervalNode<TData>.CreateIntervalNodeOnEnumeration(
                nodeForRebuild.GetAllLeafNodes().Where(n => !(n.Equals(leaf))));
        nodeForRebuild.Count = newNode.Count;
        nodeForRebuild.Left = newNode.Left;
        nodeForRebuild.Right = newNode.Right;
        nodeForRebuild.Interval = new Interval(newNode.Left.interval, newNode.Right.interval);
    }

        static IntervalNode < TData > FindTopUnbalancedNode(IntervalNode < TData > node) {
        for (var parent = node.Parent; parent != null; parent = parent.Parent)
            if (!Balanced(parent))
                return parent;
        return null;
    }

        static bool Balanced(IntervalNode < TData > rectangleNode) {
        return 2 * rectangleNode.Left.Count >= rectangleNode.Right.Count &&
            2 * rectangleNode.Right.Count >= rectangleNode.Left.Count;
    }
        // Removes everything from the tree
        public Clean()
    {
        RootNode = null;
    }
}

}
