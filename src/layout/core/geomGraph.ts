import {Graph} from './../../structs/graph'
import {Rectangle} from './../../math/geometry/rectangle'
import {GeomObject} from './geomObject'
import {GeomNode} from './geomNode'
import {GeomEdge} from './geomEdge'

export class GeomGraph extends GeomObject {
  *nodes(): IterableIterator<GeomNode> {
    for (const kv of this.graph.nodes)
      yield GeomObject.getGeom(kv[1]) as GeomNode
  }

  *edges(): IterableIterator<GeomEdge> {
    for (const n of this.graph.edges) yield GeomObject.getGeom(n) as GeomEdge
  }

  private _boundingBox = Rectangle.mkEmpty()

  get boundingBox() {
    if (!this._boundingBox.isEmpty()) return this._boundingBox
    this.updateBoundingBox()
    return this._boundingBox
  }

  constructor(graph: Graph) {
    super(graph)
  }

  get graph() {
    return this.attrCont as Graph
  }

  updateBoundingBox() {
    this._boundingBox = Rectangle.mkEmpty()
    let padding = 0
    for (const e of this.graph.edges) {
      const ge = GeomObject.getGeom(e) as GeomEdge
      this._boundingBox.addRec(ge.boundingBox)
      padding = Math.max(padding, ge.lineWidth)
    }
    for (const pair of this.graph.nodes) {
      const gn = GeomObject.getGeom(pair[1]) as GeomNode
      this._boundingBox.addRec(gn.boundingBox)
      padding = Math.max(padding, gn.padding)
    }
    this._boundingBox.pad(padding)
  }
}
