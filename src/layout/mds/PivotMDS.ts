import {EdgeRoutingMode} from '../../routing/EdgeRoutingMode'
import {straightLineEdgePatcher} from '../../routing/StraightLineEdges'
import {Algorithm} from '../../utils/algorithm'
// import {Assert} from '../../utils/assert'
import {CancelToken} from '../../utils/cancelToken'
import {GeomEdge} from '../core/geomEdge'
import {GeomGraph, optimalPackingRunner} from '../core/GeomGraph'
import {layoutGeomGraphInternal, routeRectilinearEdges} from '../driver'
import {MdsGraphLayout} from './MDSGraphLayout'
import {MdsLayoutSettings} from './MDSLayoutSettings'

export function layoutGraphWithMds(
  geomGraph: GeomGraph,
  cancelToken: CancelToken,
  flipToScreenCoords = true,
) {
  enforceMdsSettings()

  layoutGeomGraphInternal(
    geomGraph,
    cancelToken,
    mdsLayoutRunner,
    geomGraph.layoutSettings.edgeRoutingSettings.edgeRoutingMode ==
      EdgeRoutingMode.Rectilinear
      ? routeRectilinearEdges
      : straightLineEdgePatcher,
    optimalPackingRunner,
    flipToScreenCoords,
  )
  function enforceMdsSettings() {
    if (
      !geomGraph.layoutSettings ||
      !(geomGraph.layoutSettings instanceof MdsLayoutSettings)
    )
      geomGraph.layoutSettings = new MdsLayoutSettings()

    for (const n of geomGraph.deepNodes()) {
      if (n.isGraph) {
        const graph = <GeomGraph>n
        if (
          !graph.layoutSettings ||
          !(graph.layoutSettings instanceof MdsLayoutSettings)
        )
          graph.layoutSettings = new MdsLayoutSettings()
      }
    }
  }
}

// Initial layout using PivotMDS method for a graph with subgraphs
export class PivotMDS extends Algorithm {
  length: (e: GeomEdge) => number
  private graph: GeomGraph

  // scales the final layout by the specified factor on X
  iterationsWithMajorization: number
  settings: MdsLayoutSettings
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
  ) {
    super(cancelToken)
    this.graph = graph
    this.length = length
    this.settings = settings
    this.settings.ScaleX = this.settings.ScaleY = 200
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
function mdsLayoutRunner(geomG: GeomGraph, cancelToken: CancelToken) {
  const pmd = new PivotMDS(
    geomG,
    cancelToken,
    () => 1,
    <MdsLayoutSettings>geomG.layoutSettings,
  )
  pmd.run()
}
