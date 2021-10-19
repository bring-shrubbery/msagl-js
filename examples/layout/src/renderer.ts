import {Deck, OrthographicView} from '@deck.gl/core'

import {interpolateICurve, GeomNode, GeomGraph, Point, GeomEdge} from 'msagl-js'

import NodeLayer from './layers/node-layer'
import EdgeLayer from './layers/edge-layer'

export default class Renderer {
  deck: any
  geomGraph: GeomGraph

  constructor(geomGraph: GeomGraph) {
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

  update() {
    const {geomGraph: layout} = this

    const center = this.geomGraph.boundingBox.center

    const nodeLayer = new NodeLayer<GeomNode>({
      id: 'nodes',
      data: Array.from(this.geomGraph.shallowNodes()),
      background: true,
      getPosition: (n) => [n.center.x, n.center.y],
      getText: (n) => n.id,
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

    const edgeLayer = new EdgeLayer<GeomEdge>({
      id: 'edges',
      data: Array.from(this.geomGraph.edges()),
      getPath: (e) => interpolateICurve(e.curve, 0.5).map((p) => [p.x, p.y]),
      getArrowSize: 12,
      getArrowType: 'caret',
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
  }
}
