import {AttrContainer} from '../layoutPlatform/structs/attrContainer'

export abstract class DrawingObject {
  attrCont: AttrContainer // this is the field from the
  bind() {
    this.attrCont.setAttr(1, this) // the attribute at 0 is for geometry, at 1 is for drawing
  }

  constructor(attrCont: AttrContainer) {
    this.attrCont = attrCont
    this.bind()
  }

  static getDrawingObj(attrCont: AttrContainer): DrawingObject {
    return attrCont.getAttr(1) // the attribute at 0 is for geometry, at 1 is for drawing
  }
}
