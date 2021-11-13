import {RectilinearEdgeRouter} from '../routing/rectilinear/RectilinearEdgeRouter'
import {GeomGraph, optimalPackingRunner} from './core/GeomGraph'
import {CancelToken} from '../utils/cancelToken'
import {CurveFactory} from '../math/geometry/curveFactory'
import {Point} from '../math/geometry/point'
import {Edge} from '../structs/edge'
import {Graph, shallowConnectedComponents} from '../structs/graph'
import {GeomEdge} from './core/geomEdge'
import {
  LayoutSettings,
  SugiyamaLayoutSettings,
} from './layered/SugiyamaLayoutSettings'
import {LayeredLayout, MdsLayoutSettings} from '..'
import {PivotMDS} from './mds/PivotMDS'
import {EdgeRoutingMode} from '../routing/EdgeRoutingMode'
import {straightLineEdgePatcher} from '../routing/StraightLineEdges'

// function routeEdges(
//   geomG: GeomGraph,
//   edgeRoutingSettings: EdgeRoutingSettings,
//   cornerFitRadius = 3,
// ) {
//   if (edgeRoutingSettings.edgeRoutingMode != EdgeRoutingMode.Rectilinear) {
//     // TODO: enable other modes
//     routeStraightEdges(geomG)
//   } else {
//     if (edgeRoutingSettings.edgeRoutingMode == EdgeRoutingMode.Rectilinear)
//       routeRectilinearEdges(geomG, edgeRoutingSettings.padding, cornerFitRadius)
//   }
// }

// function routeStraightEdges(geomG: GeomGraph) {
//   for (const u of geomG.deepNodes()) {
//     for (const e of u.outEdges()) {
//       if (e.curve == null) StraightLineEdges.RouteEdge(e, 0)
//     }
//     for (const e of u.selfEdges()) {
//       if (e.curve == null) StraightLineEdges.RouteEdge(e, 0)
//     }
//   }
// }

export function layoutGeomGraph(
  geomGraph: GeomGraph,
  cancelToken: CancelToken,
): void {
  createSettingsIfNeeded(geomGraph)
  layoutGeomGraphInternal(
    geomGraph,
    cancelToken,
    layoutEngine,
    edgeRouter,
    optimalPackingRunner,
  )
  function createSettingsIfNeeded(geomGraph: GeomGraph) {
    if (!geomGraph.layoutSettings) {
      geomGraph.layoutSettings = figureOutSettings(geomGraph)
    }
  }
  function layoutEngine(geomGraph: GeomGraph, cancelToken: CancelToken) {
    createSettingsIfNeeded(geomGraph)
    if (geomGraph.layoutSettings instanceof SugiyamaLayoutSettings) {
      const ll = new LayeredLayout(
        geomGraph,
        <SugiyamaLayoutSettings>geomGraph.layoutSettings,
        cancelToken,
      )
      ll.run()
    } else if (geomGraph.layoutSettings instanceof MdsLayoutSettings) {
      const pivotMds = new PivotMDS(
        geomGraph,
        cancelToken,
        () => 1,
        <MdsLayoutSettings>geomGraph.layoutSettings,
      )
      pivotMds.run()
    } else {
      throw Error('not implemented')
    }
  }

  function figureOutSettings(geomGraph: GeomGraph): LayoutSettings {
    if (geomGraph.shallowNodeCount < 200 || geomGraph.edgeCount < 200)
      return new SugiyamaLayoutSettings()
    return new MdsLayoutSettings()
  }

  function edgeRouter(geomGraph: GeomGraph, cancelToken: CancelToken) {
    const ers = geomGraph.layoutSettings.edgeRoutingSettings
    if (ers.edgeRoutingMode == EdgeRoutingMode.Rectilinear) {
      routeRectilinearEdges(geomGraph, cancelToken)
    } else {
      straightLineEdgePatcher(geomGraph, cancelToken)
    }
  }
}

// Lays out a GeomGraph, which is possibly disconnected and might have sub-graphs
export function layoutGeomGraphInternal(
  geomG: GeomGraph,
  cancelToken: CancelToken,
  layoutEngine: (g: GeomGraph, cancelToken: CancelToken) => void,
  edgeRouter: (g: GeomGraph, cancelToken: CancelToken) => void,
  packing: (g: GeomGraph, subGraphs: GeomGraph[]) => void,
  flipToScreenCoords = true,
) {
  if (geomG.graph.isEmpty()) {
    // if there are no nodes in the graph, create a circle for its boundary and exit
    geomG.boundaryCurve = CurveFactory.mkCircle(10, new Point(0, 0))
    geomG.boundingBox = geomG.boundaryCurve.boundingBox
    return
  }
  const removedEdges = removeEdgesLeadingOutOfGraph()

  layoutShallowSubgraphs(geomG)
  const liftedEdges = createLiftedEdges(geomG.graph)
  const connectedGraphs: GeomGraph[] = getConnectedComponents(geomG)
  // TODO: possible optimization for a connected graph
  layoutComps()

  liftedEdges.forEach((e) => {
    e[0].edge.remove()
    e[1].add()
  })

  connectedGraphs.forEach((g) => {
    for (const n of g.graph.shallowNodes) n.parent = geomG.graph
  })

  for (const e of removedEdges) e.add()

  //the final touches
  if (geomG.graph.parent == null) {
    edgeRouter(geomG, cancelToken)
    if (flipToScreenCoords) {
      geomG.FlipYAndMoveLeftTopToOrigin()
    }
  }

  function layoutShallowSubgraphs(geomG: GeomGraph) {
    for (const n of geomG.shallowNodes()) {
      if (n.isGraph()) {
        const g = <GeomGraph>n
        layoutGeomGraphInternal(
          g,
          cancelToken,
          layoutEngine,
          edgeRouter,
          packing,
        )
        const bb = g._boundingBox
        if (bb && !bb.isEmpty()) {
          n.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
            bb.width,
            bb.height,
            Math.min(10, bb.width / 10),
            Math.min(10, bb.height / 10),
            bb.center,
          )
        }
      }
    }
  }

  function removeEdgesLeadingOutOfGraph(): Set<Edge> {
    const ret = new Set<Edge>()
    const graphUnderSurgery = geomG.graph
    for (const n of graphUnderSurgery.shallowNodes) {
      for (const e of n.outEdges) {
        if (graphUnderSurgery.liftNode(e.target) == null) ret.add(e)
      }
      for (const e of n.inEdges) {
        if (graphUnderSurgery.liftNode(e.source) == null) ret.add(e)
      }
    }
    for (const e of ret) e.remove()
    return ret
  }

  function layoutComps() {
    if (connectedGraphs.length == 0) return
    for (const cg of connectedGraphs) {
      layoutEngine(cg, cancelToken)
    }
    packing(geomG, connectedGraphs)
    geomG.addLabelToGraphBB(geomG.boundingBox)
  }
}

// returns arrays of pairs (new lifted GeomEdge, existing Edge)
function createLiftedEdges(graph: Graph): Array<[GeomEdge, Edge]> {
  const liftedEdges = new Array<[GeomEdge, Edge]>()
  for (const u of graph.deepNodes) {
    const liftedU = graph.liftNode(u)
    if (liftedU == null) continue
    for (const uv of u.outEdges.values()) {
      const v = uv.target
      const liftedV = graph.liftNode(v)
      if (
        liftedV == null ||
        (liftedU == u && liftedV == v) ||
        liftedU == liftedV
      ) {
        continue
      }
      uv.remove()
      const newLiftedEdge = new Edge(liftedU, liftedV)
      const newLiftedGeomEdge = new GeomEdge(newLiftedEdge)
      liftedEdges.push([newLiftedGeomEdge, uv])
    }
  }
  return liftedEdges
}

// function layoutConnectedComponent(
//   geomG: GeomGraph,
//   cancelToken: CancelToken,
//   layoutSettingsFunc: (g: GeomGraph) => LayoutSettings,
// ) {
//   const settings = layoutSettingsFunc(geomG)
//   if (settings instanceof MdsLayoutSettings) {
//     const pmd = new PivotMDS(
//       geomG,
//       null,
//       () => 1,
//       <MdsLayoutSettings>settings,
//       layoutSettingsFunc,
//     )
//     pmd.run()
//   } else if (settings instanceof SugiyamaLayoutSettings) {
//     const ll = new LayeredLayout(geomG, <SugiyamaLayoutSettings>settings, null)
//     ll.run()
//   } else {
//     throw new Error('unknown settings')
//   }
// }

function getConnectedComponents(parentGeomGraph: GeomGraph): GeomGraph[] {
  const parentGraph = parentGeomGraph.graph
  const comps = shallowConnectedComponents(parentGraph)
  const ret = []
  let i = 0
  for (const comp of comps) {
    const g = new Graph(parentGraph.id + i++)
    g.parent = parentGraph
    const geomG = new GeomGraph(g)
    geomG.layoutSettings = parentGeomGraph.layoutSettings
    for (const n of comp) {
      n.parent = g
      g.addNode(n) // this changes the parent - should be restored to graph
    }
    ret.push(geomG)
  }
  return ret
}
export function routeRectilinearEdges(
  geomG: GeomGraph,
  cancelToken: CancelToken,
  nodePadding = 1,
  cornerFitRadius = 3,
) {
  const rr = RectilinearEdgeRouter.constructorGNNB(
    geomG,
    nodePadding,
    cornerFitRadius,
    true,
  )
  rr.run()
}
