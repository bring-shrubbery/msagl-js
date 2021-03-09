///  Follows the idea from Gansner etc 93, creating a special graph
///  for x-coordinates calculation

import {List} from 'lodash'
import {BasicGraphOnEdges} from '../../structs/basicGraphOnEdges'
import {Assert} from '../../utils/assert'
import {LayerArrays} from './LayerArrays'
import {PolyIntEdge} from './polyIntEdge'
import {ProperLayeredGraph} from './ProperLayeredGraph'

export class XLayoutGraph extends BasicGraphOnEdges<PolyIntEdge> {
  layeredGraph: ProperLayeredGraph

  // the result of layering
  layerArrays: LayerArrays

  // the result of layering
  virtualVerticesStart: number

  virtualVerticesEnd: number

  //  we have 0,,,virtualVerticesStart-1 - usual vertices
  // virtualVerticesStart,...,virtualVerticesEnd -virtual vertices
  // and virtualVirticesEnd+1, ...NumberOfVertices - nvertices
  weightMultiplierOfOriginalOriginal = 1

  // weight multiplier for edges with Defaults or n end and start
  weightMultOfOneVirtual = 3

  // weight multiplier for edges with only one virtual node
  weightMultiplierOfTwoVirtual = 8

  // weight multiplier for edges with two virtual nodes
  /* internal */ constructor(
    graph: BasicGraphOnEdges<PolyIntEdge>,
    layeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays,
    edges: PolyIntEdge[],
    nov: number,
  ) {
    super()
    this.SetEdges(edges, nov)
    this.virtualVerticesStart = graph.NodeCount
    this.virtualVerticesEnd = layeredGraph.NodeCount - 1
    this.layeredGraph = layeredGraph
    this.layerArrays = layerArrays
  }

  ///  <summary>
  ///  following Gansner etc 93 returning weight multplier bigger if there are virtual nodes
  ///  </summary>
  ///  <param name="edge"></param>
  ///  <returns></returns>
  EdgeWeightMultiplier(edge: PolyIntEdge): number {
    const s: number = edge.source
    const t: number = edge.target
    if (
      s < this.layeredGraph.NodeCount &&
      this.layerArrays.Y[s] == this.layerArrays.Y[t] &&
      this.layerArrays.X[s] == this.layerArrays.X[t] + 1
    ) {
      return 0
    }

    // this edge needed only for separation vertices in the same layer
    let k = 0
    Assert.assert(s >= this.layeredGraph.NodeCount)
    // check the graph on correctness`
    //     throw new InvalidOperationException();//"XLayout graph is incorrect");
    // here (s0,t0) is the edge of underlying graph
    let t0 = -1
    let s0 = -1
    // t0 is set to -1 to only avoid the warning
    // there are only two edges in graph.OutEdges(s)
    for (const intEdge of this.outEdges[s]) {
      if (s0 == -1) {
        s0 = intEdge.target
      } else {
        t0 = intEdge.target
      }
    }

    if (s0 >= this.virtualVerticesStart && s0 <= this.virtualVerticesEnd) {
      k++
    }

    if (t0 >= this.virtualVerticesStart && t0 <= this.virtualVerticesEnd) {
      k++
    }

    const ret =
      k == 0
        ? this.weightMultiplierOfOriginalOriginal
        : k == 1
        ? this.weightMultOfOneVirtual
        : this.weightMultiplierOfTwoVirtual
    return ret
  }

  //  caching edges weights
  SetEdgeWeights() {
    for (const intEdge of this.edges) {
      intEdge.weight = intEdge.weight * this.EdgeWeightMultiplier(intEdge)
    }
  }
}
