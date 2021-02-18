import { BasicGraph } from '../../structs/BasicGraph'
import { BasicGraphOnEdges } from '../../structs/basicGraphOnEdges';
import { Node } from '../../structs/node'
import { IntPair } from '../../utils/IntPair';
import { GeomNode } from '../core/geomNode'
import { CycleRemoval } from './CycleRemoval';
import { PolyIntEdge } from './polyIntEdge'

export class VerticalConstraintsForSugiyama {
  /*  getFeedbackSet(
      intGraph: BasicGraph<Node, PolyIntEdge>,
      nodeIdToIndex: Map<string, number>,
    ): import('../../structs/iedge').IEdge[] {
      throw new Error('Method not implemented.')
    }
    */
  // nodes that are pinned to the max layer
  maxLayerOfGeomGraph = new Set<GeomNode>();

  // nodes that are pinned to the min layer
  minLayerOfGeomGraph = new Set<GeomNode>();

  // set of couple of nodes belonging to the same layer
  sameLayerConstraints = new Array<[GeomNode, GeomNode]>()

  upDownConstraints = new Array<[GeomNode, GeomNode]>();

  // pins a node to max layer
  pinNodeToMaxLayer(node: GeomNode) {
    this.maxLayerOfGeomGraph.add(node);
  }

  // pins a node to min layer
  pinNodeToMinLayer(node: GeomNode) {
    this.minLayerOfGeomGraph.add(node);
  }

  isEmpty() {
    return this.maxLayerOfGeomGraph.size == 0 && this.minLayerOfGeomGraph.size == 0 && this.sameLayerConstraints.length == 0 && this.upDownConstraints.length == 0;
  }

  clear() {
    this.maxLayerOfGeomGraph.clear();
    this.minLayerOfGeomGraph.clear();
    this.sameLayerConstraints = []
    this.upDownConstraints = []
  }

  gluedUpDownIntConstraints = new Array<IntPair>()

  nodeIdToIndex: Map<string, number>
  intGraph: BasicGraph<GeomNode, PolyIntEdge>
  // this graph is obtained from intGraph by glueing together same layer vertices
  gluedIntGraph: BasicGraphOnEdges<IntPair>
  maxRepresentative: number;
  minRepresentative: number;
  // Maps each node participating in same layer relation to its representative on the layer.
  sameLayerDictionaryOfRepresentatives = new Map<number, number>();
  representativeToItsLayer = new Map<number, number[]>();
  getFeedbackSet(intGraph: BasicGraph<GeomNode, PolyIntEdge>, nodeIdToIndex: Map<string, number>) {
    this.nodeIdToIndex = nodeIdToIndex
    this.intGraph = intGraph
    this.maxRepresentative = -1;
    this.minRepresentative = -1;
    this.createIntegerConstraints();
    this.glueTogetherSameConstraintsMaxAndMin();
    this.addMaxMinConstraintsToGluedConstraints();
    this.removeCyclesFromGluedConstraints();
    return this.getFeedbackSet();
  }

    removeCyclesFromGluedConstraints() {
        const graph = (new BasicGraphOnEdges<IntPair>()).mkGraphEdgesN(this.gluedUpDownIntConstraints, this.intGraph.nodeCount)
    const feedbackSet = CycleRemoval.getFeedbackSetWithConstraints( graph, null)
    //feedbackSet contains all glued constraints making constraints cyclic
    for (const p of feedbackSet) {
       this.gluedUpDownIntConstraints.remove(p)
    }
  }

  private void AddMaxMinConstraintsToGluedConstraints() {
    if (this.maxRepresentative != -1)
      for (number i = 0; i < this.intGraph.NodeCount; i++) {
      number j = NodeToRepr(i);
      if (j != maxRepresentative)
        GluedUpDownIntConstraints.Insert(new IntPair(maxRepresentative, j));
    }

    if (this.minRepresentative != -1)
      for (number i = 0; i < this.intGraph.NodeCount; i++) {
      int j = NodeToRepr(i);
      if (j != minRepresentative)
        GluedUpDownIntConstraints.Insert(new IntPair(j, minRepresentative));
    }
  }

  private void GlueTogetherSameConstraintsMaxAndMin() {
    CreateDictionaryOfSameLayerRepresentatives();
    GluedUpDownIntConstraints = new Set<IntPair>(from p in UpDownInts select GluedIntPair(p));
  }

  internal IntPair GluedIntPair(Tuple <number, number > p) {
  return new IntPair(NodeToRepr(p.Item1), NodeToRepr(p.Item2));
}
  
    private IntPair GluedIntPair(PolyIntEdge p) {
  return new IntPair(NodeToRepr(p.Source), NodeToRepr(p.Target));
}

internal IntPair GluedIntPair(IntPair p) {
  return new IntPair(NodeToRepr(p.First), NodeToRepr(p.Second));
}

internal PolyIntEdge GluedIntEdge(PolyIntEdge intEdge) {
  int sourceRepr = NodeToRepr(intEdge.Source);
  int targetRepr = NodeToRepr(intEdge.Target);
  PolyIntEdge ie = new PolyIntEdge(sourceRepr, targetRepr);
  ie.Separation = intEdge.Separation;
  ie.Weight = 0;
  ie.Edge = intEdge.Edge;
  return ie;
}


internal int NodeToRepr(int node) {
  number repr;
  if (this.sameLayerDictionaryOfRepresentatives.TryGetValue(node, out repr))
    return repr;
  return node;
}
  
    private void CreateDictionaryOfSameLayerRepresentatives() {
  BasicGraphOnEdges < IntPair > graphOfSameLayers = CreateGraphOfSameLayers();
  foreach(var comp in ConnectedComponentCalculator<IntPair>.GetComponents(graphOfSameLayers))
  GlueSameLayerNodesOfALayer(comp);
}
  
    private BasicGraphOnEdges < IntPair > CreateGraphOfSameLayers() {
  return new BasicGraphOnEdges<IntPair>(CreateEdgesOfSameLayers(), this.intGraph.NodeCount);
}
  
    private IEnumerable < IntPair > CreateEdgesOfSameLayers() {
  List < IntPair > ret = new List<IntPair>();
  if (maxRepresentative != -1)
    ret.AddRange(from v in maxLayerInt where v != maxRepresentative select new IntPair(maxRepresentative, v));
  if (minRepresentative != -1)
    ret.AddRange(from v in minLayerInt where v != minRepresentative select new IntPair(minRepresentative, v));
  ret.AddRange(from couple in SameLayerInts select new IntPair(couple.Item1, couple.Item2));
  return ret;
}
    // maps all nodes of the component to one random representative
    private void GlueSameLayerNodesOfALayer(IEnumerable < number > sameLayerNodes) {
  if (sameLayerNodes.Count<number>() > 1) {
    number representative = -1;
    if (ComponentsIsMaxLayer(sameLayerNodes))
      foreach(number v in sameLayerNodes)
    this.sameLayerDictionaryOfRepresentatives[v] = representative = maxRepresentative;
            else if (ComponentIsMinLayer(sameLayerNodes))
      foreach(number v in sameLayerNodes)
    sameLayerDictionaryOfRepresentatives[v] = representative = minRepresentative;
            else {
      foreach(number v in sameLayerNodes) {
        if (representative == -1)
          representative = v;
        sameLayerDictionaryOfRepresentatives[v] = representative;
      }
    }
    this.representativeToItsLayer[representative] = sameLayerNodes;
  }
}
  
    private bool ComponentIsMinLayer(IEnumerable < number > component) {
  return component.Contains<number>(this.minRepresentative);
}
  
    private bool ComponentsIsMaxLayer(IEnumerable < number > component) {
  return component.Contains<number>(this.maxRepresentative);
}

List < number > maxLayerInt = new List<number>();
List < number > minLayerInt = new List<number>();

sameLayerInts = new Array<[number, number]>();

// contains also pinned max and min pairs

upDownInts = new Array<[number, number]>();

  
    createIntegerConstraints() {
  this.createMaxIntConstraints();
  this.createMinIntConstraints();
  this.createUpDownConstraints();
  this.CreateSameLayerConstraints();
}
  
    private void CreateSameLayerConstraints() {
  this.SameLayerInts = CreateIntConstraintsFromStringCouples(this.sameLayerConstraints);
}
  
    private void CreateUpDownConstraints() {
  this.UpDownInts = CreateIntConstraintsFromStringCouples(this.upDownConstraints);
}
  
    private List < Tuple < number, number >> CreateIntConstraintsFromStringCouples(Set < Tuple < GeomNode, GeomNode >> set)
{
  return new List<Tuple<number, number>>(from couple in set
                                          let t = new Tuple<number, number>(NodeIndex(couple.Item1), NodeIndex(couple.Item2))
                                          where t.Item1 != -1 && t.Item2 != -1
                                          select t);
}
  
    private void CreateMinIntConstraints() {
  this.minLayerInt = CreateIntConstraintsFromExtremeLayer(this.minLayerOfGeomGraph);
  if (minLayerInt.length > 0)
    this.minRepresentative = minLayerInt[0];
}
  
    private void CreateMaxIntConstraints() {
  this.maxLayerInt = CreateIntConstraintsFromExtremeLayer(this.maxLayerOfGeomGraph);
  if (maxLayerInt.length > 0)
    this.maxRepresentative = maxLayerInt[0];
}
  
    private List < number > CreateIntConstraintsFromExtremeLayer(Set < GeomNode > setOfNodes) {
  return new List<number>(from node in setOfNodes let index = NodeIndex(node) where index != -1 select index);
}
number NodeIndex(GeomNode node) {
  number index;
  if (this.nodeIdToIndex.TryGetValue(node, out index))
    return index;
  return -1;
}
    private IEnumerable < IEdge > GetFeedbackSet() {
  this.gluedIntGraph = CreateGluedGraph();
  return UnglueIntPairs(CycleRemoval<IntPair>.GetFeedbackSetWithConstraints(gluedIntGraph, this.GluedUpDownIntConstraints));//avoiding lazy evaluation
}
  
    private IEnumerable < IEdge > UnglueIntPairs(IEnumerable < IEdge > gluedEdges) {
  foreach(IEdge gluedEdge in gluedEdges)
  foreach(IEdge ungluedEdge in UnglueEdge(gluedEdge))
  yield return ungluedEdge;

}
  
    private IEnumerable < IEdge > UnglueEdge(IEdge gluedEdge) {
  foreach(number source in UnglueNode(gluedEdge.Source))
  foreach(PolyIntEdge edge in intGraph.OutEdges(source))
  if (NodeToRepr(edge.Target) == gluedEdge.Target)
    yield return edge;
}
  
    private BasicGraphOnEdges < IntPair > CreateGluedGraph() {
  return new BasicGraphOnEdges<IntPair>(new Set<IntPair>(from edge in this.intGraph.Edges select GluedIntPair(edge)), this.intGraph.NodeCount);
}


IEnumerable < number > UnglueNode(number node) {
  IEnumerable < number > layer;
  if (this.representativeToItsLayer.TryGetValue(node, out layer))
    return layer;
  return new number[] { node };
}


internal number[] GetGluedNodeCounts() {
  number[] ret = new number[this.nodeIdToIndex.length];
  for (number node = 0; node < ret.Length; node++)
  ret[NodeToRepr(node)]++;
  return ret;
}
  
}
