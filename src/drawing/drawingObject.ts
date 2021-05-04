import {AttrContainer} from '../layoutPlatform/structs/attrContainer'
import {Color} from './color'
import {ShapeEnum} from './shapeEnum'
import {StyleEnum} from './styleEnum'

export abstract class DrawingObject {
  // not all attributes can be used in derived classes
  color: Color
  fillColor: Color
  labelfontcolor: Color
  labelText: string
  headlabel: string
  taillabel: string
  fontColor: Color
  styleEnum: StyleEnum
  attrCont: AttrContainer // this is the field from main graph
  shapeEnum: ShapeEnum
  pencolor: Color
  peripheries: number

  bind() {
    if (this.attrCont != null) {
      this.attrCont.setAttr(1, this) // the attribute at 0 is for geometry, at 1 is for drawing
    }
  }

  constructor(attrCont: AttrContainer) {
    this.attrCont = attrCont
    this.bind()
  }

  static getDrawingObj(attrCont: AttrContainer): DrawingObject {
    if (attrCont == null) {
      return null
    } else {
      return attrCont.getAttr(1) // the attribute at 0 is for geometry, at 1 is for drawing
    }
  }
}
