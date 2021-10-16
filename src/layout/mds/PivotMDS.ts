import {Edge} from '../../structs/edge'
import {Algorithm} from '../../utils/algorithm'
// import {Assert} from '../../utils/assert'
import {CancelToken} from '../../utils/cancelToken'
import {GeomEdge} from '../core/geomEdge'
import {GeomGraph} from '../core/GeomGraph'
import {LayoutSettings} from '../layered/SugiyamaLayoutSettings'
import {MdsGraphLayout} from './MDSGraphLayout'
import {MdsLayoutSettings} from './MDSLayoutSettings'

// Initial layout using PivotMDS method for a graph with subgraphs
export class PivotMDS extends Algorithm {
  length: (e: GeomEdge) => number
  private graph: GeomGraph

  // scales the final layout by the specified factor on X
  iterationsWithMajorization: number
  settings: MdsLayoutSettings
  layoutSettingsFunc: (g: GeomGraph) => LayoutSettings
  public get scaleX(): number {
    return this.settings.ScaleX
  }
  public set scaleX(value: number) {
    /*Assert.assert(!isNaN(value))*/
    this.settings.ScaleX = value
  }

  // scales the final layout by the specified factor on Y
  public get scaleY(): number {
    return this.settings.ScaleY
  }
  public set scaleY(value: number) {
    /*Assert.assert(!isNaN(value))*/
    this.settings.ScaleY = value
  }

  // Layout graph by the PivotMds method.  Uses spectral techniques to obtain a layout in
  // O(n^2) time when iterations with majorization are used, otherwise it is more like O(PivotNumber*n).
  constructor(
    graph: GeomGraph,
    cancelToken: CancelToken,
    length: (e: GeomEdge) => number,
    settings: MdsLayoutSettings,
    layoutSettingsFunc: (g: GeomGraph) => LayoutSettings,
  ) {
    super(cancelToken)
    this.graph = graph
    this.length = length
    this.settings = settings
    this.settings.ScaleX = this.settings.ScaleY = 200
    this.layoutSettingsFunc = layoutSettingsFunc
  }

  // Executes the actual algorithm.
  run() {
    // with 0 majorization iterations we just do PivotMDS

    const mdsLayout = new MdsGraphLayout(
      this.settings,
      this.graph,
      this.cancelToken,
      this.length,
    )
    mdsLayout.run()
  }
}

// returns the map of pairs (new lifted GeomEdge, existing GeomEdge)
function CreateLiftedEdges(geomGraph: GeomGraph): Map<GeomEdge, GeomEdge> {
  const liftedEdges = new Map<GeomEdge, GeomEdge>()
  for (const u of geomGraph.deepNodes()) {
    const liftedU = geomGraph.liftNode(u)

    for (const uv of u.outEdges()) {
      const v = uv.target
      const liftedV = geomGraph.liftNode(v)
      if (
        liftedV == null ||
        (liftedU == u && liftedV == v) ||
        liftedU == liftedV
      ) {
        continue
      }

      const newLiftedEdge = new Edge(liftedU.node, liftedV.node)
      const newLiftedGeomEdge = new GeomEdge(newLiftedEdge)
      liftedEdges.set(newLiftedGeomEdge, uv)
    }
  }
  return liftedEdges
}
