// This class is used of the case when there are multiple edges, but there is no need to duplicate layers.

import {BasicGraph} from '../../structs/BasicGraph'
import {GeomNode} from '../core/geomNode'
import {Database} from './Database'
import {LayerArrays} from './LayerArrays'
import {LayerEdge} from './LayerEdge'
import {LayerInserter} from './LayerInserter'
import {PolyIntEdge} from './polyIntEdge'
import {ProperLayeredGraph} from './ProperLayeredGraph'

// We just insert dummy nodes for edge middles without distorting the order of vertices of the layers.
export class EdgePathsInserter {
  database: Database
  intGraph: BasicGraph<GeomNode, PolyIntEdge>
  layeredGraph: ProperLayeredGraph
  virtNodesToIntEdges = new Map<number, PolyIntEdge>()

  NLayeredGraph: ProperLayeredGraph
  la: LayerArrays
  Nla: LayerArrays
  get NLayering() {
    return this.Nla.Y
  }

  static InsertPaths(
    layeredGraph: ProperLayeredGraph,
    la: LayerArrays,
    db: Database,
    intGraphP: BasicGraph<GeomNode, PolyIntEdge>,
  ) {
    const li = new EdgePathsInserter(layeredGraph, la, db, intGraphP)
    li.InsertPaths()
    return {
      layeredGraph: li.NLayeredGraph,
      la: li.Nla,
    }
  }

  constructor(
    layeredGraph: ProperLayeredGraph,
    la: LayerArrays,
    database: Database,
    intGraphP: BasicGraph<GeomNode, PolyIntEdge>,
  ) {
    this.la = la
    this.database = database
    this.layeredGraph = layeredGraph
    this.intGraph = intGraphP
  }

  InsertPaths() {
    this.CreateFullLayeredGraph()

    this.InitNewLayering()

    this.MapVirtualNodesToEdges()

    this.WidenOriginalLayers()
  }

  WidenOriginalLayers() {
    for (let i = 0; i < this.la.Layers.length; i++) {
      const layer = this.Nla.Layers[i]
      let offset = 0
      for (const v of this.la.Layers[i]) {
        const e = this.virtNodesToIntEdges.get(v)
        if (e != null) {
          const layerOffsetInTheEdge =
            this.NLayering[e.source] - this.NLayering[v]
          const list = this.database.Multiedges.get(e.source, e.target)

          for (const ie of list) {
            if (!this.EdgeIsFlat(ie)) {
              if (ie != e) {
                const u = ie.LayerEdges[layerOffsetInTheEdge].Source
                layer[offset] = u
                this.Nla.X[u] = offset++
              } else {
                layer[offset] = v
                this.Nla.X[v] = offset++
              }
            }
          }
        } else {
          layer[offset] = v
          this.Nla.X[v] = offset++
        }
      }
    }
  }

  EdgeIsFlat(ie: PolyIntEdge) {
    return this.la.Y[ie.source] == this.la.Y[ie.target]
  }

  MapVirtualNodesToEdges() {
    for (const list of this.database.RegularMultiedges())
      for (const e of list)
        if (!this.EdgeIsFlat(e))
          //the edge is not flat
          for (const le of e.LayerEdges)
            if (le.Target != e.target) this.virtNodesToIntEdges[le.Target] = e
  }

  private CreateFullLayeredGraph() {
    let currentVV = this.layeredGraph.NodeCount
    for (const [k, list] of this.database.Multiedges.keyValues()) {
      if (k.x != k.y) {
        //not a self edge
        let first = true
        let span = 0
        for (const e of list) {
          if (first) {
            first = false
            span = e.LayerSpan
          } else {
            e.LayerEdges = new LayerEdge[span]()
            if (span == 1)
              e.LayerEdges[0] = new LayerEdge(
                e.source,
                e.target,
                e.CrossingWeight,
              )
            else {
              for (let i = 0; i < span; i++) {
                const bVV = {currentVV: currentVV}
                const source = EdgePathsInserter.GetSource(bVV, e, i)
                currentVV = bVV.currentVV
                const target = EdgePathsInserter.GetTarget(
                  currentVV,
                  e,
                  i,
                  span,
                )
                e.LayerEdges[i] = new LayerEdge(
                  source,
                  target,
                  e.CrossingWeight,
                )
              }
            }
          }
          LayerInserter.RegisterDontStepOnVertex(this.database, e)
        }
      }
    }
    this.NLayeredGraph = new ProperLayeredGraph(this.intGraph)
  }

  static GetTarget(
    currentVV: number,
    e: PolyIntEdge,
    i: number,
    span: number,
  ): number {
    if (i < span - 1) return currentVV
    return e.target
  }

  static GetSource(
    boxedVV: {currentVV: number},
    e: PolyIntEdge,
    i: number,
  ): number {
    if (i == 0) return e.source

    return boxedVV.currentVV++
  }

  InitNewLayering() {
    this.Nla = new LayerArrays(new Array<number>(this.NLayeredGraph.NodeCount))

    for (let i = 0; i < this.layeredGraph.NodeCount; i++)
      this.NLayering[i] = this.la.Y[i]

    for (const [k, list] of this.database.Multiedges.keyValues()) {
      if (k.x != k.y && this.la.Y[k.x] != this.la.Y[k.y]) {
        //not a self edge and not a flat edge
        let layer = 0
        let first = true
        for (const e of list) {
          if (first) {
            first = false
            layer = this.la.Y[e.source]
          }
          let cl = layer - 1
          for (const le of e.LayerEdges) this.NLayering[le.Target] = cl--
        }
      }
    }

    // number[][] newLayers = new number[la.Layers.length][];
    const newLayers = new Array<Array<number>>(this.la.Layers.length)
    //count new layer widths
    const counts = new Array<number>(newLayers.length)

    for (const l of this.NLayering) counts[l]++

    for (let i = 0; i < counts.length; i++)
      newLayers[i] = new Array<number>(counts[i])

    this.Nla = new LayerArrays(this.NLayering)
    this.Nla.Layers = newLayers
  }
}
