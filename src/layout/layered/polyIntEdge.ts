import {IEdge} from './../../structs/iedge'
import {IIntEdge} from './iIntEdge'
import {GeomEdge} from './../core/geomEdge'
import {ICurve} from './../../math/geometry/icurve'
import {LayerEdge} from './LayerEdge'
import {Anchor} from './anchor'

class Routing {
  static updateLabel(edge: GeomEdge, anchor: Anchor) {
    throw new Error()
  }
}

// An edge with source and target represented as integers,
// they point to the array of Nodes of the graph
export class PolyIntEdge implements IIntEdge {
  source: number
  target: number
  reversed: boolean
  // separation request in the number of layers between the source and the target layers
  separation: number
  weight: number
  CrossingWeight: number
  // If true it is a dummy edge that will not be drawn; serves as a place holder.
  IsVirtualEdge: boolean
  LayerEdges: LayerEdge[]
  // the original edge
  geomEdge: GeomEdge

  constructor(source: number, target: number, geomEdge: GeomEdge) {
    this.source = source
    this.target = target
    this.geomEdge = geomEdge
  }

  hasLabel: boolean

  get labelWidth() {
    return this.edge.label.width
  }
  get labelHeight() {
    return this.edge.label.height
  }

  // This function changes the edge by swapping source and target.
  reverse() {
    const t = this.source
    this.source = this.target
    this.target = t
    this.reversed = !this.reversed
  }

  // The original edge corresponding to the PolyIntEdge
  edge: GeomEdge

  toString(): string {
    return 'edge(' + this.source + '->' + this.target + ')'
  }

  get curve(): ICurve {
    return this.edge.curve
  }

  set curve(value) {
    this.edge.curve = value
  }

  get underlyingPolyline() {
    return this.edge.underlyingPolyline
  }
  set underlyingPolyline(value) {
    this.edge.underlyingPolyline = value
  }

  get LayerSpan() {
    return this.LayerEdges != null ? this.LayerEdges.length : 0
  }

  isSelfEdge(): boolean {
    return this.source == this.target
  }

  reversedClone() {
    const ret = new PolyIntEdge(this.target, this.source, this.edge)
    if (this.LayerEdges != null) {
      const len = this.LayerEdges.length
      ret.LayerEdges = new Array<LayerEdge>(len)
      for (let i = 0; i < len; i++) {
        const le = this.LayerEdges[len - 1 - i]
        ret.LayerEdges[i] = new LayerEdge(
          le.Target,
          le.Source,
          le.CrossingWeight,
        )
      }
      ret.LayerEdges[0].Source = this.target
      ret.LayerEdges[this.LayerEdges.length - 1].Target = this.source
    }
    return ret
  }

  get count(): number {
    return this.LayerEdges.length
  }

  updateEdgeLabelPosition(anchors: Anchor[]) {
    if (this.edge.label != null) {
      const m = this.LayerEdges.length / 2
      const layerEdge = this.LayerEdges[m]
      Routing.updateLabel(this.edge, anchors[layerEdge.Source])
    }
  }

  // enumerates over virtual virtices corresponding to the original edge
  *getEnumerator(): IterableIterator<number> {
    yield this.LayerEdges[0].Source
    for (const le of this.LayerEdges) yield le.Target
  }
}
