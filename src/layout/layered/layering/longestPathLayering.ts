import { LayerCalculator } from './layerCalculator'
import { NetworkEdge } from './networkEdge'
import { BasicGraphOnEdges } from './../basicGraphOnEdges'
import { PolyIntEdge } from './../polyIntEdge'
// Layering the DAG by longest path
export class LongestPathLayering implements LayerCalculator {

  graph: BasicGraphOnEdges<NetworkEdge>

  getLayers() {
    //sort the vertices in topological order
    int[] topoOrder = PolyIntEdge.getOrder(this.graph);
    int[] layering = new int[graph.NodeCount];

    //going backward from leaves
    int k = graph.NodeCount;
    while (k-- > 0) {
      int v = topoOrder[k];
      foreach(PolyIntEdge e in graph.InEdges(v)) {
        int u = e.Source;
        int l = layering[v] + e.Separation;
        if (layering[u] < l)
          layering[u] = l;
      }
    }
    return layering;

  }

  internal LongestPathLayering(BasicGraphOnEdges <PolyIntEdge > graph) {
  this.graph = graph;
}

}

