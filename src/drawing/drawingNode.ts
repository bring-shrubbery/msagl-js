import {DrawingObject} from './drawingObject'
import {Node} from '../layoutPlatform/structs/node'
import {Color} from './color'
import {Shape} from './shape'
import {DrawingLabel} from './drawingLabel'

export class NodeAttr {
  padding = 2
  fillColor: Color
  get Padding(): number {
    return this.padding
  }
  set Padding(value: number) {
    this.padding = Math.max(0, value)
    // //RaiseVisualsChangedEvent(this, null);
  }
  xRad = 3

  /// x radius of the rectangle box

  get XRadius(): number {
    return this.xRad
  }
  set XRadius(value: number) {
    this.xRad = value
    //RaiseVisualsChangedEvent(this, null);
  }

  yRad = 3

  ///  y radius of the rectangle box

  get YRadius(): number {
    return this.yRad
  }
  set YRadius(value: number) {
    this.yRad = value
  }

  static defaultFillColor: Color = Color.LightGray

  ///  the default fill color

  static get DefaultFillColor(): Color {
    return NodeAttr.defaultFillColor
  }
  static set DefaultFillColor(value: Color) {
    NodeAttr.defaultFillColor = value
  }

  private fillcolor: Color = Color.Transparent

  /// Node fill color.

  get FillColor(): Color {
    return this.fillcolor
  }
  set FillColor(value: Color) {
    this.fillcolor = value
    //RaiseVisualsChangedEvent(this, null);
  }

  private shape: Shape = Shape.Box

  ///  Node shape.

  get Shape(): Shape {
    return this.shape
  }
  set Shape(value: Shape) {
    this.shape = value
    //RaiseVisualsChangedEvent(this, null);
  }

  labelMargin = 1

  ///  the node label margin

  get LabelMargin(): number {
    return this.labelMargin
  }
  set LabelMargin(value: number) {
    this.labelMargin = value
    //RaiseVisualsChangedEvent(this, null);
  }
}

export class DrawingNode extends DrawingObject {
  label: DrawingLabel
  attr: NodeAttr
  constructor(n: Node) {
    super(n)
    this.label = new DrawingLabel(n.id)
  }
  ///  the non adgjacent edges should avoid being closer to the node than Padding

  private labelWidthToHeightRatio = 1

  ///  the label width to height ratio.

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
