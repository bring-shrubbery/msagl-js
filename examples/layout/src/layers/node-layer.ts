import {TextLayer, TextLayerProps} from '@deck.gl/layers'
import {GeomNode} from 'msagl-js'

export default class NodeLayer<
  D,
  P extends TextLayerProps<D> = TextLayerProps<D>
> extends TextLayer<D, P> {
  getBoundingRect(node: GeomNode) {
    return [-node.width / 2, -node.height / 2, node.width, node.height]
  }
}
