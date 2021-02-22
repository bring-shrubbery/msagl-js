import {BasicGraph} from '../../structs/BasicGraph'
import {Graph} from '../../structs/graph'
import {Assert} from '../../utils/assert'
import {GeomObject} from '../core/geomObject'
import {Algorithm} from './../../utils/algorithm'
import {PolyIntEdge} from './polyIntEdge'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'
import {from} from 'linq-to-typescript'
import {IEdge} from '../../structs/iedge'
import {CycleRemoval} from './CycleRemoval'
import {GeomNode} from '../core/geomNode'
import {Database} from './Database'
import {LayerArrays} from './LayerArrays'
import {GeomEdge} from '../core/geomEdge'
import {IntPairMap} from '../../utils/IntPairMap'
import {IntPair} from '../../utils/IntPair'

export class LayeredLayout extends Algorithm {
  originalGraph: Graph
  sugiyamaSettings: SugiyamaLayoutSettings
  nodeIdToIndex: Map<string, number>
  intGraph: BasicGraph<GeomNode, PolyIntEdge>
  database: Database
  engineLayerArrays: LayerArrays
  gluedDagSkeletonForLayering: BasicGraph<GeomNode, PolyIntEdge>

  get verticalConstraints() {
    return this.sugiyamaSettings.verticalConstraints
  }

  constructor(originalGraph: Graph, settings: SugiyamaLayoutSettings) {
    super()
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

    this.intGraph = new BasicGraph<GeomNode, PolyIntEdge>(
      intEdges,
      originalGraph.nodeCount,
    )
    this.intGraph.nodes = nodes
    this.database = new Database(nodes.length)
    for (const e of this.intGraph.edges)
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
    const feedbackSet: IEdge[] = verticalConstraints.isEmpty()
      ? CycleRemoval.getFeedbackSet(this.intGraph)
      : verticalConstraints.getFeedbackSetExternal(
          this.intGraph,
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
  CalculateLayerArrays(): LayerArrays {
    throw new Error('Method not implemented.')
  }

  GluedDagSkeletonEdges(): PolyIntEdge[] {
    const ret = new IntPairMap<PolyIntEdge>(this.intGraph.nodeCount)
    for (const p of this.database.multiedges.keyValues()) {
      if (p[0].isDiagonal()) continue
      const e = this.verticalConstraints.gluedIntEdge(p[1][0])
      if (e.source != e.target) ret.set(e.source, e.target, e)
    }

    const gluedUpDownConstraints = from(
      this.verticalConstraints.gluedUpDownIntConstraints.iter(),
    ).select((p) => LayeredLayout.createUpDownConstrainedIntEdge(p, null))
    for (const e of gluedUpDownConstraints) ret.set(e.source, e.target, e)
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
      this.intGraph.nodeCount,
    )
    for (const ie of this.gluedDagSkeletonForLayering.edges)
      gluedPairsToGluedEdge.set(ie.source, ie.target, ie)

    for (const t of this.database.multiedges.keyValues())
      if (t[0].x != t[0].y) {
        const gluedPair = this.verticalConstraints.gluedIntPair(t[0])
        if (gluedPair.x == gluedPair.y) continue
        const gluedIntEdge = gluedPairsToGluedEdge.get(gluedPair.x, gluedPair.y)
        for (const ie of t[1]) gluedIntEdge.weight += ie.weight
      }
  }
}
