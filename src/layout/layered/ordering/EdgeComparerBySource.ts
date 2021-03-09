import {LayerEdge} from '../LayerEdge'

export class EdgeComparerBySource {
  X: number[]
  constructor(X: number[]) {
    this.X = X
  }

  Compare(a: LayerEdge, b: LayerEdge) {
    const r = this.X[a.Source] - this.X[b.Source]
    if (r != 0) return r

    return this.X[a.Target] - this.X[b.Target]
  }
}
