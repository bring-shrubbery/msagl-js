import {LayerEdge} from '../LayerEdge'

export class EdgeComparerByTarget {
  X: number[]
  constructor(X: number[]) {
    this.X = X
  }

  Compare(a: LayerEdge, b: LayerEdge) {
    const r = this.X[a.Target] - this.X[b.Target]
    if (r != 0) return r

    return this.X[a.Source] - this.X[b.Source]
  }
}
