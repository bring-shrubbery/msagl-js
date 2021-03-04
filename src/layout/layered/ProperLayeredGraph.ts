import { from, IEnumerable } from 'linq-to-typescript'
import { BasicGraph } from '../../structs/BasicGraph'
import { GeomNode } from '../core/geomNode'
import { LayerEdge } from './LayerEdge'
import { PolyIntEdge } from './polyIntEdge'

// a class representing a graph where every edge goes down only one layer
export class ProperLayeredGraph {
  // the underlying basic graph
  BaseGraph: BasicGraph<GeomNode, PolyIntEdge>
  virtualNodesToInEdges: LayerEdge[]
  virtualNodesToOutEdges: LayerEdge[]
  totalNumberOfNodes: number
  firstVirtualNode: number

  constructor(intGraph: BasicGraph<GeomNode, PolyIntEdge>) {
    this.Initialize(intGraph)
  }

  Initialize(intGraph: BasicGraph<GeomNode, PolyIntEdge>) {
    this.BaseGraph = intGraph

    if (this.BaseGraph.edges.length > 0) {
      const edgesGoingDown = from(this.BaseGraph.edges).where(
        (edge) => edge.LayerEdges != null,
      )
      this.totalNumberOfNodes = intGraph.NodeCount
      for (const edge of edgesGoingDown)
        for (const layerEdge of edge.LayerEdges) {
          const m = Math.max(layerEdge.Source, layerEdge.Target) + 1
          if (m > this.totalNumberOfNodes) this.totalNumberOfNodes = m
        }
    }

    if (ProperLayeredGraph.HasVirtualNodes(from(this.BaseGraph.edges))) {
      this.firstVirtualNode = from(
        this.BaseGraph.edges.filter(
          (e) => e.LayerEdges != null && e.LayerEdges.length > 1,
        ),
      )
        .selectMany((e) =>
          from(e.LayerEdges).where((le) => le.Source != e.Source),
        )
        .select((le) => le.Source)
        .min()
    } else {
      this.firstVirtualNode = this.BaseGraph.NodeCount
      this.totalNumberOfNodes = this.BaseGraph.NodeCount
    }

    this.virtualNodesToInEdges = new Array<LayerEdge>(
      this.totalNumberOfNodes - this.firstVirtualNode,
    )
    this.virtualNodesToOutEdges = new Array<LayerEdge>(
      this.totalNumberOfNodes - this.firstVirtualNode,
    )
    for (const e of this.BaseGraph.edges)
      if (e.LayerSpan > 0)
        for (const le of e.LayerEdges) {
          if (le.Target != e.Target)
            this.virtualNodesToInEdges[le.Target - this.firstVirtualNode] = le
          if (le.Source != e.Source)
            this.virtualNodesToOutEdges[le.Source - this.firstVirtualNode] = le
        }
  }

  static HasVirtualNodes(iCollection: IEnumerable<PolyIntEdge>): boolean {
    return iCollection.any(
      (edge) => edge.LayerEdges != null && edge.LayerEdges.length > 1,
    )
  }

  // ProperLayeredGraph(BasicGraph<IntEdge> intGraph, number[]layering) {
  //    this.baseGraph = intGraph;
  //    this.totalNumberOfNodes = intGraph.Nodes.Count + VirtualnodeCount(layering);

  //    this.virtualNodesToInEdges = new LayerEdge[totalNumberOfNodes - this.baseGraph.Nodes.Count];
  //    virtualNodesToOutEdges = new LayerEdge[totalNumberOfNodes - this.baseGraph.Nodes.Count];
  //    number currentVirtNode = intGraph.Nodes.Count;
  //    for (IntEdge e of baseGraph.Edges) {
  //        CreateLayerEdgesPath(e, layering, ref currentVirtNode);
  //        if (e.LayerSpan > 1)
  //            for (LayerEdge le of e.LayerEdges) {
  //                if (le.target != e.target)
  //                    this.virtualNodesToInEdges[le.target - NumOfOriginalNodes] = le;
  //                if (le.source != e.source)
  //                    virtualNodesToOutEdges[le.source - NumOfOriginalNodes] = le;
  //            }
  //    }
  //}

  // enumerates over the graph edges
  *edges_(): IterableIterator<LayerEdge> {
    for (const ie of this.BaseGraph.edges) {
      if (ie.LayerSpan > 0) for (const le of ie.LayerEdges) yield le
    }
  }
  get Edges(): IterableIterator<LayerEdge> {
    return this.edges_()
  }

  // enumerates over edges of a node
  *InEdges(node: number): IterableIterator<LayerEdge> {
    if (node < this.BaseGraph.NodeCount)
      //original node
      for (const e of this.BaseGraph.inEdges[node]) {
        if (e.Source != e.Target && e.LayerEdges != null)
          yield ProperLayeredGraph.LastEdge(e)
      }
    else if (node >= this.firstVirtualNode) yield this.InEdgeOfVirtualNode(node)
  }

  static LastEdge(e: PolyIntEdge): LayerEdge {
    return e.LayerEdges[e.LayerEdges.length - 1]
  }

  InEdgeOfVirtualNode(node: number): LayerEdge {
    return this.virtualNodesToInEdges[node - this.firstVirtualNode]
  }
  // enumerates over the node outcoming edges
  *OutEdges(node: number): IterableIterator<LayerEdge> {
    if (node < this.BaseGraph.NodeCount)
      //original node
      for (const e of this.BaseGraph.outEdges[node]) {
        if (e.Source != e.Target && e.LayerEdges != null)
          yield ProperLayeredGraph.FirstEdge(e)
      }
    else if (node >= this.firstVirtualNode)
      yield this.OutEdgeOfVirtualNode(node)
  }
  OutDegreeIsMoreThanOne(node: number) {
    if (node < this.BaseGraph.NodeCount)
      //original node
      return this.BaseGraph.outEdges[node].length > 1
    else return false
  }
  InDegreeIsMoreThanOne(node: number) {
    if (node < this.BaseGraph.NodeCount)
      //original node
      return this.BaseGraph.inEdges[node].length > 1
    else return false
  }
  OutEdgeOfVirtualNode(node: number): LayerEdge {
    return this.virtualNodesToOutEdges[node - this.firstVirtualNode]
  }

  static FirstEdge(e: PolyIntEdge): LayerEdge {
    return e.LayerEdges[0]
  }
  // returns the number of incoming edges for an edge
  InEdgesCount(node: number) {
    return this.RealInEdgesCount(node)
  }

  RealInEdgesCount(node: number) {
    return node < this.BaseGraph.NodeCount
      ? this.BaseGraph.inEdges[node].filter((e) => e.LayerEdges != null).length
      : 1
  }

  // returns the number of outcoming edges for an edge
  OutEdgesCount(node: number) {
    return this.RealOutEdgesCount(node)
  }

  RealOutEdgesCount(node: number) {
    return node < this.BaseGraph.NodeCount
      ? this.BaseGraph.outEdges[node].filter((l) => l.LayerEdges != null).length
      : 1
  }

  // returns the node count
  get NodeCount() {
    return this.totalNumberOfNodes
  }

  IsRealNode(node: number) {
    return node < this.BaseGraph.NodeCount
  }

  IsVirtualNode(node: number) {
    return !this.IsRealNode(node)
  }

  ReversedClone(): ProperLayeredGraph {
    const reversedEdges = this.CreateReversedEdges()
    return new ProperLayeredGraph(
      new BasicGraph<GeomNode, PolyIntEdge>(
        reversedEdges,
        this.BaseGraph.NodeCount,
      ),
    )
  }

  CreateReversedEdges(): PolyIntEdge[] {
    const ret = new Array<PolyIntEdge>()
    for (const e of this.BaseGraph.edges)
      if (!e.isSelfEdge()) ret.push(e.reversedClone())
    return ret
  }

  *Succ(node: number): IterableIterator<number> {
    for (const le of this.OutEdges(node)) yield le.Target
  }

  *Pred(node: number): IterableIterator<number> {
    for (const le of this.InEdges(node)) yield le.Source
  }
}
