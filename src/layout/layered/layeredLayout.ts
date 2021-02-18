import {BasicGraph} from '../../structs/BasicGraph'
import {Graph} from '../../structs/graph'
import {Assert} from '../../utils/assert'
import {GeomObject} from '../core/geomObject'
import {Algorithm} from './../../utils/algorithm'
import {PolyIntEdge} from './polyIntEdge'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'
import {from} from 'linq-to-typescript'
import {Node} from '../../structs/node'
import {IEdge} from '../../structs/iedge'
import {CycleRemoval} from './CycleRemoval'
import {IntPairMap} from '../../utils/IntPairMap'
import {GeomNode} from '../core/geomNode'

export class Database {
  addFeedbackSet(feedbackSet: IEdge[]) {
    throw new Error('Method not implemented.')
  }
  constructor(n: number) {
    this.multiedges = new IntPairMap(n)
  }
  multiedges: IntPairMap<PolyIntEdge[]>
  registerOriginalEdgeInMultiedges(edge: PolyIntEdge) {
    let o = this.multiedges.get(edge.source, edge.target)
    if (o == null) {
      this.multiedges.set(edge.source, edge.target, (o = []))
    } else {
      console.log(o)
    }

    o.push(edge)
  }
}

export class LayeredLayout extends Algorithm {
  originalGraph: Graph
  sugiyamaSettings: SugiyamaLayoutSettings
  nodeIdToIndex: Map<string, number>
  intGraph: BasicGraph<GeomNode, PolyIntEdge>
  database: Database
  constructor(originalGraph: Graph, settings: SugiyamaLayoutSettings) {
    super()
    if (originalGraph == null) return
    this.originalGraph = originalGraph
    this.sugiyamaSettings = settings
    //enumerate the nodes - maps node indices to strings
    const nodes = from(originalGraph.nodes)
      .select((n) => GeomObject.getGeom(n))
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
        GeomObject.getGeom(edge),
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
    throw new Error()
  }
  cycleRemoval() {
    const verticalConstraints = this.sugiyamaSettings.verticalConstraints
    const feedbackSet: IEdge[] = verticalConstraints.isEmpty
      ? CycleRemoval.getFeedbackSet(this.intGraph)
      : verticalConstraints.getFeedbackSet(this.intGraph, this.nodeIdToIndex)

    this.database.addFeedbackSet(feedbackSet)
  }
}
