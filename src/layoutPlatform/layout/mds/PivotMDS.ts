import {Edge} from '../../structs/edge'
import {Node} from '../../structs/node'
import {Algorithm} from '../../utils/algorithm'
import {GeomEdge} from '../core/geomEdge'
import {GeomGraph} from '../core/GeomGraph'
import {GeomNode} from '../core/geomNode'
import {MdsGraphLayout} from './MDSGraphLayout'
import {MdsLayoutSettings} from './MDSLayoutSettings'

// Initial layout using PivotMDS method for a graph with subgraphs
export class PivotMDS extends Algorithm {
  length: (e: GeomEdge) => number
  private graph: GeomGraph

  // scales the final layout by the specified factor on X
  private _scaleX: number
  iterationsWithMajorization: number
  public get scaleX(): number {
    return this._scaleX
  }
  public set scaleX(value: number) {
    this._scaleX = value
  }

  // scales the final layout by the specified factor on Y
  private _scaleY: number
  public get scaleY(): number {
    return this._scaleY
  }
  public set scaleY(value: number) {
    this._scaleY = value
  }

  // Layout graph by the PivotMds method.  Uses spectral techniques to obtain a layout in
  // O(n^2) time when iterations with majorization are used, otherwise it is more like O(PivotNumber*n).
  public PivotMDS(graph: GeomGraph) {
    this.graph = graph
    this.scaleX = 1
  }

  // Executes the actual algorithm.
  run() {
    const liftedData = {
      liftedGraph: GeomGraph.mk('tmpmds_does_not_matter', null),
      liftedToOriginalNodes: new Map<GeomNode, GeomNode>(),
      liftedToOriginalEdges: new Map<GeomEdge, GeomEdge>(),
    }
    const g = CreateLiftedGraph(this.graph, liftedData)

    // with 0 majorization iterations we just do PivotMDS
    const settings = new MdsLayoutSettings()

    ;(settings.ScaleX = this.scaleX), (settings.ScaleY = this.scaleY)
    settings.IterationsWithMajorization = 0
    settings.RemoveOverlaps = false

    const mdsLayout = new MdsGraphLayout(
      settings,
      liftedData.liftedGraph,
      this.cancelToken,
      (e) => {
        const origE = liftedData.liftedToOriginalEdges.get(e)
        return this.length(origE)
      },
    )
    mdsLayout.run()

    for (const v of liftedData.liftedGraph.shallowNodes()) {
      const origNode = liftedData.liftedToOriginalNodes.get(v)
      origNode.center = v.center // it should call Translate for clusters
    }
  }
}

function CreateLiftedGraph(
  geomGraph: GeomGraph,
  t: {
    liftedGraph: GeomGraph
    liftedToOriginalNodes: Map<GeomNode, GeomNode>
    liftedToOriginalEdges: Map<GeomEdge, GeomEdge>
  },
) {
  for (const u of geomGraph.deepNodes()) {
    const origLiftedU = geomGraph.liftNode(u)
    const newLiftedU = getNewLifted(u, origLiftedU)

    for (const uv of u.outEdges()) {
      const liftedV = geomGraph.liftNode(uv.target)
      if (liftedV == origLiftedU) continue

      const newLiftedV = getNewLifted(uv.target, liftedV)
      const uvL = new Edge(newLiftedV.node, newLiftedV.node)
      const uvGeomEdge = new GeomEdge(uvL)
      t.liftedToOriginalEdges.set(uvGeomEdge, uv)
    }
  }

  function getNewLifted(v: GeomNode, vLifted: GeomNode): GeomNode {
    let newLifted = t.liftedGraph.findNode(vLifted.id)
    if (!newLifted) {
      newLifted = GeomNode.mkNode(
        vLifted.boundaryCurve.clone(),
        new Node(vLifted.id),
      )
      t.liftedGraph.addNode(newLifted)
      t.liftedToOriginalNodes.set(newLifted, v)
    }
    return newLifted
  }
}
