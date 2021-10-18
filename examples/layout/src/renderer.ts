import {Deck, OrthographicView} from '@deck.gl/core'

import {LayeredLayout, GeomNode} from 'msagl-js'
import {PolyIntEdge} from 'msagl-js/dist/layoutPlatform/layout/layered/polyIntEdge'

import NodeLayer from './layers/node-layer'
import EdgeLayer from './layers/edge-layer'

export default class Renderer {
  deck: any
  layout: LayeredLayout

  constructor(layout: LayeredLayout) {
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

    this.layout = layout
    console.log(layout)
  }

  update() {
    const {layout} = this

    const centerX = (layout.originalGraph.left + layout.originalGraph.right) / 2
    const centerY = (layout.originalGraph.top + layout.originalGraph.bottom) / 2

    const nodeLayer = new NodeLayer<GeomNode>({
      id: 'nodes',
      data: layout.IntGraph.nodes,
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

    const edgeLayer = new EdgeLayer<PolyIntEdge>({
      id: 'edges',
      data: layout.IntGraph.edges,
      getPath: (e) => [e.curve.start, e.curve.end].map((p) => [p.x, p.y]),
      getArrowSize: 12,
      getArrowType: 'caret',
      getWidth: 1,
      opacity: 0.5,
    })

    this.deck.setProps({
      initialViewState: {
        target: [centerX, centerY, 0],
        zoom: 0,
      },
      layers: [edgeLayer, nodeLayer],
    })
  }
}
