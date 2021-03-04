import { from, IEnumerable } from 'linq-to-typescript';
import { get, set, Dictionary, map } from 'lodash';
import { BasicGraph } from '../../../structs/BasicGraph';
import { BasicGraphOnEdges } from '../../../structs/basicGraphOnEdges';
import { CancelToken } from '../../../utils/cancelToken';
import { GeomNode } from '../../core/geomNode';
import { PolyIntEdge } from '../polyIntEdge';
import { ConnectedComponentCalculator } from '../VerticalConstraintsForSugiyama';
import { LayerCalculator } from './layerCalculator'
import { NetworkEdge } from './networkEdge';
import { NetworkSimplex } from './NetworkSimplex';
export class NetworkSimplexForGeneralGraph implements LayerCalculator {
  graph: BasicGraphOnEdges<PolyIntEdge>
  // a place holder for the cancel flag
  Cancel: CancelToken



  GetLayers(): number[] {
    const comps = ConnectedComponentCalculator.GetComponents(this.graph);
    if (comps.length == 1) {
      const ns = new NetworkSimplex(this.mkNetworkGraph(this.graph), this.Cancel);
      return ns.GetLayers();
    }
    const mapToComponenents: Map<number, number>[] = this.GetMapsToComponent(comps);
    const layerings = new Array<number[]>(comps.length);

    for (let i = 0; i < comps.length; i++) {
      const shrunkedComp = this.ShrunkComponent(mapToComponenents[i]);
      const ns = new NetworkSimplex(shrunkedComp, this.Cancel);
      layerings[i] = ns.GetLayers();
    }

    return this.UniteLayerings(layerings, mapToComponenents);
  }

  mkNetworkGraph(graph: BasicGraphOnEdges<PolyIntEdge>): BasicGraphOnEdges<NetworkEdge> {
    throw new Error('Method not implemented.');
  }

  ShrunkComponent(dictionary: Map<number, number>): BasicGraph<GeomNode, PolyIntEdge> {
    return new BasicGraph<GeomNode, PolyIntEdge>(
      from p of dictionary
                let v = p.Key
                let newEdgeSource = p.Value
                from e of graph.OutEdges(v)
                select new PolyIntEdge(newEdgeSource, dictionary[e.Target]) { Separation = e.Separation, Weight = e.Weight },
      dictionary.Count);
  }

  private UniteLayerings(layerings: number[][], mapToComponenents: Array<Map<number, number>>): number[] {
    const ret = new Array<number>(this.graph.NodeCount)
    for (number i = 0; i < layerings.Length; i++) {
      number[] layering = layerings[i];
      Dictionary < number, number > mapToComp = mapToComponenents[i];
      //no optimization at the moment - just map the layers back
      number[] reverseMap = new number[mapToComp.Count];
      for (var p of mapToComp)
        reverseMap[p.Value] = p.Key;

      for (number j = 0; j < layering.Length; j++)
      ret[reverseMap[j]] = layering[j];
    }
    return ret;
  }

  static GetMapsToComponent(comps: Array<Array<number>>): Array<Map<number, number>> {
    Array < Map < number, number >> ret = new Array<Map<number, number>>();
    for (var comp of comps)
      ret.Add(MapForComp(comp));
    return ret;
  }

  static MapForComp(comp: IEnumerable<number>): Map<number, number> {
    let i = 0;
    const map = new Map<number, number>();
    for (const v of comp)
      map[v] = i++;
    return map;
  }


  constructor(graph: BasicGraph<GeomNode, PolyIntEdge>, cancelObject: CancelToken) {
    this.graph = graph;
    this.Cancel = cancelObject;
  }

}

