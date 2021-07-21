import {GeomGraph} from '../../..'
import {GeomEdge} from '../../../layoutPlatform/layout/core/geomEdge'
import {LayoutSettings} from '../../../layoutPlatform/layout/layered/SugiyamaLayoutSettings'
import {Point} from '../../../layoutPlatform/math/geometry/point'
import {Rectangle} from '../../../layoutPlatform/math/geometry/rectangle'
import {OptimalRectanglePacking} from '../../../layoutPlatform/math/geometry/rectanglePacking/OptimalRectanglePacking'
import {Edge} from '../../../layoutPlatform/structs/edge'
import {
  Graph,
  shallowConnectedComponents,
} from '../../../layoutPlatform/structs/graph'
import {CancelToken} from '../../../layoutPlatform/utils/cancelToken'

// Lays out a graph, possibly disconnected
function layoutGraph(
  geomG: GeomGraph,
  cancelToken: CancelToken,
  layoutSettings: (g: GeomGraph) => LayoutSettings,
) {
  const liftedEdges = createLiftedEdges(geomG.graph)
  const connectedGraphs: GeomGraph[] = getConnectedComponents(geomG)

  layoutComps()

  liftedEdges.forEach((e) => e.edge.remove())
  connectedGraphs.forEach((g) => {
    for (const n of g.graph.shallowNodes) n.parent = g.graph
  })

  function layoutComps() {
    for (const cg of connectedGraphs) {
      layoutConnectedComponent(cg, cancelToken, (g: GeomGraph) =>
        g == cg ? layoutSettings(geomG) : layoutSettings(g),
      )
    }
    const originalLeftBottoms = new Array<{g: GeomGraph; lb: Point}>()
    for (const g of connectedGraphs) {
      originalLeftBottoms.push({g: g, lb: g.boundingBox.leftBottom.clone()})
    }
    const rectangles = connectedGraphs.map((g) => g.boundingBox)
    const packing = new OptimalRectanglePacking(
      rectangles,
      layoutSettings(geomG).PackingAspectRatio,
    )
    packing.run()
    for (const {g, lb} of originalLeftBottoms) {
      const delta = g.boundingBox.leftBottom.sub(lb)
      g.translate(delta)
    }
    geomG.boundingBox = new Rectangle({
      left: 0,
      bottom: 0,
      right: packing.PackedWidth,
      top: packing.PackedHeight,
    })
  }
}

// returns the map of pairs (new lifted GeomEdge, existing GeomEdge)
function createLiftedEdges(graph: Graph): GeomEdge[] {
  const liftedEdges = []
  for (const u of graph.deepNodes) {
    const liftedU = graph.liftNode(u)

    for (const uv of u.outEdges) {
      const v = uv.target
      const liftedV = graph.liftNode(v)
      if (
        liftedV == null ||
        (liftedU == u && liftedV == v) ||
        liftedU == liftedV
      ) {
        continue
      }

      const newLiftedEdge = new Edge(liftedU, liftedV)
      const newLiftedGeomEdge = new GeomEdge(newLiftedEdge)
      liftedEdges.push(newLiftedGeomEdge)
    }
  }
  return liftedEdges
}

function layoutConnectedComponent(
  graph: GeomGraph,
  cancelToken: CancelToken,
  layoutSettings: (g: GeomGraph) => LayoutSettings,
) {
  throw new Error('not implemented')
}

function getConnectedComponents(geomGraph: GeomGraph): GeomGraph[] {
  const graph = geomGraph.graph
  const comps = shallowConnectedComponents(graph)
  const ret = []
  let i = 0
  for (const comp of comps) {
    const g = new Graph(graph.id + i++)
    const geomG = new GeomGraph(g, null)
    for (const n of comp) {
      g.addNode(n) // this changes the parent - should be restored
    }
    ret.push(geomG)
  }
  return ret
}
