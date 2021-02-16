// A node of a GeomGraph
import {Assert} from './../../utils/assert'
import {ICurve} from './../../math/geometry/icurve'
import {Rectangle} from './../../math/geometry/rectangle'
import {Point} from './../../math/geometry/point'
import {CurveFactory} from './../../math/geometry/curveFactory'
import {PlaneTransformation} from './../../math/geometry/planeTransformation'
import {Node} from './../../structs/node'
import {GeomObject} from './geomObject'

export class GeomNode extends GeomObject {
  get node(): Node {
    return this.attrCont as Node
  }
  padding = 1
  boundaryCurve: ICurve

  // Creates a Node instance
  static mkNode(curve: ICurve, node: Node) {
    const n = new GeomNode(node)
    n.boundaryCurve = curve
    return n
  }

  // Fields which are set by Msagl
  // return the center of the curve bounding box
  get center() {
    return this.boundaryCurve.boundingBox.center
  }
  set center(value: Point) {
    const del = value.sub(this.center)
    this.boundaryCurve.translate(del)
  }

  // sets the bounding curve scaled to fit the targetBounds
  private fitBoundaryCurveToTarget(targetBounds: Rectangle) {
    if (this.boundaryCurve != null) {
      // RoundedRect is special, rather then simply scaling the geometry we want to keep the corner radii constant
      const radii = CurveFactory.isRoundedRect(this.boundaryCurve)
      if (radii == undefined) {
        Assert.assert(this.boundaryCurve.boundingBox.width > 0)
        Assert.assert(this.boundaryCurve.boundingBox.height > 0)
        const scaleX = targetBounds.width / this.boundaryCurve.boundingBox.width
        const scaleY =
          targetBounds.height / this.boundaryCurve.boundingBox.height

        this.boundaryCurve = this.boundaryCurve.scaleFromOrigin(scaleX, scaleY)
        this.boundaryCurve.translate(
          targetBounds.center.sub(this.boundaryCurve.boundingBox.center),
        )
      } else {
        this.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
          targetBounds.width,
          targetBounds.height,
          radii.radX,
          radii.radY,
          targetBounds.center,
        )
      }
    }
  }

  // the bounding box of the node
  get boundingBox() {
    return this.boundaryCurve != null
      ? this.boundaryCurve.boundingBox
      : Rectangle.mkEmpty()
  }
  set boundingBox(value: Rectangle) {
    if (
      Math.abs(value.width - this.width) < 0.0001 &&
      Math.abs(value.height - this.height) < 0.0001
    ) {
      this.center = value.center
    } else {
      this.fitBoundaryCurveToTarget(value)
    }
  }

  // width of the node does not include the padding
  get width() {
    return this.boundaryCurve.boundingBox.width
  }
  // height of the node does not including the padding
  get height() {
    return this.boundaryCurve.boundingBox.height
  }

  transform(t: PlaneTransformation) {
    if (this.boundaryCurve != null)
      this.boundaryCurve = this.boundaryCurve.transform(t)
  }
}
