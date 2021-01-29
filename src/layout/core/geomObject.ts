import {Entity} from './../../structs/entity'
import {Rectangle} from './../../math/geometry/rectangle'
export abstract class GeomObject {
  abstract boundingBox: Rectangle
  entity: Entity
  bindWithGeom() {
    this.entity.setAttr(0, this) //todo introduce a notation for the attr indices
  }

  constructor(entity: Entity) {
    this.entity = entity
    this.bindWithGeom()
  }

  static getGeom(entity: Entity) {
    return entity.getAttr(0)
  }
}
