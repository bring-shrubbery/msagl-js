import {Graph} from '../../structs/graph'
import {Rectangle} from '../../math/geometry/rectangle'
import {GeomObject} from './geomObject'
import {GeomNode} from './geomNode'
import {GeomEdge} from './geomEdge'

export class GeomGraph extends GeomObject {
  *nodes(): IterableIterator<GeomNode> {
    for (const n of this.graph.nodes) yield GeomObject.getGeom(n) as GeomNode
  }

  *edges(): IterableIterator<GeomEdge> {
    for (const n of this.graph.edges) yield GeomObject.getGeom(n) as GeomEdge
  }

  boundingBox = Rectangle.mkEmpty()

  constructor(graph: Graph) {
    super(graph)
  }

  get graph() {
    return this.attrCont as Graph
  }

  updateBoundingBox() {
    this.boundingBox = Rectangle.mkEmpty()
    let padding = 0
    for (const e of this.graph.edges) {
      const ge = GeomObject.getGeom(e) as GeomEdge
      this.boundingBox.addRec(ge.boundingBox)
      padding = Math.max(padding, ge.lineWidth)
    }
    for (const n of this.graph.nodes) {
      const gn = GeomObject.getGeom(n) as GeomNode
      this.boundingBox.addRec(gn.boundingBox)
      padding = Math.max(padding, gn.padding)
    }
    this.boundingBox.pad(padding)
  }
}
