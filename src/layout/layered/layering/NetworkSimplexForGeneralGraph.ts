import {BasicGraph} from '../../../structs/BasicGraph'
import {BasicGraphOnEdges} from '../../../structs/basicGraphOnEdges'
import {CancelToken} from '../../../utils/cancelToken'
import {GeomNode} from '../../core/geomNode'
import {PolyIntEdge} from '../polyIntEdge'
import {LayerCalculator} from './layerCalculator'
import {NetworkSimplex} from './NetworkSimplex'
export class NetworkSimplexForGeneralGraph implements LayerCalculator {
  graph: BasicGraphOnEdges<PolyIntEdge>
  // a place holder for the cancel flag
  Cancel: CancelToken

  GetLayers(): number[] {
    return new NetworkSimplex(this.graph, this.Cancel).GetLayers()
  }

  ShrunkComponent(
    dictionary: Map<number, number>,
  ): BasicGraph<GeomNode, PolyIntEdge> {
    const edges: PolyIntEdge[] = []
    for (const p of dictionary) {
      const v = p[0]
      const newEdgeSource = p[1]
      for (const e of this.graph.outEdges[v]) {
        const pe = new PolyIntEdge(
          newEdgeSource,
          dictionary.get(e.target),
          e.edge,
        )
        pe.separation = e.separation
        pe.weight = e.weight
        edges.push(pe)
      }
    }
    return new BasicGraph<GeomNode, PolyIntEdge>(edges, dictionary.size)
  }

  private UniteLayerings(
    layerings: number[][],
    mapToComponenents: Array<Map<number, number>>,
  ): number[] {
    const ret = new Array<number>(this.graph.nodeCount)
    for (let i = 0; i < layerings.length; i++) {
      const layering = layerings[i]
      const mapToComp = mapToComponenents[i]
      //no optimization at the moment - just map the layers back
      const reverseMap = new Array<number>(mapToComp.size)
      for (const p of mapToComp) reverseMap[p[1]] = p[0]

      for (let j = 0; j < layering.length; j++) ret[reverseMap[j]] = layering[j]
    }
    return ret
  }

  constructor(
    graph: BasicGraph<GeomNode, PolyIntEdge>,
    cancelObject: CancelToken,
  ) {
    this.graph = graph
    this.Cancel = cancelObject
  }
}

function GetMapsToComponent(
  comps: Array<Array<number>>,
): Array<Map<number, number>> {
  const ret = new Array<Map<number, number>>()
  for (const comp of comps) ret.push(MapForComp(comp))
  return ret
}

function MapForComp(comp: number[]): Map<number, number> {
  let i = 0
  const map = new Map<number, number>()
  for (const v of comp) map.set(v, i++)
  return map
}
