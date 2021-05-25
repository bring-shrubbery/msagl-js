import {VerticalConstraintsForSugiyama} from './VerticalConstraintsForSugiyama'
import {HorizontalConstraintsForSugiyama} from './HorizontalConstraintsForSugiyama'
import {EdgeRoutingSettings} from '../../core/routing/EdgeRoutingSettings'
import {LayerDirectionEnum} from './layerDirectionEnum'
import {PlaneTransformation} from '../../math/geometry/planeTransformation'
import {Point} from '../../math/geometry/point'
export enum SnapToGridByY {
  None,
  Top,
  Bottom,
}
export class LayoutSettings {
  minimalWidth = 0
  // The resulting layout should be at list this wide
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
}

export class SugiyamaLayoutSettings extends LayoutSettings {
  transformIsRotation(ang: number): boolean {
    const p = PlaneTransformation.rotation(ang)
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++)
        if (!Point.closeD(p.elements[i][j], this.transform.elements[i][j]))
          return false
    }
    return true
  }
  sameRanks = new Array<string[]>()
  EdgeRoutingSettings = new EdgeRoutingSettings()

  verticalConstraints = new VerticalConstraintsForSugiyama()
  horizontalConstraints = new HorizontalConstraintsForSugiyama()
  layeringOnly: boolean
  NoGainAdjacentSwapStepsBound = 5
  RepetitionCoefficientForOrdering = 1
  AspectRatio = 0
  MaxNumberOfPassesInOrdering = 24
  // When the number of vertices in the proper layered graph
  // is at least threshold  we switch to the faster, but not so accurate,
  // method for x-coordinates calculations.
  BrandesThreshold = 600
  LabelCornersPreserveCoefficient = 0.1
  MinNodeHeight = (72 * 0.5) / 4
  MinNodeWidth = (72 * 0.75) / 4
  NodeSeparation = 10
  SnapToGridByY = SnapToGridByY.None
  yLayerSep = 10 * 3
  transform: PlaneTransformation = PlaneTransformation.getIdentity()
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
  get layerDirection() {
    if (this.transformIsRotation(0)) return LayerDirectionEnum.TB
    if (this.transformIsRotation(Math.PI / 2)) return LayerDirectionEnum.LR
    if (this.transformIsRotation(-Math.PI / 2)) return LayerDirectionEnum.RL
    if (this.transformIsRotation(Math.PI)) return LayerDirectionEnum.BT
    return LayerDirectionEnum.None
  }
  set layerDirection(value: LayerDirectionEnum) {
    switch (value) {
      case LayerDirectionEnum.TB:
        break
      case LayerDirectionEnum.LR:
        this.transform = PlaneTransformation.rotation(Math.PI / 2)
        break
      case LayerDirectionEnum.RL:
        this.transform = PlaneTransformation.rotation(-Math.PI / 2)
        break
      case LayerDirectionEnum.BT:
        this.transform = PlaneTransformation.rotation(Math.PI)
        break
      default:
        throw new Error('unexpected layout direction')
    }
  }
}
