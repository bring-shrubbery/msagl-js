import {VerticalConstraintsForSugiyama} from './VerticalConstraintsForSugiyama'
import {HorizontalConstraintsForSugiyama} from './HorizontalConstraintsForSugiyama'
import {EdgeRoutingSettings} from '../../core/routing/EdgeRoutingSettings'

export enum SnapToGridByY {
  None,
  Top,
  Bottom,
}

export class SugiyamaLayoutSettings {
  // The resulting layout should be at list this wide
  minimalWidth = 0
  EdgeRoutingSettings = new EdgeRoutingSettings()
  get MinimalWidth(): number {
    return this.minimalWidth
  }
  set MinimalWidth(value: number) {
    this.minimalWidth = Math.max(value, 0)
  }

  minimalHeight = 0
  // The resulting layout should be at least this tall
  get MinimalHeight(): number {
    return this.minimalHeight
  }
  set MinimalHeight(value: number) {
    this.minimalHeight = Math.max(value, 0)
  }

  verticalConstraints = new VerticalConstraintsForSugiyama()
  horizontalConstraints = new HorizontalConstraintsForSugiyama()
  layeringOnly: boolean
  NoGainAdjacentSwapStepsBound = 5
  RepetitionCoefficientForOrdering = 1
  AspectRatio: number
  MaxNumberOfPassesInOrdering = 24
  // When the number of vertices in the proper layered graph
  // is at least threshold  we switch to the faster, but not so accurate,
  // method for x-coordinates calculations.
  BrandesThreshold = 600
  LabelCornersPreserveCoefficient = 0.1
  MinNodeHeight = (72 * 0.5) / 4
  MinNodeWidth = (72 * 0.75) / 4
  NodeSeparation: 10
  SnapToGridByY = SnapToGridByY.None
  yLayerSep = 10 * 3
  get LayerSeparation() {
    return this.yLayerSep
  }
  set LayerSeparation(value) {
    this.yLayerSep = Math.max(10 * 3, value)
  }
  ActualLayerSeparation(layersAreDoubled: boolean) {
    return layersAreDoubled ? this.LayerSeparation / 2.0 : this.LayerSeparation
  }
  GridSizeByY = 0
  GridSizeByX = 0
}
