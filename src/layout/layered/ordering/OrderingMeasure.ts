export class OrderingMeasure {
  numberOfCrossings: number
  layerGroupDisbalance: number
  la: number[][]
  virtVertexStart: number
  // for the i-th layer the optimal size of an original group is optimalOriginalGroupSize[i]
  optimalOriginalGroupSize: number[]
  // for the i-th layer the optimal size of a virtual group is optimalOriginalGroupSize[i]
  optimalVirtualGroupSize: number[]

  constructor(
    layerArraysPar: number[][],
    numOfCrossings: number,
    virtualVertexStart: number,
    optimalOriginalGroupSizePar: number[],
    optimalVirtualGroupSizePar: number[],
  ) {
    this.numberOfCrossings = numOfCrossings
    this.la = layerArraysPar
    this.virtVertexStart = virtualVertexStart
    this.optimalVirtualGroupSize = optimalVirtualGroupSizePar
    this.optimalOriginalGroupSize = optimalOriginalGroupSizePar

    if (this.optimalOriginalGroupSize != null)
      this.CalculateLayerGroupDisbalance()
  }

  CalculateLayerGroupDisbalance() {
    for (let i = 0; i < this.la.length; i++)
      this.layerGroupDisbalance += this.LayerGroupDisbalance(
        this.la[i],
        this.optimalOriginalGroupSize[i],
        this.optimalVirtualGroupSize[i],
      )
  }

  LayerGroupDisbalance(
    l: number[],
    origGroupOptSize: number,
    virtGroupOptSize: number,
  ) {
    if (origGroupOptSize == 1)
      return this.LayerGroupDisbalanceWithOrigSeparators(l, virtGroupOptSize)
    else return this.LayerGroupDisbalanceWithVirtSeparators(l, origGroupOptSize)
  }

  LayerGroupDisbalanceWithVirtSeparators(
    l: number[],
    origGroupOptSize: number,
  ) {
    let ret = 0
    for (let i = 0; i < l.length;) {
      const r = this.CurrentOrigGroupDelta(i, l, origGroupOptSize)
      i = r.i
      ret += r.ret
    }
    return ret
  }

  CurrentOrigGroupDelta(
    i: number,
    l: number[],
    origGroupOptSize: number,
  ): { ret: number; i: number } {
    let groupSize = 0
    let j = i
    for (; j < l.length && l[j] < this.virtVertexStart; j++) groupSize++
    i = j + 1
    return { ret: Math.abs(origGroupOptSize - groupSize), i }
  }

  LayerGroupDisbalanceWithOrigSeparators(
    l: number[],
    virtGroupOptSize: number,
  ) {
    let ret = 0
    for (let i = 0; i < l.length;) {
      const r = this.CurrentVirtGroupDelta(i, l, virtGroupOptSize)
      ret += r.ret
    }
    return ret
  }

  CurrentVirtGroupDelta(
    i: number,
    l: number[],
    virtGroupOptSize: number,
  ): { ret: number; i: number } {
    let groupSize = 0
    let j = i
    for (; j < l.length && l[j] >= this.virtVertexStart; j++) groupSize++
    i = j + 1
    return { ret: Math.abs(virtGroupOptSize - groupSize), i: i }
  }

  static less(a: OrderingMeasure, b: OrderingMeasure) {
    if (a.numberOfCrossings < b.numberOfCrossings) return true
    if (a.numberOfCrossings > b.numberOfCrossings) return false

    return a.layerGroupDisbalance < b.layerGroupDisbalance
  }

  static greater(a: OrderingMeasure, b: OrderingMeasure) {
    if (a.numberOfCrossings > b.numberOfCrossings) return true
    if (a.numberOfCrossings < b.numberOfCrossings) return false

    return a.layerGroupDisbalance > b.layerGroupDisbalance
  }

  IsPerfect() {
    return this.numberOfCrossings == 0 && this.layerGroupDisbalance == 0
  }
}
