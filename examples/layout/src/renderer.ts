import {Deck, OrthographicView} from '@deck.gl/core'

import {interpolateICurve, GeomNode, GeomGraph, GeomEdge, Point} from 'msagl-js'

import NodeLayer from './layers/node-layer'
import EdgeLayer from './layers/edge-layer'
import {DrawingNode, DrawingEdge} from 'msagl-js/drawing'

export default class Renderer {
  deck: any
  geomGraph?: GeomGraph

  constructor(geomGraph?: GeomGraph) {
    this.deck = new Deck({
      views: [new OrthographicView({})],
      initialViewState: {
        // @ts-ignore
        target: [0, 0, 0],
        zoom: 0,
      },
      controller: true,
      onLoad: () => this.update(),
    })

    this.geomGraph = geomGraph
    console.log(geomGraph)
  }

  setGraph(geomGraph?: GeomGraph) {
    this.geomGraph = geomGraph
    if (this.deck.layerManager) {
      // loaded
      this.update()
    }
  }

  update() {
    const {geomGraph} = this
    if (!geomGraph) return

    const center = this.geomGraph.boundingBox.center

    // todo: grap color and other rendering attributes from DrawingNode.getDrawingObject(n)
    const nodeLayer = new NodeLayer<GeomNode>({
      id: 'nodes',
      data: Array.from(this.geomGraph.shallowNodes()),
      background: true,
      getPosition: (n) => [n.center.x, n.center.y],
      getText: (n) =>
        (<DrawingNode>DrawingNode.getDrawingObj(n.node)).labelText,
      getBorderWidth: 1,
      getSize: 14,
      // @ts-ignore
      sizeUnits: 'common',
      sizeMaxPixels: 24,
      _subLayerProps: {
        // Background box is absolutely positioned
        background: {
          getSize: 1,
          sizeScale: 1,
          sizeMinPixels: 0,
          sizeMaxPixels: Number.MAX_SAFE_INTEGER,
        },
      },
    })

    // todo: grap color and other rendering attributes from DrawingNode.getDrawingObject(e)
    // todo - render edge labels
    const edgeLayer = new EdgeLayer<GeomEdge>({
      id: 'edges',
      data: Array.from(this.geomGraph.edges()),
      getPath: (e) =>
        Array.from(interpolateEdge(e, 0.5)).map((p) => [p.x, p.y]),

      getColor: (_) => [255 * Math.random(), 128, 255 * Math.random()],
      //getArrowSize: (e)=>e.edgeGeometry.targetArrowhead.length,
      getArrowType: 'none',
      getWidth: 1,
      opacity: 0.5,
    })

    this.deck.setProps({
      initialViewState: {
        target: [center.x, center.y, 0],
        zoom: 0,
      },
      layers: [edgeLayer, nodeLayer],
    })

    function* interpolateEdge(
      e: GeomEdge,
      tolerance: number,
    ): IterableIterator<Point> {
      const eg = e.edgeGeometry
      if (eg.sourceArrowhead) {
        yield eg.curve.start
        const t = eg.sourceArrowhead.tipPosition.sub(eg.curve.start)
        const pPerp = t.rotate90Ccw().div(4)
        yield eg.curve.start.add(pPerp)
        yield eg.sourceArrowhead.tipPosition
        yield eg.curve.start.sub(pPerp)
      }
      for (const p of interpolateICurve(eg.curve, tolerance)) yield p
      if (eg.targetArrowhead) {
        const t = eg.targetArrowhead.tipPosition.sub(eg.curve.end)
        const pPerp = t.rotate90Ccw().div(4)
        yield eg.curve.end.add(pPerp)
        yield eg.targetArrowhead.tipPosition
        yield eg.curve.end.sub(pPerp)
        yield eg.curve.end
      }
    }
  }
}
