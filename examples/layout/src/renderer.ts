import {Deck, OrthographicView} from '@deck.gl/core'

import {LayeredLayout, GeomNode, GeomGraph, Point} from 'msagl-js'
import {PolyIntEdge} from 'msagl-js/dist/layoutPlatform/layout/layered/polyIntEdge'

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

    const centerY = this.geomGraph.boundingBox.center

    for (const e of this.geomGraph.edges()) {
      const edgeCurve = e.curve
      // TODO render edgeCurve
      if (e.edgeGeometry.sourceArrowhead) {
        const tip: Point = e.edgeGeometry.sourceArrowhead.tipPosition
        const start: Point = e.edgeGeometry.curve.start
        // TODO draw arrowhead from start to tip
      }
      if (e.edgeGeometry.targetArrowhead) {
        const tip: Point = e.edgeGeometry.targetArrowhead.tipPosition
        const end: Point = e.edgeGeometry.curve.end
        // TODO draw arrowhead from end to tip
      }
    }
    for (const n of this.geomGraph.shallowNodes()) {
      const bc = n.boundaryCurve
      // TODO - render bc
    }
    // const nodeLayer = new NodeLayer<GeomNode>({
    //   id: 'nodes',
    //   data: layout.IntGraph.nodes,
    //   background: true,
    //   getPosition: (n) => [n.center.x, n.center.y],
    //   getText: (n) => n.id,
    //   getBorderWidth: 1,
    //   getSize: 14,
    //   // @ts-ignore
    //   sizeUnits: 'common',
    //   sizeMaxPixels: 24,
    //   _subLayerProps: {
    //     // Background box is absolutely positioned
    //     background: {
    //       getSize: 1,
    //       sizeScale: 1,
    //       sizeMinPixels: 0,
    //       sizeMaxPixels: Number.MAX_SAFE_INTEGER,
    //     },
    //   },
    // })

    // const edgeLayer = new EdgeLayer<PolyIntEdge>({
    //   id: 'edges',
    //   data: layout.IntGraph.edges,
    //   getPath: (e) => [e.curve.start, e.curve.end].map((p) => [p.x, p.y]),
    //   getArrowSize: 12,
    //   getArrowType: 'caret',
    //   getWidth: 1,
    //   opacity: 0.5,
    // })

    // this.deck.setProps({
    //   initialViewState: {
    //     target: [centerX, centerY, 0],
    //     zoom: 0,
    //   },
    //   layers: [edgeLayer, nodeLayer],
    // })
  }
}
