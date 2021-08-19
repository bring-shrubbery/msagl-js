import {IEnumerable} from 'linq-to-typescript'
import {Point} from '../../../..'
import {Assert} from '../../../utils/assert'
import {AxisEdge} from './AxisEdge'

export class AxisEdgesContainer {
  edges: Set<AxisEdge> = new Set<AxisEdge>()

  get Edges(): Iterable<AxisEdge> {
    return this.edges
  }

  ///  <summary>
  ///  it is not necessarely the upper point but some point above the source
  ///  </summary>
  UpPoint: Point

  AddEdge(edge: AxisEdge) {
    this.UpPoint = edge.TargetPoint
    Assert.assert(!this.edges.has(edge))
    this.edges.add(edge)
  }

  constructor(source: Point) {
    this.Source = source
  }

  Source: Point
  RemoveAxis(edge: AxisEdge) {
    Assert.assert(this.edges.has(edge))
    this.edges.delete(edge)
  }

  IsEmpty(): boolean {
    return this.edges.size == 0
  }
}
