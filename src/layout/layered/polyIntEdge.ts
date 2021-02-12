import { IEdge } from './../../structs/iedge'
import { IIntEdge } from './iIntEdge'
import { GeomEdge } from './../core/geomEdge'
import { ICurve } from './../../math/geometry/icurve'
import { LayerEdge } from './layerEdge'
class Routing {
  static updateLabel(edge: GeomEdge, anchor: Anchor) {
    throw new Error()
  }
}
class Anchor {
}
// An edge with source and target represented as integers, they point to the array of Nodes of the graph
export class PolyIntEdge implements IIntEdge {
  source: number
  target: number
  reversed: boolean
  // separation request in number of layers between the sourse and the target layers
  separation: number // should be maintained by sugiama settings
  weight: number // should be maintained by sugiama settings
  crossingWeight: number // - should be maintained by sugiama settings
  // If true it is a dummy edge that will not be drawn; serves as a place holder.
  isVirtualEdge: boolean
  layerEdges: LayerEdge[]


  constructor(source: number, target: number) {
    this.source = source;
    this.target = target;
  }

  hasLabel: boolean

  get labelWidth() { return this.edge.label.width; }
  get labelHeight() { return this.edge.label.height; }


  // This function changes the edge by swapping source and target. 
  reverse() {
    const t = this.source;
    this.source = this.target;
    this.target = t;
    this.reversed = !this.reversed;
  }


  // The original edge corresponding to the PolyIntEdge
  edge: GeomEdge

  // constructor
  static mkPolyIntEdge(source: number, target: number, edge: GeomEdge) {
    const pe = new PolyIntEdge(source, target)
    pe.source = source;
    pe.target = target;
    pe.edge = edge;
    return pe
  }


  toString(): string {
    return "edge(" + this.source + "->" + this.target + ")";
  }

  get curve(): ICurve { return this.edge.curve; }

  set curve(value) { this.edge.curve = value; }

  get underlyingPolyline() { return this.edge.underlyingPolyline }
  set underlyingPolyline(value) { this.edge.underlyingPolyline = value; }



  get layerSpan() {
    return this.layerEdges != null ? this.layerEdges.length : 0;
  }


  isSelfEdge(): boolean {
    return this.source == this.target;
  }

  reversedClone() {
    const ret = PolyIntEdge.mkPolyIntEdge(this.target, this.source, this.edge);
    if (this.layerEdges != null) {
      const len = this.layerEdges.length;
      ret.layerEdges = new Array<LayerEdge>(len);
      for (let i = 0; i < len; i++) {
        const le = this.layerEdges[len - 1 - i];
        ret.layerEdges[i] = new LayerEdge(le.target, le.source, le.crossingWeight);
      }
      ret.layerEdges[0].source = this.target;
      ret.layerEdges[this.layerEdges.length - 1].target = this.source;
    }
    return ret;
  }

  get count(): number { return this.layerEdges.length; }



  updateEdgeLabelPosition(anchors: Anchor[]) {
    if (this.edge.label != null) {
      const m = this.layerEdges.length / 2;
      const layerEdge = this.layerEdges[m];
      Routing.updateLabel(this.edge, anchors[layerEdge.source]);
    }
  }


  // enumerates over virtual virtices corresponding to the original edge
  * getEnumerator(): IterableIterator<number> {
    yield this.layerEdges[0].source;
    for (const le of this.layerEdges)
      yield le.target;
  }

}

