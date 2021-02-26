
// Following "Improving Layered Graph Layouts with Edge Bundling" and
// "Two polynomial time algorithms for the bundle-Line crossing minimization problem"
// Postprocessing minimizing crossings step that works on the layered graph
export class MetroMapOrdering {
  layerArrays: LayerArrays;
  nodePositions: Dictionary<number, Point>
  properLayeredGraph: ProperLayeredGraph;

  constrainedOrdering(properLayeredGraph: ProperLayeredGraph, layerArrays: LayerArrays,
    Map<number, Point> nodePositions) {
  this.properLayeredGraph = properLayeredGraph;
  this.layerArrays = layerArrays;
  this.nodePositions = nodePositions;
}

        // Reorder only points having identical nodePositions
         static void UpdateLayerArrays(ProperLayeredGraph properLayeredGraph, LayerArrays layerArrays,
  Map < number, Point > nodePositions) {
  new MetroMapOrdering(properLayeredGraph, layerArrays, nodePositions).UpdateLayerArrays();
}

        // Reorder virtual nodes between the same pair of real nodes
         static void UpdateLayerArrays(ProperLayeredGraph properLayeredGraph, LayerArrays layerArrays) {
  Map < number, Point > nodePositions = BuildInitialNodePositions(properLayeredGraph, layerArrays);
  UpdateLayerArrays(properLayeredGraph, layerArrays, nodePositions);
}

        static Map < number, Point > BuildInitialNodePositions(ProperLayeredGraph properLayeredGraph,
  LayerArrays layerArrays) {
  var result = new Map<number, Point>();
  for (number i = 0; i < layerArrays.Layers.Length; i++) {
    number prev = 0, curr = 0;
    while (curr < layerArrays.Layers[i].Length) {
      while (curr < layerArrays.Layers[i].Length &&
        properLayeredGraph.IsVirtualNode(layerArrays.Layers[i][curr])) curr++;
      for (number j = prev; j < curr; j++)
      result[layerArrays.Layers[i][j]] = new Point(i, prev);

      if (curr < layerArrays.Layers[i].Length)
        result[layerArrays.Layers[i][curr]] = new Point(i, curr);
      curr++;
      prev = curr;
    }
  }

  return result;
}

UpdateLayerArrays() {
  //algo stuff here
  Map < Point, List < number >> ordering = CreateInitialOrdering();
  ordering = BuildOrdering(ordering);
  RestoreLayerArrays(ordering);
}

Map < Point, List < number >> CreateInitialOrdering() { // bug!!!
  var initialOrdering = new Map<Point, List<number>>();
  for (number i = 0; i < layerArrays.Layers.Length; i++)
  for (number j = 0; j < layerArrays.Layers[i].Length; j++) {
    number node = layerArrays.Layers[i][j];
    if (!initialOrdering.ContainsKey(nodePositions[node]))
      initialOrdering[nodePositions[node]] = new List<number>();
    initialOrdering[nodePositions[node]].Add(node);
  }

  return initialOrdering;
}


Map < Point, List < number >> BuildOrdering(Map < Point, List < number >> initialOrdering) {
  //run through nodes points and build order
  var result = new Map<Point, List<number>>();
  var reverseOrder = new Map<number, number>();
  for (number i = 0; i < layerArrays.Layers.Length; i++)
  for (number j = 0; j < layerArrays.Layers[i].Length; j++) {
    number node = layerArrays.Layers[i][j];

    //already processed
    if (result.ContainsKey(nodePositions[node])) continue;

    result[nodePositions[node]] = BuildNodeOrdering(initialOrdering[nodePositions[node]], reverseOrder);
  }

  return result;
}

List < number > BuildNodeOrdering(List < number > nodeOrdering, Map < number, number > inverseToOrder) {
  List < number > result = nodeOrdering;

  result.Sort(Comparison(inverseToOrder));

  for (number i = 0; i < result.Count; i++)
  inverseToOrder[result[i]] = i;
  return result;
}

Comparison < number > Comparison(Map < number, number > inverseToOrder) {
  return delegate(number node1, number node2) {
    Debug.Assert(properLayeredGraph.IsVirtualNode(node1) &&
      properLayeredGraph.IsVirtualNode(node2));

    number succ1 = properLayeredGraph.Succ(node1).ElementAt(0);
    number succ2 = properLayeredGraph.Succ(node2).ElementAt(0);
    number pred1 = properLayeredGraph.Pred(node1).ElementAt(0);
    number pred2 = properLayeredGraph.Pred(node2).ElementAt(0);

    Point succPoint1 = nodePositions[succ1];
    Point succPoint2 = nodePositions[succ2];
    Point predPoint1 = nodePositions[pred1];
    Point predPoint2 = nodePositions[pred2];

    if (succPoint1 != succPoint2) {
      if (predPoint1 != predPoint2)
        return predPoint1.CompareTo(predPoint2);
      return succPoint1.CompareTo(succPoint2);
    }
    if (properLayeredGraph.IsVirtualNode(succ1)) {
      if (predPoint1 != predPoint2)
        return predPoint1.CompareTo(predPoint2);

      number o1 = inverseToOrder[succ1];
      number o2 = inverseToOrder[succ2];
      Debug.Assert(o1 != -1 && o2 != -1);
      return (o1.CompareTo(o2));
    }
    while (nodePositions[pred1] == nodePositions[pred2] &&
      properLayeredGraph.IsVirtualNode(pred1)) {
      pred1 = properLayeredGraph.Pred(pred1).ElementAt(0);
      pred2 = properLayeredGraph.Pred(pred2).ElementAt(0);
    }

    if (nodePositions[pred1] == nodePositions[pred2])
      return node1.CompareTo(node2);
    return nodePositions[pred1].CompareTo(nodePositions[pred2]);
  };
}

RestoreLayerArrays(Map < Point, List < number >> ordering) {
  for (number i = 0; i < layerArrays.Layers.Length; i++) {
    number pred = 0, tec = 0;
    while (tec < layerArrays.Layers[i].Length) {
      while (tec < layerArrays.Layers[i].Length &&
        nodePositions[layerArrays.Layers[i][pred]] == nodePositions[layerArrays.Layers[i][tec]])
        tec++;
      for (number j = pred; j < tec; j++)
      layerArrays.Layers[i][j] = ordering[nodePositions[layerArrays.Layers[i][j]]][j - pred];
      pred = tec;
    }
  }

  layerArrays.UpdateXFromLayers();
}
    }
