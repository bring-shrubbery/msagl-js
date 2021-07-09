import {CurveFactory} from '../../math/geometry/curveFactory'
import {Edge} from '../../structs/edge'
import {Node} from '../../structs/node'
import {Algorithm} from '../../utils/algorithm'
import {Assert} from '../../utils/assert'
import {CancelToken} from '../../utils/cancelToken'
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
    Assert.assert(!isNaN(value))
    this._scaleX = value
  }

  // scales the final layout by the specified factor on Y
  private _scaleY: number
  public get scaleY(): number {
    return this._scaleY
  }
  public set scaleY(value: number) {
    Assert.assert(!isNaN(value))
    this._scaleY = value
  }

  // Layout graph by the PivotMds method.  Uses spectral techniques to obtain a layout in
  // O(n^2) time when iterations with majorization are used, otherwise it is more like O(PivotNumber*n).
  constructor(
    graph: GeomGraph,
    cancelToken: CancelToken,
    length: (e: GeomEdge) => number,
  ) {
    super(cancelToken)
    this.graph = graph
    this.scaleX = this.scaleY = 200
    this.length = length
  }

  // Executes the actual algorithm.
  run() {
    // first recurse to layout the subgraphs
    for (const n of this.graph.shallowNodes()) {
      if (n.isGraph()) {
        const g = <GeomGraph>n
        const subMds = new PivotMDS(g, this.cancelToken, this.length)
        subMds.run()
        n.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
          n.boundingBox.width,
          n.boundingBox.height,
          g.Margins,
          g.Margins,
          n.center,
        )
      }
    }
    // Let as suppose we have an edge (u,v) where u is a shallow node of this.graph, but b is only a node in
    // graph c, where c is also a shallow node of this.graph. It this case we create new edge, lifted edge, (u, c) for the
    // purpose of the layout and remove it when done

    const liftedEdges = CreateLiftedEdges(this.graph)

    // with 0 majorization iterations we just do PivotMDS
    const settings = new MdsLayoutSettings()

    settings.ScaleX = this.scaleX
    settings.ScaleY = this.scaleY
    settings.IterationsWithMajorization = 0
    settings.RemoveOverlaps = false

    const mdsLayout = new MdsGraphLayout(
      settings,
      this.graph,
      this.cancelToken,
      (e) => {
        const origE = liftedEdges.get(e)
        return this.length(origE)
      },
    )
    mdsLayout.run()

    for (const e of liftedEdges.keys()) {
      e.source.node.removeEdde(e.edge)
    }
  }
}

// returns
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
