import {CompositeLayer, Position} from '@deck.gl/core'
import {PathLayer, IconLayer, PathLayerProps} from '@deck.gl/layers'
import {iconAtlas, iconMapping} from './arrows'

export interface EdgeLayerProps<D> extends PathLayerProps<D> {
  getArrowSize?: number | ((d: D) => number)
  getArrowType?: string | ((d: D) => string)
}

export default class EdgeLayer<D, EdgeLayerProps> extends CompositeLayer<
  D,
  EdgeLayerProps
> {
  static defaultProps = {
    ...PathLayer.defaultProps,
    getArrowSize: {type: 'accessor', value: 12},
    getArrowType: {type: 'accessor', value: 'caret'},
  }

  renderLayers() {
    // @ts-ignore
    const {
      data,
      getArrowSize,
      getArrowType,
      getPath,
      getColor,
      updateTriggers = {},
    } = this.props

    return [
      // @ts-ignore
      new PathLayer<D>(
        this.props,
        this.getSubLayerProps({
          id: 'path',
          updateTriggers: {
            getPath: updateTriggers.getPath,
            getWidth: updateTriggers.getWidth,
            getColor: updateTriggers.getColor,
          },
          widthUnits: 'pixels',
        }),
      ),

      // @ts-ignore
      new IconLayer<D>(
        this.getSubLayerProps({
          id: 'arrow',
          updateTriggers: {
            getPosition: updateTriggers.getPath,
            getSize: updateTriggers.getArrowSize,
            getColor: updateTriggers.getColor,
          },
        }),
        {
          data,
          getSize: getArrowSize,
          getColor,
          getIcon:
            typeof getArrowType === 'string'
              ? () => getArrowType
              : getArrowType,
          getPosition: (d) => getEndPoint(getPath(d)),
          getAngle: (d) => getEndDirection(getPath(d)),
          iconAtlas,
          iconMapping,
        },
      ),
    ]
  }
}

function getEndPoint(path: Position[]) {
  return path[path.length - 1]
}

function getEndDirection(path: Position[]) {
  const from = path[path.length - 2]
  const to = path[path.length - 1]
  if (from && to) {
    return (-Math.atan2(to[1] - from[1], to[0] - from[0]) / Math.PI) * 180
  }
  return 0
}
