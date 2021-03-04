import { BasicGraph } from '../../structs/BasicGraph'
import { Graph } from '../../structs/graph'
import { Assert } from '../../utils/assert'
import { GeomObject } from '../core/geomObject'
import { Algorithm } from './../../utils/algorithm'
import { PolyIntEdge } from './polyIntEdge'
import { SugiyamaLayoutSettings } from './SugiyamaLayoutSettings'
import { from } from 'linq-to-typescript'
import { IEdge } from '../../structs/iedge'
import { CycleRemoval } from './CycleRemoval'
import { GeomNode } from '../core/geomNode'
import { Database } from './Database'
import { LayerArrays } from './LayerArrays'
import { GeomEdge } from '../core/geomEdge'
import { IntPairMap } from '../../utils/IntPairMap'
import { IntPair } from '../../utils/IntPair'
import { CancelToken } from '../../utils/cancelToken'
import { Balancing } from './Balancing'
import { LayerCalculator } from './layering/layerCalculator'
import { ConstrainedOrdering } from './ordering/ConstrainedOrdering'
import { ProperLayeredGraph } from './ProperLayeredGraph'
import { LayerEdge } from './LayerEdge'
import { Ordering } from './ordering/Ordering'
import { MetroMapOrdering } from './ordering/MetroMapOrdering'
import { NetworkSimplexForGeneralGraph } from './layering/NetworkSimplexForGeneralGraph'

function EdgeSpan(layers: number[], e: PolyIntEdge) {
  return layers[e.Source] - layers[e.Target]
}

export class LayeredLayout extends Algorithm {
  originalGraph: Graph
  sugiyamaSettings: SugiyamaLayoutSettings
  nodeIdToIndex: Map<string, number>
  IntGraph: BasicGraph<GeomNode, PolyIntEdge>
  database: Database
  engineLayerArrays: LayerArrays
  gluedDagSkeletonForLayering: BasicGraph<GeomNode, PolyIntEdge>
  constrainedOrdering: ConstrainedOrdering
  properLayeredGraph: ProperLayeredGraph
  LayersAreDoubled: boolean

  get verticalConstraints() {
    return this.sugiyamaSettings.verticalConstraints
  }
  get HorizontalConstraints() {
    return this.sugiyamaSettings.horizontalConstraints
  }

  constructor(
    originalGraph: Graph,
    settings: SugiyamaLayoutSettings,
    cancelToken: CancelToken,
  ) {
    super(cancelToken)
    if (originalGraph == null) return
    this.originalGraph = originalGraph
    this.sugiyamaSettings = settings
    //enumerate the nodes - maps node indices to strings
    const nodes = from(originalGraph.nodes)
      .select((n) => GeomObject.getGeom(n) as GeomNode)
      .toArray()
    this.nodeIdToIndex = new Map<string, number>()

    let index = 0
    for (const n of this.originalGraph.nodes) {
      this.nodeIdToIndex.set(n.id, index++)
      Assert.assert(!n.isGraph)
    }

    const intEdges = new Array<PolyIntEdge>(this.originalGraph.edgeCount)
    let i = 0
    for (const edge of this.originalGraph.edges) {
      Assert.assert(!(edge.source == null || edge.target == null))

      const intEdge = new PolyIntEdge(
        this.nodeIdToIndex.get(edge.source.id),
        this.nodeIdToIndex.get(edge.target.id),
        GeomObject.getGeom(edge) as GeomEdge,
      )

      intEdges[i++] = intEdge
    }

    this.IntGraph = new BasicGraph<GeomNode, PolyIntEdge>(
      intEdges,
      originalGraph.nodeCount,
    )
    this.IntGraph.nodes = nodes
    this.database = new Database(nodes.length)
    for (const e of this.IntGraph.edges)
      this.database.registerOriginalEdgeInMultiedges(e)

    this.cycleRemoval()
  }
  run() {
    if (this.originalGraph.nodeCount > 0) {
      this.engineLayerArrays = this.calculateLayers()

      if (!this.sugiyamaSettings.layeringOnly) this.RunPostLayering()
    } else {
      GeomObject.getGeom(this.originalGraph).boundingBox.setToEmpty()
    }
  }
  RunPostLayering() {
    throw new Error('Method not implemented.')
  }
  cycleRemoval() {
    const verticalConstraints = this.sugiyamaSettings.verticalConstraints
    const feedbackSet: IEdge[] = verticalConstraints.isEmpty
      ? CycleRemoval.getFeedbackSet(this.IntGraph)
      : verticalConstraints.getFeedbackSetExternal(
        this.IntGraph,
        this.nodeIdToIndex,
      )

    this.database.addFeedbackSet(feedbackSet)
  }
  calculateLayers(): LayerArrays {
    this.CreateGluedDagSkeletonForLayering()

    const layerArrays = this.CalculateLayerArrays()

    this.UpdateNodePositionData()

    return layerArrays
  }

  UpdateNodePositionData() {
    throw new Error('Method not implemented.')
  }

  ExtendLayeringToUngluedSameLayerVertices(p: number[]): number[] {
    const vc = this.verticalConstraints
    for (let i = 0; i < p.length; i++) p[i] = p[vc.nodeToRepr(i)]
    return p
  }

  YLayeringAndOrdering(layering: LayerCalculator): LayerArrays {
    let yLayers = layering.GetLayers()
    Balancing.Balance(
      this.gluedDagSkeletonForLayering,
      yLayers,
      this.GetNodeCountsOfGluedDag(),
      null,
    )
    yLayers = this.ExtendLayeringToUngluedSameLayerVertices(yLayers)

    let layerArrays = new LayerArrays(yLayers)
    if (
      this.HorizontalConstraints == null ||
      this.HorizontalConstraints.IsEmpty
    ) {
      layerArrays = this.YLayeringAndOrderingWithoutHorizontalConstraints(
        layerArrays,
      )

      return layerArrays
    }

    this.constrainedOrdering = new ConstrainedOrdering(
      this.originalGraph,
      this.IntGraph,
      layerArrays.Y,
      this.nodeIdToIndex,
      this.database,
      this.sugiyamaSettings,
    )
    this.constrainedOrdering.Calculate()
    this.properLayeredGraph = this.constrainedOrdering.ProperLayeredGraph

    // SugiyamaLayoutSettings.ShowDatabase(this.database);
    return this.constrainedOrdering.LayerArrays
  }

  /// Creating a proper layered graph, a graph where each
  /// edge goes only one layer down from the i+1-th layer to the i-th layer.

  CreateProperLayeredGraph(layering: number[]): LayerArrays {
    const n = layering.length
    let nOfVV = 0

    for (const e of this.database.SkeletonEdges()) {
      const span = EdgeSpan(layering, e)

      Assert.assert(span >= 0)

      if (span > 0) e.LayerEdges = new Array<LayerEdge>(span)
      let pe = 0 //offset in the string

      if (span > 1) {
        //we create span-2 dummy nodes and span new edges
        let d0 = n + nOfVV++

        let layerEdge = new LayerEdge(e.Source, d0, e.CrossingWeight, e.weight)

        e.LayerEdges[pe++] = layerEdge

        //create span-2 internal edges all from dummy nodes
        for (let j = 0; j < span - 2; j++) {
          d0++
          nOfVV++
          layerEdge = new LayerEdge(d0 - 1, d0, e.CrossingWeight, e.weight)
          e.LayerEdges[pe++] = layerEdge
        }

        layerEdge = new LayerEdge(d0, e.Target, e.CrossingWeight, e.weight)
        e.LayerEdges[pe] = layerEdge
      } else if (span == 1) {
        const layerEdge = new LayerEdge(
          e.Source,
          e.Target,
          e.CrossingWeight,
          e.weight,
        )
        e.LayerEdges[pe] = layerEdge
      }
    }

    const extendedVertexLayering = new Array<number>(
      this.originalGraph.nodeCount + nOfVV,
    )

    for (const e of this.database.SkeletonEdges())
      if (e.LayerEdges != null) {
        let l = layering[e.Source]
        extendedVertexLayering[e.Source] = l--
        for (const le of e.LayerEdges) extendedVertexLayering[le.Target] = l--
      } else {
        extendedVertexLayering[e.Source] = layering[e.Source]
        extendedVertexLayering[e.Target] = layering[e.Target]
      }

    this.properLayeredGraph = new ProperLayeredGraph(
      new BasicGraph<GeomNode, PolyIntEdge>(
        Array.from(this.database.SkeletonEdges()),
        layering.length,
      ),
    )
    this.properLayeredGraph.BaseGraph.nodes = this.IntGraph.nodes
    return new LayerArrays(extendedVertexLayering)
  }

  YLayeringAndOrderingWithoutHorizontalConstraints(
    layerArraysIn: LayerArrays,
  ): LayerArrays {
    const layerArrays = this.CreateProperLayeredGraph(layerArraysIn.Y)
    Ordering.OrderLayers(
      this.properLayeredGraph,
      layerArrays,
      this.originalGraph.nodeCount,
      this.sugiyamaSettings.AspectRatio != 0,
      this.sugiyamaSettings,
      this.cancelToken,
    )
    MetroMapOrdering.UpdateLayerArrays(this.properLayeredGraph, layerArrays)
    return layerArrays
  }

  CalculateYLayers(): LayerArrays {
    const layerArrays = this.YLayeringAndOrdering(
      new NetworkSimplexForGeneralGraph(
        this.gluedDagSkeletonForLayering,
        this.cancelToken,
      ),
    )
    if (this.constrainedOrdering != null) return layerArrays
    return this.InsertLayersIfNeeded(layerArrays)
  }

  InsertLayersIfNeeded(layerArrays: LayerArrays): LayerArrays {
    this.InsertVirtualEdgesIfNeeded(layerArrays);

    const r = this.AnalyzeNeedToInsertLayersAndHasMultiedges(layerArrays)

    if (r.needToInsertLayers) {
      LayerInserter.InsertLayers(ref properLayeredGraph, ref layerArrays, database, IntGraph);
      LayersAreDoubled = true;
    } else if (multipleEdges)
      EdgePathsInserter.InsertPaths(ref properLayeredGraph, ref layerArrays, database, IntGraph);

    RecreateIntGraphFromDataBase();

    return layerArrays;
  }

  InsertVirtualEdgesIfNeeded(layerArrays: LayerArrays) {
    if (this.constrainedOrdering != null) //if there are constraints we handle multiedges correctly
      return;

    foreach(var kv in database.Multiedges)
    // If there are an even number of multi-edges between two nodes then
    //  add a virtual edge in the multi-edge dict to improve the placement, but only in case when the edge goes down only one layer.         
    if (kv.Value.Count % 2 == 0 && layerArrays.Y[kv.Key.First] - 1 == layerArrays.Y[kv.Key.Second]) {
      var newVirtualEdge = new PolyIntEdge(kv.Key.First, kv.Key.Second);
      newVirtualEdge.Edge = new Edge();
      newVirtualEdge.IsVirtualEdge = true;
      kv.Value.Insert(kv.Value.Count / 2, newVirtualEdge);
      IntGraph.AddEdge(newVirtualEdge);
    }
  }


  AnalyzeNeedToInsertLayersAndHasMultiedges(layerArrays: LayerArrays): {
    needToInsertLayers: boolean,
    multipleEdges: boolean
  } {
    let needToInsertLayers = false
    let multipleEdges = false
    for (const ie of this.IntGraph.Edges)
      if (ie.HasLabel && layerArrays.Y[ie.Source] != layerArrays.Y[ie.Target]) {
        //if an edge is a flat edge then
        needToInsertLayers = true;
        break;
      }

    if (needToInsertLayers == false && constrainedOrdering == null)
      //if we have constrains the multiple edges have been already represented in layers
      foreach(var kv in database.Multiedges)
    if (kv.Value.Count > 1) {
      multipleEdges = true;
      if (layerArrays.Y[kv.Key.x] - layerArrays.Y[kv.Key.y] == 1) {
        //there is a multi edge spanning exactly one layer; unfortunately we need to introduce virtual vertices for 
        //the edges middle points 
        needToInsertLayers = true;
        break;
      }
    }
    return { needToInsertLayers: needToInsertLayers, multipleEdges: multipleEdges }
  }

  CalculateLayerArrays(): LayerArrays {
    const layerArrays = this.CalculateYLayers()

    if (this.constrainedOrdering == null) {
      this.DecideIfUsingFastXCoordCalculation(layerArrays)

      this.CalculateAnchorsAndYPositions(layerArrays)

      if (Brandes) this.CalculateXPositionsByBrandes(layerArrays)
      else this.CalculateXLayersByGansnerNorth(layerArrays)
    } else this.anchors = this.database.Anchors

    this.OptimizeEdgeLabelsLocations()

    this.engineLayerArrays = layerArrays
    this.StraightensShortEdges()

    const aspectRatio: number = this.CalculateOriginalGraphBox()

    if (this.sugiyamaSettings.AspectRatio != 0)
      this.StretchToDesiredAspectRatio(
        aspectRatio,
        this.sugiyamaSettings.AspectRatio,
      )

    return layerArrays
  }

  GluedDagSkeletonEdges(): PolyIntEdge[] {
    const ret = new IntPairMap<PolyIntEdge>(this.IntGraph.NodeCount)
    for (const p of this.database.Multiedges.keyValues()) {
      if (p[0].isDiagonal()) continue
      const e = this.verticalConstraints.gluedIntEdge(p[1][0])
      if (e.Source != e.Target) ret.set(e.Source, e.Target, e)
    }

    const gluedUpDownConstraints = from(
      this.verticalConstraints.gluedUpDownIntConstraints.iter(),
    ).select((p) => LayeredLayout.createUpDownConstrainedIntEdge(p, null))
    for (const e of gluedUpDownConstraints) ret.set(e.Source, e.Target, e)
    return Array.from(ret.values())
  }
  static createUpDownConstrainedIntEdge(
    intPair: IntPair,
    e: GeomEdge,
  ): PolyIntEdge {
    const intEdge = new PolyIntEdge(intPair.x, intPair.y, e)
    intEdge.weight = 0
    //we do not want the edge weight to contribute in to the sum but just take the constraint into account
    intEdge.separation = 1
    return intEdge
  }

  CreateGluedDagSkeletonForLayering() {
    this.gluedDagSkeletonForLayering = new BasicGraph<GeomNode, PolyIntEdge>(
      this.GluedDagSkeletonEdges(),
      this.originalGraph.nodeCount,
    )
    this.SetGluedEdgesWeights()
  }

  SetGluedEdgesWeights() {
    const gluedPairsToGluedEdge = new IntPairMap<PolyIntEdge>(
      this.IntGraph.NodeCount,
    )
    for (const ie of this.gluedDagSkeletonForLayering.edges)
      gluedPairsToGluedEdge.set(ie.Source, ie.Target, ie)

    for (const t of this.database.Multiedges.keyValues())
      if (t[0].x != t[0].y) {
        const gluedPair = this.verticalConstraints.gluedIntPair(t[0])
        if (gluedPair.x == gluedPair.y) continue
        const gluedIntEdge = gluedPairsToGluedEdge.get(gluedPair.x, gluedPair.y)
        for (const ie of t[1]) gluedIntEdge.weight += ie.weight
      }
  }

  GetNodeCountsOfGluedDag(): number[] {
    if (this.verticalConstraints.isEmpty) {
      return new Array<number>(this.IntGraph.NodeCount).fill(1)
    }
    return this.verticalConstraints.getGluedNodeCounts()
  }
}
