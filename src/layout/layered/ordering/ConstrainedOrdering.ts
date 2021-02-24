export class ConstrainedOrdering {
  readonly GeometryGraph geometryGraph;
  readonly BasicGraph<Node, PolyIntEdge> intGraph;
  ProperLayeredGraph ProperLayeredGraph;
  readonly number[] initialLayering;
  LayerInfo[] layerInfos;
  LayerArrays LayerArrays;
  readonly HorizontalConstraintsForSugiyama horizontalConstraints;
        number numberOfNodesOfProperGraph;
        readonly Database database;
number[][] xPositions;
number[][] yetBestLayers;

        readonly List < PolyIntEdge > verticalEdges = new List<PolyIntEdge>();

        readonly AdjacentSwapsWithConstraints adjSwapper;

SugiyamaLayoutSettings settings;


number numberOfLayers = -1;
number noGainSteps;
const number MaxNumberOfNoGainSteps = 5;

number NumberOfLayers {
  get {
    if (numberOfLayers > 0)
      return numberOfLayers;
    return numberOfLayers = initialLayering.Max(i => i + 1);
  }
}

number NodeSeparation() {
  return settings.NodeSeparation;
}

constructor(
  GeometryGraph geomGraph,
  BasicGraph < Node, PolyIntEdge > basicIntGraph,
  number[] layering,
  Dictionary < Node, number > nodeIdToIndex,
  Database database,
  SugiyamaLayoutSettings settings) {

  this.settings = settings;
  horizontalConstraints = settings.HorizontalConstraints;

  horizontalConstraints.PrepareForOrdering(nodeIdToIndex, layering);

  geometryGraph = geomGraph;
  this.database = database;
  intGraph = basicIntGraph;
  initialLayering = layering;
  //this has to be changed only to insert layers that are needed
  if (NeedToInsertLayers(layering)) {
    for (number i = 0; i < layering.Length; i++)
    layering[i] *= 2;
    LayersAreDoubled = true;
    numberOfLayers = -1;
  }

  PrepareProperLayeredGraphAndFillLayerInfos();

  adjSwapper = new AdjacentSwapsWithConstraints(
    LayerArrays,
    HasCrossWeights(),
    ProperLayeredGraph,
    layerInfos);
}

bool LayersAreDoubled { get; set; }

bool NeedToInsertLayers(number[] layering) {
  return ExistsShortLabeledEdge(layering, intGraph.Edges) ||
    ExistsShortMultiEdge(layering, database.Multiedges);
}

        static bool ExistsShortMultiEdge(number[] layering, Dictionary < IntPair, List < PolyIntEdge >> multiedges) {
  return multiedges.Any(multiedge => multiedge.Value.Count > 2 && layering[multiedge.Key.x] == 1 + layering[multiedge.Key.y]);
}

void Calculate() {
  AllocateXPositions();
  var originalGraph = intGraph.Nodes[0].GeometryParent as GeometryGraph;
  LayeredLayoutEngine.CalculateAnchorSizes(database, out database.anchors, ProperLayeredGraph, originalGraph, intGraph, settings);
  LayeredLayoutEngine.CalcInitialYAnchorLocations(LayerArrays, 500, geometryGraph, database, intGraph, settings, LayersAreDoubled);
  Order();
}


ConstrainedOrderMeasure CreateMeasure() {
  return new ConstrainedOrderMeasure(Ordering.GetCrossingsTotal(ProperLayeredGraph, LayerArrays));
}

bool HasCrossWeights() {
  return ProperLayeredGraph.Edges.Any(le => le.CrossingWeight != 1);
}

        static bool ExistsShortLabeledEdge(number[] layering, IEnumerable < PolyIntEdge > edges) {
  return edges.Any(edge => layering[edge.Source] == layering[edge.Target] + 1 && edge.Edge.Label != null);
}

void AllocateXPositions() {
  xPositions = new number[NumberOfLayers][];
  for (number i = 0; i < NumberOfLayers; i++)
  xPositions[i] = new number[LayerArrays.Layers[i].Length];
}

void Order() {
  CreateInitialOrderInLayers();
  TryPushingOutStrangersFromHorizontalBlocks();
  number n = 5;

  ConstrainedOrderMeasure measure = null;

  while (n-- > 0 && noGainSteps <= MaxNumberOfNoGainSteps) {

    SetXPositions();

    ConstrainedOrderMeasure newMeasure = CreateMeasure();
    if (measure == null || newMeasure < measure) {
      noGainSteps = 0;
      Ordering.CloneLayers(LayerArrays.Layers, ref yetBestLayers);
      measure = newMeasure;
    } else {
      noGainSteps++;
      RestoreState();
    }

  }
}

void SetXPositions() {
  ISolverShell solver = InitSolverWithoutOrder();
  ImproveWithAdjacentSwaps();
  PutLayerNodeSeparationsIntoSolver(solver);
  solver.Solve();
  SortLayers(solver);
  for (number i = 0; i < LayerArrays.Y.Length; i++)
  database.Anchors[i].X = solver.GetVariableResolvedPosition(i);

}

ISolverShell InitSolverWithoutOrder() {
  ISolverShell solver = CreateSolver();
  InitSolverVars(solver);

  PutLeftRightConstraintsIntoSolver(solver);
  PutVerticalConstraintsIntoSolver(solver);
  AddGoalsToKeepProperEdgesShort(solver);

  AddGoalsToKeepFlatEdgesShort(solver);
  return solver;
}

void SortLayers(ISolverShell solver) {
  for (number i = 0; i < LayerArrays.Layers.Length; i++)
  SortLayerBasedOnSolution(LayerArrays.Layers[i], solver);
}

void AddGoalsToKeepFlatEdgesShort(ISolverShell solver) {
  for(var layerInfo in layerInfos)
  AddGoalToKeepFlatEdgesShortOnBlockLevel(layerInfo, solver);
}

void InitSolverVars(ISolverShell solver) {
  for (number i = 0; i < LayerArrays.Y.Length; i++)
  solver.AddVariableWithIdealPosition(i, 0);
}

void AddGoalsToKeepProperEdgesShort(ISolverShell solver) {
  for(var edge in ProperLayeredGraph.Edges)
  solver.AddGoalTwoVariablesAreClose(edge.Source, edge.Target, PositionOverBaricenterWeight);

}

void PutVerticalConstraintsIntoSolver(ISolverShell solver) {
  for(var pair in horizontalConstraints.VerticalInts) {
    solver.AddGoalTwoVariablesAreClose(pair.Item1, pair.Item2, ConstrainedVarWeight);
  }
}

void PutLeftRightConstraintsIntoSolver(ISolverShell solver) {
  for(var pair in horizontalConstraints.LeftRighInts) {
    solver.AddLeftRightSeparationConstraint(pair.Item1, pair.Item2, SimpleGapBetweenTwoNodes(pair.Item1, pair.Item2));
  }
}

void PutLayerNodeSeparationsIntoSolver(ISolverShell solver) {
  for(var layer in LayerArrays.Layers) {
    for (number i = 0; i < layer.Length - 1; i++) {
      number l = layer[i];
      number r = layer[i + 1];
      solver.AddLeftRightSeparationConstraint(l, r, SimpleGapBetweenTwoNodes(l, r));
    }
  }
}

void ImproveWithAdjacentSwaps() {
  adjSwapper.DoSwaps();
}

void TryPushingOutStrangersFromHorizontalBlocks() {

}

void CreateInitialOrderInLayers() {
  //the idea is to topologically ordering all nodes horizontally, by using vertical components, then fill the layers according to this order
  Dictionary < number, number > nodesToVerticalComponentsRoots = CreateVerticalComponents();
  IEnumerable < IntPair > liftedLeftRightRelations = LiftLeftRightRelationsToComponentRoots(nodesToVerticalComponentsRoots).ToArray();
  number[] orderOfVerticalComponentRoots = TopologicalSort.GetOrderOnEdges(liftedLeftRightRelations);
  FillLayersWithVerticalComponentsOrder(orderOfVerticalComponentRoots, nodesToVerticalComponentsRoots);
  LayerArrays.UpdateXFromLayers();
}

void FillLayersWithVerticalComponentsOrder(number[] order, Dictionary < number, number > nodesToVerticalComponentsRoots) {
  Dictionary < number, List < number >> componentRootsToComponents = CreateComponentRootsToComponentsMap(nodesToVerticalComponentsRoots);
  var alreadyInLayers = new bool[LayerArrays.Y.Length];
  var runninglayerCounts = new number[LayerArrays.Layers.Length];
  for(var vertCompRoot in order)
  PutVerticalComponentIntoLayers(EnumerateVertComponent(componentRootsToComponents, vertCompRoot), runninglayerCounts, alreadyInLayers);
  for (number i = 0; i < ProperLayeredGraph.NodeCount; i++)
  if (alreadyInLayers[i] == false)
    AddVertToLayers(i, runninglayerCounts, alreadyInLayers);

}

IEnumerable < number > EnumerateVertComponent(Dictionary < number, List < number >> componentRootsToComponents, number vertCompRoot) {
  List < number > compList;
  if (componentRootsToComponents.TryGetValue(vertCompRoot, out compList)) {
    for(var i in compList)
    yield return i;
  } else
    yield return vertCompRoot;

}


void PutVerticalComponentIntoLayers(IEnumerable < number > vertComponent, number[] runningLayerCounts, bool[] alreadyInLayers) {
  for(var i in vertComponent)
  AddVertToLayers(i, runningLayerCounts, alreadyInLayers);
}

void AddVertToLayers(number i, number[] runningLayerCounts, bool[] alreadyInLayers) {
  if (alreadyInLayers[i])
    return;
  number layerIndex = LayerArrays.Y[i];

  number xIndex = runningLayerCounts[layerIndex];
  var layer = LayerArrays.Layers[layerIndex];

  layer[xIndex++] = i;
  alreadyInLayers[i] = true;
  List < number > block;
  if (horizontalConstraints.BlockRootToBlock.TryGetValue(i, out block))
    for(var v in block) {
    if (alreadyInLayers[v]) continue;
    layer[xIndex++] = v;
    alreadyInLayers[v] = true;
  }
  runningLayerCounts[layerIndex] = xIndex;
}

        static Dictionary < number, List < number >> CreateComponentRootsToComponentsMap(Dictionary < number, number > nodesToVerticalComponentsRoots) {
  var d = new Dictionary<number, List<number>>();
  for(var kv in nodesToVerticalComponentsRoots) {
    number i = kv.Key;
    var root = kv.Value;
    List < number > component;
    if (!d.TryGetValue(root, out component)) {
      d[root] = component = new List<number>();
    }
    component.Add(i);
  }
  return d;
}

IEnumerable < IntPair > LiftLeftRightRelationsToComponentRoots(Dictionary < number, number > nodesToVerticalComponentsRoots) {
  for(var pair in horizontalConstraints.LeftRighInts)
  yield return new IntPair(GetFromDictionaryOrIdentical(nodesToVerticalComponentsRoots, pair.Item1),
    GetFromDictionaryOrIdentical(nodesToVerticalComponentsRoots, pair.Item2));
  for(var pair in horizontalConstraints.LeftRightIntNeibs)
  yield return new IntPair(GetFromDictionaryOrIdentical(nodesToVerticalComponentsRoots, pair.Item1),
    GetFromDictionaryOrIdentical(nodesToVerticalComponentsRoots, pair.Item2));
}

        static number GetFromDictionaryOrIdentical(Dictionary < number, number > d, number key) {
  number i;
  if (d.TryGetValue(key, out i))
    return i;
  return key;
}

// These blocks are connected components in the vertical constraints. They don't necesserely span consequent layers.
Dictionary < number, number > CreateVerticalComponents() {
  var vertGraph = new BasicGraphOnEdges<PolyIntEdge>(from pair in horizontalConstraints.VerticalInts select new PolyIntEdge(pair.Item1, pair.Item2));
  var verticalComponents = ConnectedComponentCalculator<PolyIntEdge>.GetComponents(vertGraph);
  var nodesToComponentRoots = new Dictionary<number, number>();
  for(var component in verticalComponents) {
    var ca = component.ToArray();
    if (ca.Length == 1)
      continue;
    number componentRoot = -1;
    for(var j in component) {
      if (componentRoot == -1)
        componentRoot = j;
      nodesToComponentRoots[j] = componentRoot;
    }
  }
  return nodesToComponentRoots;
}

void RestoreState() {
  LayerArrays.UpdateLayers(yetBestLayers);
}

#if TEST_MSAGL
void Show() {
  SugiyamaLayoutSettings.ShowDatabase(database);
}
#endif

#if TEST_MSAGL
        static void PrintPositions(number[] positions) {
  for (number j = 0; j < positions.Length; j++)
  System.Diagnostics.Debug.Write(" " + positions[j]);
  System.Diagnostics.Debug.WriteLine("");
}
#endif


void SortLayerBasedOnSolution(number[] layer, ISolverShell solver) {
  number length = layer.Length;
  var positions = new number[length];
  number k = 0;
  for(number v in layer)
  positions[k++] = solver.GetVariableResolvedPosition(v);

  Array.Sort(positions, layer);
  number i = 0;
  for(number v in layer)
  LayerArrays.X[v] = i++;
}

const number ConstrainedVarWeight = 10e6;
const number PositionOverBaricenterWeight = 5;

        static number NodeToBlockRootSoftOnLayerInfo(LayerInfo layerInfo, number node) {
  number root;
  return layerInfo.nodeToBlockRoot.TryGetValue(node, out root) ? root : node;
}

        static void AddGoalToKeepFlatEdgesShortOnBlockLevel(LayerInfo layerInfo, ISolverShell solver) {
  if (layerInfo != null)
    for(var couple in layerInfo.flatEdges) {
    number sourceBlockRoot = NodeToBlockRootSoftOnLayerInfo(layerInfo, couple.Item1);
    number targetBlockRoot = NodeToBlockRootSoftOnLayerInfo(layerInfo, couple.Item2);
    if (sourceBlockRoot != targetBlockRoot)
      solver.AddGoalTwoVariablesAreClose(sourceBlockRoot, targetBlockRoot);
  }
}

        static bool NodeIsConstrainedBelow(number v, LayerInfo layerInfo) {
  if (layerInfo == null)
    return false;
  return layerInfo.constrainedFromBelow.ContainsKey(v);
}

        static bool NodeIsConstrainedAbove(number v, LayerInfo layerInfo) {
  if (layerInfo == null)
    return false;
  return layerInfo.constrainedFromAbove.ContainsKey(v);
}

         static bool BelongsToNeighbBlock(number p, LayerInfo layerInfo) {
  return layerInfo != null && (layerInfo.nodeToBlockRoot.ContainsKey(p) || layerInfo.neigBlocks.ContainsKey(p));
  //p is a root of the block
}

        static bool NodesAreConstrainedBelow(number leftNode, number rightNode, LayerInfo layerInfo) {
  return NodeIsConstrainedBelow(leftNode, layerInfo) && NodeIsConstrainedBelow(rightNode, layerInfo);
}

        static bool NodesAreConstrainedAbove(number leftNode, number rightNode, LayerInfo layerInfo) {
  return NodeIsConstrainedAbove(leftNode, layerInfo) && NodeIsConstrainedAbove(rightNode, layerInfo);
}

number GetGapFromNodeNodesConstrainedBelow(number leftNode, number rightNode, LayerInfo layerInfo,
  number layerIndex) {
  number gap = SimpleGapBetweenTwoNodes(leftNode, rightNode);
  leftNode = layerInfo.constrainedFromBelow[leftNode];
  rightNode = layerInfo.constrainedFromBelow[rightNode];
  layerIndex--;
  layerInfo = layerInfos[layerIndex];
  if (layerIndex > 0 && NodesAreConstrainedBelow(leftNode, rightNode, layerInfo))
    return Math.Max(gap, GetGapFromNodeNodesConstrainedBelow(leftNode, rightNode, layerInfo, layerIndex));
  return Math.Max(gap, SimpleGapBetweenTwoNodes(leftNode, rightNode));
}

number GetGapFromNodeNodesConstrainedAbove(number leftNode, number rightNode, LayerInfo layerInfo,
  number layerIndex) {
  number gap = SimpleGapBetweenTwoNodes(leftNode, rightNode);
  leftNode = layerInfo.constrainedFromAbove[leftNode];
  rightNode = layerInfo.constrainedFromAbove[rightNode];
  layerIndex++;
  layerInfo = layerInfos[layerIndex];
  if (layerIndex < LayerArrays.Layers.Length - 1 && NodesAreConstrainedAbove(leftNode, rightNode, layerInfo))
    return Math.Max(gap, GetGapFromNodeNodesConstrainedAbove(leftNode, rightNode, layerInfo, layerIndex));
  return Math.Max(gap, SimpleGapBetweenTwoNodes(leftNode, rightNode));
}

number SimpleGapBetweenTwoNodes(number leftNode, number rightNode) {
  return database.anchors[leftNode].RightAnchor +
    NodeSeparation() + database.anchors[rightNode].LeftAnchor;
}

         static ISolverShell CreateSolver() {
  return new SolverShell();
}

void PrepareProperLayeredGraphAndFillLayerInfos() {
  layerInfos = new LayerInfo[NumberOfLayers];
  CreateProperLayeredGraph();
  CreateExtendedLayerArrays();
  FillBlockRootToBlock();
  FillLeftRightPairs();
  FillFlatEdges();
  FillAboveBelow();
  FillBlockRootToVertConstrainedNode();
}

void FillBlockRootToVertConstrainedNode() {
  for(LayerInfo layerInfo in layerInfos)
  for(number v in VertConstrainedNodesOfLayer(layerInfo)) {
    number blockRoot;
    if (TryGetBlockRoot(v, out blockRoot, layerInfo))
      layerInfo.blockRootToVertConstrainedNodeOfBlock[blockRoot] = v;
  }
}

        static bool TryGetBlockRoot(number v, out number blockRoot, LayerInfo layerInfo) {
  if (layerInfo.nodeToBlockRoot.TryGetValue(v, out blockRoot))
    return true;
  if (layerInfo.neigBlocks.ContainsKey(v)) {
    blockRoot = v;
    return true;
  }
  return false;
}

        static IEnumerable < number > VertConstrainedNodesOfLayer(LayerInfo layerInfo) {
  if (layerInfo != null) {
    for(number v in layerInfo.constrainedFromAbove.Keys)
    yield return v;
    for(number v in layerInfo.constrainedFromBelow.Keys)
    yield return v;
  }
}


void CreateExtendedLayerArrays() {
  var layeringExt = new number[numberOfNodesOfProperGraph];
  Array.Copy(initialLayering, layeringExt, initialLayering.Length);
  for(PolyIntEdge edge in ProperLayeredGraph.BaseGraph.Edges) {
    var ledges = (LayerEdge[])edge.LayerEdges;
    if (ledges != null && ledges.Length > 1) {
      number layerIndex = initialLayering[edge.Source] - 1;
      for (number i = 0; i < ledges.Length - 1; i++)
      layeringExt[ledges[i].Target] = layerIndex--;
    }
  }
  LayerArrays = new LayerArrays(layeringExt);
}

void CreateProperLayeredGraph() {
  IEnumerable < PolyIntEdge > edges = CreatePathEdgesOnIntGraph();
  var nodeCount = Math.Max(intGraph.NodeCount, BasicGraph<Node, PolyIntEdge>.VertexCount(edges));
  var baseGraph = new BasicGraph<Node, PolyIntEdge>(edges, nodeCount) { Nodes = intGraph.Nodes };
  ProperLayeredGraph = new ProperLayeredGraph(baseGraph);
}

IEnumerable < PolyIntEdge > CreatePathEdgesOnIntGraph() {
  numberOfNodesOfProperGraph = intGraph.NodeCount;
  var ret = new List<PolyIntEdge>();
  for(PolyIntEdge ie in intGraph.Edges) {
    if (initialLayering[ie.Source] > initialLayering[ie.Target]) {
      CreateLayerEdgesUnderIntEdge(ie);
      ret.Add(ie);
      if (horizontalConstraints.VerticalInts.Contains(new Tuple<number, number>(ie.Source, ie.Target)))
        verticalEdges.Add(ie);
    }
  }

  return ret;
}


void CreateLayerEdgesUnderIntEdge(PolyIntEdge ie) {
  number source = ie.Source;
  number target = ie.Target;

  number span = LayeredLayoutEngine.EdgeSpan(initialLayering, ie);
  ie.LayerEdges = new LayerEdge[span];
  Debug.Assert(span > 0);
  if (span == 1)
    ie.LayerEdges[0] = new LayerEdge(ie.Source, ie.Target, ie.CrossingWeight);
  else {
    ie.LayerEdges[0] = new LayerEdge(source, numberOfNodesOfProperGraph, ie.CrossingWeight);
    for (number i = 0; i < span - 2; i++)
    ie.LayerEdges[i + 1] = new LayerEdge(numberOfNodesOfProperGraph++, numberOfNodesOfProperGraph,
      ie.CrossingWeight);
    ie.LayerEdges[span - 1] = new LayerEdge(numberOfNodesOfProperGraph++, target, ie.CrossingWeight);
  }
}


void FillAboveBelow() {
  for(PolyIntEdge ie in verticalEdges) {
    for(LayerEdge le in ie.LayerEdges) {
      number upper = le.Source;
      number lower = le.Target;
      RegisterAboveBelowOnConstrainedUpperLower(upper, lower);
    }
  }

  for(var p in horizontalConstraints.VerticalInts)
  RegisterAboveBelowOnConstrainedUpperLower(p.Item1, p.Item2);
}

void RegisterAboveBelowOnConstrainedUpperLower(number upper, number lower) {
  LayerInfo topLayerInfo = GetOrCreateLayerInfo(LayerArrays.Y[upper]);
  LayerInfo bottomLayerInfo = GetOrCreateLayerInfo(LayerArrays.Y[lower]);

  topLayerInfo.constrainedFromBelow[upper] = lower;
  bottomLayerInfo.constrainedFromAbove[lower] = upper;
}

void FillFlatEdges() {
  for(PolyIntEdge edge in intGraph.Edges) {
    number l = initialLayering[edge.Source];
    if (l == initialLayering[edge.Target]) {
      GetOrCreateLayerInfo(l).flatEdges.Insert(new Tuple<number, number>(edge.Source, edge.Target));
    }
  }
}

void FillLeftRightPairs() {
  for(var p in horizontalConstraints.LeftRighInts) {
    LayerInfo layerInfo = GetOrCreateLayerInfo(initialLayering[p.Item1]);
    layerInfo.leftRight.Insert(p);
  }
}

// when we call this function we know that a LayerInfo is needed
LayerInfo GetOrCreateLayerInfo(number layerNumber) {
  LayerInfo layerInfo = layerInfos[layerNumber] ?? (layerInfos[layerNumber] = new LayerInfo());
  return layerInfo;
}

void FillBlockRootToBlock() {
  for(var p in horizontalConstraints.BlockRootToBlock) {
    LayerInfo layerInfo = GetOrCreateLayerInfo(initialLayering[p.Key]);
    layerInfo.neigBlocks[p.Key] = p.Value;
    for(number i in p.Value)
    layerInfo.nodeToBlockRoot[i] = p.Key;
  }
}
    }}
