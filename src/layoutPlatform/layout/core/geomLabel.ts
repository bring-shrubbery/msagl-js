import {GeomObject} from './geomObject'
import {Rectangle} from './../../math/geometry/rectangle'
export class GeomLabel extends GeomObject {
  boundingBox: Rectangle
  get width() {
    return this.boundingBox.width
  }
  set width(value) {
    this.boundingBox.width = value
  }
  get height() {
    return this.boundingBox.height
  }
  set height(value) {
    this.boundingBox.height = value
  }
  get center() {
    return this.boundingBox.center
  }
  set center(value) {
    this.boundingBox.center = value
  }
}
