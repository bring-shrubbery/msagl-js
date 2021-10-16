import {TextLayer, TextLayerProps} from '@deck.gl/layers'
import {GeomNode} from 'msagl-js'

export default class NodeLayer<P, TextLayerProps> extends TextLayer<
  P,
  TextLayerProps
> {
  getBoundingRect(node: GeomNode) {
    return [-node.width / 2, -node.height / 2, node.width, node.height]
  }
}
