import {GeomObject} from './geomObject'
import {Rectangle} from './../../math/geometry/rectangle'
import {AttrContainer} from '../../structs/attrContainer'
import {Label} from '../../structs/label'
// import {Assert} from '../../utils/assert'
export class GeomLabel extends GeomObject {
  constructor(boundingBox: Rectangle, label: Label) {
    super(label)
    /*Assert.assert(label instanceof Label)*/
    this.boundingBox = boundingBox
  }
  get label() {
    return <Label>this.attrCont
  }
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
