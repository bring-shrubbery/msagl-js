import { PolyIntEdge } from './polyIntEdge'
import { IEdge } from '../../structs/iedge'
import { IntPairMap } from '../../utils/IntPairMap'
import { IntPair } from '../../utils/IntPair'
import { Anchor } from './anchor'

export class Database {
  Anchors: Anchor[]
  MultipleMiddles = new Set<number>()
  Multiedges: IntPairMap<PolyIntEdge[]>
  * RegularMultiedges(): IterableIterator<PolyIntEdge[]> {
    for (const kv of this.Multiedges.keyValues())
      if (kv[0].x != kv[0].y)
        yield kv[1];
  }

  * AllIntEdges(): IterableIterator<PolyIntEdge> {
    for (const l of this.Multiedges.values())
      for (const e of l)
        yield e
  }

  addFeedbackSet(feedbackSet: IEdge[]) {
    for (const e of feedbackSet) {
      const ip = new IntPair(e.Source, e.Target)
      const ipr = new IntPair(e.Target, e.Source)

      //we shuffle reversed edges into the other multiedge
      const listToShuffle = this.Multiedges.get(ip.x, ip.y)
      for (const er of listToShuffle) er.reverse()

      if (this.Multiedges.has(ipr.x, ipr.y)) {
        const m = this.Multiedges.get(ipr.x, ipr.y)
        for (const e of listToShuffle) m.push(e)
      } else {
        this.Multiedges.set(ipr.x, ipr.y, listToShuffle)
      }

      this.Multiedges.delete(ip.x, ip.y)
    }
  }
  constructor(n: number) {
    this.Multiedges = new IntPairMap(n)
  }
  registerOriginalEdgeInMultiedges(edge: PolyIntEdge) {
    let o = this.Multiedges.get(edge.Source, edge.Target)
    if (o == null) {
      this.Multiedges.set(edge.Source, edge.Target, (o = []))
    } else {
      console.log(o)
    }

    o.push(edge)
  }

  * SkeletonEdges(): IterableIterator<PolyIntEdge> {
    for (const kv of this.Multiedges.keyValues()) {
      if (kv[0].x != kv[0].y) yield kv[1][0]
    }
  }
}
