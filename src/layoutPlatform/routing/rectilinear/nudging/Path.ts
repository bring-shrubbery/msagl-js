import {String} from 'typescript-string-operations'
import {Point} from '../../../..'
import {EdgeGeometry} from '../../../layout/core/edgeGeometry'
import {Assert} from '../../../utils/assert'
import {PathEdge} from './PathEdge'

///  represents the path for an EdgeGeometry
export class Path {
  ///  the corresponding edge geometry
  ///  </summary>
  EdgeGeometry: EdgeGeometry

  ///  <summary>
  ///  the path points
  ///  </summary>
  PathPoints: Iterable<Point>
  get Width(): number {
    return this.EdgeGeometry.lineWidth
  }

  ///  <summary>
  ///  constructor
  ///  </summary>
  ///  <param name="edgeGeometry"></param>
  constructor(edgeGeometry: EdgeGeometry) {
    this.EdgeGeometry = edgeGeometry
  }

  get End(): Point {
    return this.LastEdge.Target
  }

  get Start(): Point {
    return this.FirstEdge.Source
  }

  *PathEdges(): IterableIterator<PathEdge> {
    for (let e = this.FirstEdge; e != null; e = e.Next) {
      yield e
    }
  }

  FirstEdge: PathEdge
  LastEdge: PathEdge

  AddEdge(edge: PathEdge) {
    edge.Path = this
    Assert.assert(edge.Source == this.LastEdge.Target)
    this.LastEdge.Next = edge
    edge.Prev = this.LastEdge
    this.LastEdge = edge
  }

  SetFirstEdge(edge: PathEdge) {
    this.FirstEdge = edge
    this.LastEdge = edge
    edge.Path = this
  }

  ///  <summary>
  ///
  ///  </summary>
  ///  <returns></returns>
  public /* override */ ToString(): string {
    return String.Format(
      '{0}->{1}',
      this.EdgeGeometry.sourcePort.Location,
      this.EdgeGeometry.targetPort.Location,
    )
  }
}
