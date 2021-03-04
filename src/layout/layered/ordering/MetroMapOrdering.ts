
// Following "Improving Layered Graph Layouts with Edge Bundling" and
// "Two polynomial time algorithms for the bundle-Line crossing minimization problem"

import { List } from "lodash";
import { Point } from "../../../math/geometry/point";
import { LayerArrays } from "../LayerArrays";
import { ProperLayeredGraph } from "../ProperLayeredGraph";

// Postprocessing minimizing crossings step that works on the layered graph
export class MetroMapOrdering {
  layerArrays: LayerArrays;
  nodePositions: Map<number, Point>
  properLayeredGraph: ProperLayeredGraph;

  constrainedOrdering(properLayeredGraph: ProperLayeredGraph, layerArrays: LayerArrays,
    nodePositions: Map<number, Point>) {
    this.properLayeredGraph = properLayeredGraph;
    this.layerArrays = layerArrays;
    this.nodePositions = nodePositions;
  }

  // Reorder only points having identical nodePositions
  static UpdateLayerArraysWithInitialPositions(properLayeredGraph: ProperLayeredGraph, layerArrays: LayerArrays,
    nodePositions: Map<number, Point>) {
    new MetroMapOrdering(properLayeredGraph, layerArrays, nodePositions).UpdateLayerArrays();
  }

  // Reorder virtual nodes between the same pair of real nodes
  static UpdateLayerArrays(properLayeredGraph: ProperLayeredGraph, layerArrays: LayerArrays) {
    const nodePositions = MetroMapOrdering.BuildInitialNodePositions(properLayeredGraph, layerArrays);
    MetroMapOrdering.UpdateLayerArraysWithInitialPositions(properLayeredGraph, layerArrays, nodePositions);
  }

  static BuildInitialNodePositions(properLayeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays): Map<number, Point> {
    var result = new Map<number, Point>();
    for (let i = 0; i < layerArrays.Layers.length; i++) {
      let prev = 0
      let curr = 0;
      while (curr < layerArrays.Layers[i].length) {
        while (curr < layerArrays.Layers[i].length &&
          properLayeredGraph.IsVirtualNode(layerArrays.Layers[i][curr])) curr++;
        for (let j = prev; j < curr; j++)
          result[layerArrays.Layers[i][j]] = new Point(i, prev);

        if (curr < layerArrays.Layers[i].length)
          result[layerArrays.Layers[i][curr]] = new Point(i, curr);
        curr++;
        prev = curr;
      }
    }

    return result;
  }

  UpdateLayerArrays() {
    //algo stuff here
    const ordering = this.CreateInitialOrdering();
    ordering = this.BuildOrdering(ordering);
    this.RestoreLayerArrays(ordering);
  }

  Map<Point, List <number>> CreateInitialOrdering() { // bug!!!
  var initialOrdering = new Map<Point, List<number>>();
  for (number i = 0; i < layerArrays.Layers.length; i++)
  for (number j = 0; j < layerArrays.Layers[i].length; j++) {
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
  for (number i = 0; i < layerArrays.Layers.length; i++)
  for (number j = 0; j < layerArrays.Layers[i].length; j++) {
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
  for (number i = 0; i < layerArrays.Layers.length; i++) {
    number pred = 0, tec = 0;
    while (tec < layerArrays.Layers[i].length) {
      while (tec < layerArrays.Layers[i].length &&
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
