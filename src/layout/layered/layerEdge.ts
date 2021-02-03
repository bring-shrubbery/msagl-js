import { String } from 'typescript-string-operations'
export class LayerEdge {
  weight: number
  crossingWeight: number
  source: number
  target: number
  constructor(source: number, target: number, crossingWeight: number, weight = 1) {
    this.source = source;
    this.target = target;
    this.crossingWeight = crossingWeight;
    this.weight = weight;
  }
  toString() {
    return String.Format("{0}->{1}", this.source, this.target);
  }
}

