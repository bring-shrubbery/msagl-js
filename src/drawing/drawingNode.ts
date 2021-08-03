import {DrawingObject} from './drawingObject'
import {Node} from '../layoutPlatform/structs/node'
import {Color} from './color'
import {ShapeEnum} from './shapeEnum'
import {DrawingLabel} from './drawingLabel'

export class DrawingNode extends DrawingObject {
  label: DrawingLabel
  padding = 2
  get Padding(): number {
    return this.padding
  }
  set Padding(value: number) {
    this.padding = Math.max(0, value)
    // //RaiseVisualsChangedEvent(this, null);
  }
  xRad = 3

  // x radius of the rectangle box

  get XRadius(): number {
    return this.xRad
  }
  set XRadius(value: number) {
    this.xRad = value
    //RaiseVisualsChangedEvent(this, null);
  }

  yRad = 3

  //  y radius of the rectangle box

  get YRadius(): number {
    return this.yRad
  }
  set YRadius(value: number) {
    this.yRad = value
  }

  static defaultFillColor: Color = Color.LightGray

  //  the default fill color

  static get DefaultFillColor(): Color {
    return DrawingNode.defaultFillColor
  }
  static set DefaultFillColor(value: Color) {
    DrawingNode.defaultFillColor = value
  }

  private fillcolor: Color = Color.Transparent

  // Node fill color.

  get FillColor(): Color {
    return this.fillcolor
  }
  set FillColor(value: Color) {
    this.fillcolor = value
    //RaiseVisualsChangedEvent(this, null);
  }

  private shape: ShapeEnum = ShapeEnum.Box

  //  Node shape.

  get ShapeEnum(): ShapeEnum {
    return this.shape
  }
  set ShapeEnum(value: ShapeEnum) {
    this.shape = value
    //RaiseVisualsChangedEvent(this, null);
  }

  labelMargin = 1

  //  the node label margin

  get LabelMargin(): number {
    return this.labelMargin
  }
  set LabelMargin(value: number) {
    this.labelMargin = value
    //RaiseVisualsChangedEvent(this, null);
  }
  constructor(n: Node) {
    super(n)
    if (n != null) {
      this.label = new DrawingLabel(n.id)
    }
    this.fontname = DrawingObject.defaultLabelFontName
    this.fontsize = DrawingObject.defaultLabelFontSize
  }
  //  the non adgjacent edges should avoid being closer to the node than Padding

  private labelWidthToHeightRatio = 1

  //  the label width to height ratio.

  get LabelWidthToHeightRatio(): number {
    return this.labelWidthToHeightRatio
  }
  set LabelWidthToHeightRatio(value: number) {
    this.labelWidthToHeightRatio = value
  }
  get node(): Node {
    return this.attrCont as Node
  }
}
