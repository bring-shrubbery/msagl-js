///  Following "Improving Layered Graph Layouts with Edge Bundling" and
///  "Two polynomial time algorithms for the bundle-Line crossing minimization problem"
///  Postprocessing minimizing crossings step that works on the layered graph

import {from} from 'linq-to-typescript'
import {Point, compareTo} from '../../../math/geometry/point'
import {Assert} from '../../../utils/assert'
import {PointMap} from '../../../utils/PointMap'
import {LayerArrays, layersAreCorrect} from '../LayerArrays'
import {ProperLayeredGraph} from '../ProperLayeredGraph'

export class MetroMapOrdering {
  layerArrays: LayerArrays
  nodePositions: Map<number, Point>
  properLayeredGraph: ProperLayeredGraph

  constructor(
    properLayeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays,
    nodePositions: Map<number, Point>,
  ) {
    this.properLayeredGraph = properLayeredGraph
    this.layerArrays = layerArrays
    this.nodePositions = nodePositions
  }

  ///  <summary>
  ///  Reorder only points having identical nodePositions
  ///  </summary>
  static UpdateLayerArrays0(
    properLayeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays,
    nodePositions: Map<number, Point>,
  ) {
    new MetroMapOrdering(
      properLayeredGraph,
      layerArrays,
      nodePositions,
    ).UpdateLayerArrays()
  }

  ///  <summary>
  ///  Reorder virtual nodes between the same pair of real nodes
  ///  </summary>
  static UpdateLayerArrays1(
    properLayeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays,
  ) {
    Assert.assert(layersAreCorrect(layerArrays))
    const nodePositions = MetroMapOrdering.BuildInitialNodePositions(
      properLayeredGraph,
      layerArrays,
    )
    Assert.assert(layersAreCorrect(layerArrays))
    this.UpdateLayerArrays0(properLayeredGraph, layerArrays, nodePositions)
    Assert.assert(layersAreCorrect(layerArrays))
  }

  static BuildInitialNodePositions(
    properLayeredGraph: ProperLayeredGraph,
    layerArrays: LayerArrays,
  ): Map<number, Point> {
    const result = new Map<number, Point>()
    for (let i = 0; i < layerArrays.Layers.length; i++) {
      let curr = 0
      let prev = 0
      while (curr < layerArrays.Layers[i].length) {
        while (
          curr < layerArrays.Layers[i].length &&
          properLayeredGraph.IsVirtualNode(layerArrays.Layers[i][curr])
        ) {
          curr++
        }

        for (let j: number = prev; j < curr; j++) {
          result.set(layerArrays.Layers[i][j], new Point(i, prev))
        }

        if (curr < layerArrays.Layers[i].length) {
          result.set(layerArrays.Layers[i][curr], new Point(i, curr))
        }

        curr++
        prev = curr
      }
    }

    return result
  }

  UpdateLayerArrays() {
    // algo stuff here
    let ordering: PointMap<Array<number>> = this.CreateInitialOrdering()
    ordering = this.BuildOrdering(ordering)
    this.RestoreLayerArrays(ordering)
  }

  CreateInitialOrdering(): PointMap<Array<number>> {
    const initialOrdering = new PointMap<Array<number>>()
    for (let i = 0; i < this.layerArrays.Layers.length; i++) {
      for (let j = 0; j < this.layerArrays.Layers[i].length; j++) {
        const node = this.layerArrays.Layers[i][j]
        const p = this.nodePositions.get(node)
        if (!initialOrdering.has(p.x, p.y)) {
          initialOrdering.set(p.x, p.y, new Array<number>())
        }
        initialOrdering.get(p.x, p.y).push(node)
      }
    }
    return initialOrdering
  }

  BuildOrdering(
    initialOrdering: PointMap<Array<number>>,
  ): PointMap<Array<number>> {
    // run through nodes points and build order
    const result = new PointMap<Array<number>>()
    const reverseOrder = new Map<number, number>()
    for (let i = 0; i < this.layerArrays.Layers.length; i++) {
      for (let j = 0; j < this.layerArrays.Layers[i].length; j++) {
        const node: number = this.layerArrays.Layers[i][j]
        // already processed
        const p = this.nodePositions.get(node)
        if (result.has(p.x, p.y)) {
          continue
        }

        result.setP(
          this.nodePositions.get(node),
          this.BuildNodeOrdering(
            initialOrdering.getP(this.nodePositions.get(node)),
            reverseOrder,
          ),
        )
      }
    }

    return result
  }

  BuildNodeOrdering(
    nodeOrdering: Array<number>,
    inverseToOrder: Map<number, number>,
  ): Array<number> {
    const result: Array<number> = nodeOrdering
    result.sort(this.Comparison(inverseToOrder))
    for (let i = 0; i < result.length; i++) {
      inverseToOrder.set(result[i], i)
    }

    return result
  }

  Comparison(inverseToOrder: Map<number, number>) {
    return (node1: number, node2: number) => {
      Assert.assert(
        this.properLayeredGraph.IsVirtualNode(node1) &&
          this.properLayeredGraph.IsVirtualNode(node2),
      )
      const succ1: number = from(this.properLayeredGraph.Succ(node1)).first()
      const succ2: number = from(this.properLayeredGraph.Succ(node2)).first()
      let pred1: number = from(this.properLayeredGraph.Pred(node1)).first()
      let pred2: number = from(this.properLayeredGraph.Pred(node2)).first()
      const succPoint1: Point = this.nodePositions.get(succ1)
      const succPoint2: Point = this.nodePositions.get(succ2)
      const predPoint1: Point = this.nodePositions.get(pred1)
      const predPoint2: Point = this.nodePositions.get(pred2)
      if (succPoint1 != succPoint2) {
        if (predPoint1 != predPoint2) {
          return predPoint1.compareTo(predPoint2)
        }

        return succPoint1.compareTo(succPoint2)
      }

      if (this.properLayeredGraph.IsVirtualNode(succ1)) {
        if (predPoint1 != predPoint2) {
          return predPoint1.compareTo(predPoint2)
        }

        const o1: number = inverseToOrder.get(succ1)
        const o2: number = inverseToOrder.get(succ2)
        Assert.assert(o1 != -1 && o2 != -1)
        return compareTo(o1, o2)
      }

      while (
        this.nodePositions.get(pred1) == this.nodePositions.get(pred2) &&
        this.properLayeredGraph.IsVirtualNode(pred1)
      ) {
        pred1 = from(this.properLayeredGraph.Pred(pred1)).first()
        pred2 = from(this.properLayeredGraph.Pred(pred2)).first()
      }

      if (this.nodePositions.get(pred1) == this.nodePositions.get(pred2)) {
        return compareTo(node1, node2)
      }

      return this.nodePositions
        .get(pred1)
        .compareTo(this.nodePositions.get(pred2))
    }
  }

  RestoreLayerArrays(ordering: PointMap<Array<number>>) {
    for (let i = 0; i < this.layerArrays.Layers.length; i++) {
      let tec = 0
      let pred = 0
      const layer = this.layerArrays.Layers[i]
      while (tec < layer.length) {
        while (
          tec < layer.length &&
          this.nodePositions.get(layer[pred]) ==
            this.nodePositions.get(layer[tec])
        ) {
          tec++
        }

        for (let j = pred; j < tec; j++) {
          layer[j] = ordering.getP(this.nodePositions.get(layer[j]))[j - pred]
        }

        pred = tec
      }
    }

    this.layerArrays.UpdateXFromLayers()
  }
}
