import {Point} from './../../math/geometry/point'
import {Assert} from './../../utils/assert'
import {String} from 'typescript-string-operations'
//  an edge connecting two VisibilityVertices
export class VisibilityEdge {
  LengthMultiplier = 1

  constructor(source: VisibilityVertex, target: VisibilityVertex, weight = 1) {
    Assert.assert(source.Point != target.Point, 'Self-edges are not allowed')
    this.Source = source
    this.Target = target
    this.Weight = weight
  }

  Weight: number
  static DefaultWeight = 1

  IsPassable: () => boolean

  //  edge source point
  public get SourcePoint(): Point {
    return this.Source.Point
  }

  //  edge target point
  public get TargetPoint(): Point {
    return this.Target.Point
  }

  Source: VisibilityVertex
  Target: VisibilityVertex

  get Length(): number {
    return this.SourcePoint.sub(this.TargetPoint).length * this.LengthMultiplier
  }

  toString(): string {
    return String.Format(
      '{0}->{1} ({2})',
      this.Source,
      this.Target,
      this.Weight,
    )
  }

  ReversedClone(): VisibilityEdge {
    return new VisibilityEdge(this.Target, this.Source)
  }

  Clone(): VisibilityEdge {
    return new VisibilityEdge(this.Source, this.Target)
  }
}
