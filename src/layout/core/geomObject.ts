import {Entity} from './../../structs/entity'
import {AttrContainer} from './../../structs/attrContainer'
import {Rectangle} from './../../math/geometry/rectangle'
export abstract class GeomObject {
  abstract boundingBox: Rectangle
  attrCont: AttrContainer
  bindWithGeom() {
    this.attrCont.setAttr(0, this)
  }

  constructor(attrCont: AttrContainer) {
    this.attrCont = attrCont
    this.bindWithGeom()
  }

  static getGeom(attrCont: AttrContainer) {
    return attrCont.getAttr(0)
  }
}
