import {GeomObject} from './geomObject'
import {Rectangle} from './../../math/geometry/rectangle'
export class GeomLabel extends GeomObject {
  boundingBox: Rectangle
  get width() {
    return this.boundingBox.width
  }
  get height() {
    return this.boundingBox.height
  }
}
