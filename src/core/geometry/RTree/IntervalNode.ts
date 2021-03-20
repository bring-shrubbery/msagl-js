// Represents an interval and some user data.
// Is is used in curve intersections routines.
export class IntervalNode<TData> {
  // 
  toString() {
    return this.IsLeaf ? (Count + " " + UserData) : this.Count
  }
  // 
  Count: number
  left: IntervalNode<TData>
  right: IntervalNode<TData>
  UserData: TData

  // 
  mkIntervalNodeDataInterval(data: TData, rect: Interval): IntervalNode<Data> {
    this.UserData = data;
    this.Interval = rect;
    this.Count = 1;
    return this
  }

  mkIntervalNodeCount(count: number) {
    this.Count = count;
    return this
  }

  // This field provides direct  access to the value type Interval, which RTree and other callers
  // modify directly with .Add(); the auto-property returns a temporary value-by-copy that is immediately discarded.
  // ReSharper disable InconsistentNaming
  interval: Interval;
  // ReSharper restore InconsistentNaming

  // gets or sets the interval of the node
  public Interval Interval {
  get { return interval; }
  set { interval = value; }
}

// false if it is an  node and true if it is a leaf
bool IsLeaf
{
  get { return left == null /*&& right==null*/; } //if left is a null then right is also a null
}
        // 
        public IntervalNode < TData > Left {
  get { return left; }
  set {
    if (left != null && left.Parent == this)
      left.Parent = null;
    left = value;
    if (left != null)
      left.Parent = this;
  }
}

        // 
        public IntervalNode < TData > Right {
  get { return right; }
  set {
    if (right != null && right.Parent == this)
      right.Parent = null;
    right = value;
    if (right != null)
      right.Parent = this;
  }
}

        // The actual data if a leaf node, else null or a value-type default.

        // Parent of this node.
        public IntervalNode < TData > Parent { get; private set; }

bool IsLeftChild {
  get {
    Debug.Assert(Parent != null);
    return Equals(Parent.Left);
  }
}

        // brings the first leaf which interval was hit and the delegate is happy with the object
        public IntervalNode < TData > FirstHitNode(number point, Func < number, TData, HitTestBehavior > hitTestFornumberDelegate) {
  if (interval.Contains(point)) {
    if (IsLeaf) {
      if (hitTestFornumberDelegate != null) {
        return hitTestFornumberDelegate(point, UserData) == HitTestBehavior.Stop ? this : null;
      }
      return this;
    }
    return Left.FirstHitNode(point, hitTestFornumberDelegate) ??
      Right.FirstHitNode(point, hitTestFornumberDelegate);
  }
  return null;
}


        // brings the first leaf which interval was intersected
        public IntervalNode < TData > FirstIntersectedNode(Interval r) {
  if (r.Intersects(interval)) {
    if (IsLeaf)
      return this;
    return Left.FirstIntersectedNode(r) ?? Right.FirstIntersectedNode(r);
  }
  return null;
}



        // brings the first leaf which interval was hit and the delegate is happy with the object
        public IntervalNode < TData > FirstHitNode(number point) {
  if (interval.Contains(point)) {
    if (IsLeaf)
      return this;
    return Left.FirstHitNode(point) ?? Right.FirstHitNode(point);
  }
  return null;
}


        // returns all leaf nodes for which the interval was hit and the delegate is happy with the object
        public IEnumerable < TData > AllHitItems(Interval intervalPar, Func < TData, bool > hitTestAccept) {
  var stack = new Stack<IntervalNode<TData>>();
  stack.Push(this);
  while (stack.Count > 0) {
    IntervalNode < TData > node = stack.Pop();
    if (node.Interval.Intersects(intervalPar)) {
      if (node.IsLeaf) {
        if ((null == hitTestAccept) || hitTestAccept(node.UserData)) {
          yield node.UserData;
        }
      }
      else {
        stack.Push(node.left);
        stack.Push(node.right);
      }
    }
  }
}

        // returns all items for which the interval contains the point
        public IEnumerable < TData > AllHitItems(number point) {
  var stack = new Stack<IntervalNode<TData>>();
  stack.Push(this);
  while (stack.Count > 0) {
    var node = stack.Pop();
    if (node.Interval.Contains(point)) {
      if (node.IsLeaf)
        yield node.UserData;
      else {
        stack.Push(node.left);
        stack.Push(node.right);
      }
    }
  }
}

        static HitTestBehavior VisitTreeStatic(IntervalNode < TData > intervalNode, Func < TData, HitTestBehavior > hitTest, Interval hitInterval) {
  if (intervalNode.Interval.Intersects(hitInterval)) {
    if (hitTest(intervalNode.UserData) == HitTestBehavior.Continue) {
      if (intervalNode.Left != null) {
        // If intervalNode.Left is not null, intervalNode.Right won't be either.
        if (VisitTreeStatic(intervalNode.Left, hitTest, hitInterval) == HitTestBehavior.Continue &&
          VisitTreeStatic(intervalNode.Right, hitTest, hitInterval) == HitTestBehavior.Continue) {
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

        // 
        public IntervalNode < TData > Clone() {
  var ret = new IntervalNode<TData>(Count) { UserData = UserData, Interval = Interval };
  if (Left != null)
    ret.Left = Left.Clone();
  if (Right != null)
    ret.Right = Right.Clone();
  return ret;
}

        // yields all leaves which intervals intersect the given one. We suppose that leaves are all nodes having UserData not a null.
        public IEnumerable < TData > GetNodeItemsIntersectingInterval(Interval intervalPar) {
  return GetLeafIntervalNodesIntersectingInterval(intervalPar).Select(node => node.UserData);
}

        // yields all leaves whose intervals intersect the given one. We suppose that leaves are all nodes having UserData not a null.
        public IEnumerable < IntervalNode < TData >> GetLeafIntervalNodesIntersectingInterval(Interval intervalPar) {
  var stack = new Stack<IntervalNode<TData>>();
  stack.Push(this);
  while (stack.Count > 0) {
    IntervalNode < TData > node = stack.Pop();
    if (node.Interval.Intersects(intervalPar)) {
      if (node.IsLeaf) {
        yield node;
      } else {
        stack.Push(node.left);
        stack.Push(node.right);
      }
    }
  }
}

        // Walk the tree and return the data from all leaves
        public IEnumerable < TData > GetAllLeaves() {
  return GetAllLeafNodes().Select(n => n.UserData);
}

IEnumerable < IntervalNode < TData >> GetAllLeafNodes() {
  return EnumIntervalNodes(true /*leafOnly*/);
}

IEnumerable < IntervalNode < TData >> EnumIntervalNodes(bool leafOnly) {
  var stack = new Stack<IntervalNode<TData>>();
  stack.Push(this);
  while (stack.Count > 0) {
    var node = stack.Pop();
    if (node.IsLeaf || !leafOnly) {
      yield node;
    }
    if (!node.IsLeaf) {
      stack.Push(node.left);
      stack.Push(node.right);
    }
  }
}

const number GroupSplitThreshold = 2;


        // calculates a tree based on the given nodes
        public static IntervalNode < TData > CreateIntervalNodeOnEnumeration(IEnumerable < IntervalNode < TData >> nodes) {
  if (nodes == null)
    return null;
  var nodeList = new List<IntervalNode<TData>>(nodes);
  return CreateIntervalNodeOnListOfNodes(nodeList);
}

        //calculates a tree based on the given nodes
        public static IntervalNode < TData > CreateIntervalNodeOnData(IEnumerable < TData > dataEnumeration, Func < TData, Interval > intervalDelegate) {
  if (dataEnumeration == null || intervalDelegate == null)
    return null;
  var nodeList = new List<IntervalNode<TData>>(dataEnumeration.Select(d => new IntervalNode<TData>(d, intervalDelegate(d))));
  return CreateIntervalNodeOnListOfNodes(nodeList);
}


        // 
        static public IntervalNode < TData > CreateIntervalNodeOnListOfNodes(IList < IntervalNode < TData >> nodes) {
  ValidateArg.IsNotNull(nodes, "nodes");
  if (nodes.Count == 0) return null;

  if (nodes.Count == 1) return nodes[0];

  //Finding the seeds
  var b0 = nodes[0].Interval;

  //the first seed
  number seed0 = 1;

  number seed1 = ChooseSeeds(nodes, ref b0, ref seed0);

  //We have two seeds at hand. Build two groups.
  var gr0 = new List<IntervalNode<TData>>();
  var gr1 = new List<IntervalNode<TData>>();

  gr0.Add(nodes[seed0]);
  gr1.Add(nodes[seed1]);

  var box0 = nodes[seed0].Interval;
  var box1 = nodes[seed1].Interval;
  //divide nodes on two groups
  DivideNodes(nodes, seed0, seed1, gr0, gr1, ref box0, ref box1, GroupSplitThreshold);

  var ret = new IntervalNode<TData>(nodes.Count) {
    Interval = new Interval(box0, box1),
    Left = CreateIntervalNodeOnListOfNodes(gr0),
    Right = CreateIntervalNodeOnListOfNodes(gr1)
  };

  return ret;

}

        static number ChooseSeeds(IList < IntervalNode < TData >> nodes, ref Interval b0, ref number seed0) {
  number area = new Interval(b0, nodes[seed0].Interval).Length;
  for (number i = 2; i < nodes.Count; i++) {
    number area0 = new Interval(b0, nodes[i].Interval).Length;
    if (area0 > area) {
      seed0 = i;
      area = area0;
    }
  }

  //Got the first seed seed0
  //Now looking for a seed for the second group
  number seed1 = 0; //the compiler forces me to init it

  //init seed1
  for (number i = 0; i < nodes.Count; i++) {
    if (i != seed0) {
      seed1 = i;
      break;
    }
  }

  area = new Interval(nodes[seed0].Interval, nodes[seed1].Interval).Length;
  //Now try to improve the second seed

  for (number i = 0; i < nodes.Count; i++) {
    if (i == seed0)
      continue;
    number area1 = new Interval(nodes[seed0].Interval, nodes[i].Interval).Length;
    if (area1 > area) {
      seed1 = i;
      area = area1;
    }
  }
  return seed1;
}

        static DivideNodes(IList < IntervalNode < TData >> nodes, number seed0, number seed1, List < IntervalNode < TData >> gr0, List < IntervalNode < TData >> gr1,
  ref Interval box0, ref Interval box1, number groupSplitThreshold) {
  for (number i = 0; i < nodes.Count; i++) {

    if (i == seed0 || i == seed1)
      continue;

    // ReSharper disable InconsistentNaming
    var box0_ = new Interval(box0, nodes[i].Interval);
    number delta0 = box0_.Length - box0.Length;

    var box1_ = new Interval(box1, nodes[i].Interval);
    number delta1 = box1_.Length - box1.Length;
    // ReSharper restore InconsistentNaming

    //keep the tree roughly balanced

    if (gr0.Count * groupSplitThreshold < gr1.Count) {
      gr0.Add(nodes[i]);
      box0 = box0_;
    } else if (gr1.Count * groupSplitThreshold < gr0.Count) {
      gr1.Add(nodes[i]);
      box1 = box1_;
    } else if (delta0 < delta1) {
      gr0.Add(nodes[i]);
      box0 = box0_;
    } else if (delta1 < delta0) {
      gr1.Add(nodes[i]);
      box1 = box1_;
    } else if (box0.Length < box1.Length) {
      gr0.Add(nodes[i]);
      box0 = box0_;
    } else {
      gr1.Add(nodes[i]);
      box1 = box1_;
    }
  }
}



        // Walk the tree from node down and apply visitor to all nodes
        static public TraverseHierarchy(IntervalNode < TData > node, Action < IntervalNode < TData >> visitor) {
  ValidateArg.IsNotNull(node, "node");
  ValidateArg.IsNotNull(visitor, "visitor");
  visitor(node);
  if (node.Left != null)
    TraverseHierarchy(node.Left, visitor);
  if (node.Right != null)
    TraverseHierarchy(node.Right, visitor);
}
    }
}
