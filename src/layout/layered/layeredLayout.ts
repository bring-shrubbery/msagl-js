import {BasicGraph} from '../../structs/BasicGraph'
import {Graph} from '../../structs/graph'
import {Assert} from '../../utils/assert'
import {GeomObject} from '../core/geomObject'
import {Algorithm} from './../../utils/algorithm'
import {PolyIntEdge} from './polyIntEdge'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'
import {from} from 'linq-to-typescript'
import {Node} from '../../structs/node'
export class Database {
  registerOriginalEdgeInMultiedges(e: PolyIntEdge) {
    throw new Error('Method not implemented.')
  }
}

export class LayeredLayout extends Algorithm {
  originalGraph: Graph
  sugiyamaSettings: SugiyamaLayoutSettings
  nodeIdToIndex: Map<string, number>
  intGraph: BasicGraph<Node, PolyIntEdge>
  database: Database
  constructor(originalGraph: Graph, settings: SugiyamaLayoutSettings) {
    super()
    if (originalGraph == null) return
    this.originalGraph = originalGraph
    this.sugiyamaSettings = settings
    //enumerate the nodes - maps node indices to strings
    const nodes = from(originalGraph.nodes).toArray()
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

    this.intGraph = new BasicGraph<Node, PolyIntEdge>(
      intEdges,
      originalGraph.nodeCount,
    )
    this.intGraph.nodes = nodes
    this.database = new Database()
    for (const e of this.intGraph.edges)
      this.database.registerOriginalEdgeInMultiedges(e)

    this.cycleRemoval()
  }
  run() {
    throw new Error()
  }
  cycleRemoval() {
    throw new Error('Method not implemented.')
  }
}
