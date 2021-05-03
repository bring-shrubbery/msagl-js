import {AttrContainer} from './../../structs/attrContainer'
import {Rectangle} from './../../math/geometry/rectangle'
export abstract class GeomObject {
  abstract boundingBox: Rectangle
  attrCont: AttrContainer
  bind() {
    this.attrCont.setAttr(0, this)
  }

  constructor(attrCont: AttrContainer) {
    this.attrCont = attrCont
    this.bind()
  }

  static getGeom(attrCont: AttrContainer): GeomObject {
    return attrCont.getAttr(0)
  }
}
