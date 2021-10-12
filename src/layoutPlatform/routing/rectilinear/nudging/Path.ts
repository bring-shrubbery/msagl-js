import {StringBuilder} from 'typescript-string-operations'
import {Point} from '../../../..'
import {EdgeGeometry} from '../../../layout/core/edgeGeometry'
// import {Assert} from '../../../utils/assert'
import {LinkedPoint} from './LinkedPoint'
import {PathEdge} from './PathEdge'

///  represents the path for an EdgeGeometry
export class Path {
  ///  the corresponding edge geometry

  EdgeGeometry: EdgeGeometry

  ///  the path points

  private _pathPoints: Array<Point> | LinkedPoint
  public get PathPoints(): Array<Point> | LinkedPoint {
    return this._pathPoints
  }
  public set PathPoints(value: Array<Point> | LinkedPoint) {
    this._pathPoints = value
  }
  get Width(): number {
    return this.EdgeGeometry.lineWidth
  }

  ///  constructor

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

  ArrayOfPathPoints(): Point[] {
    if (this._pathPoints instanceof LinkedPoint) {
      return Array.from(iteratePoints(this._pathPoints))
    } else {
      return this._pathPoints
    }
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
    /*Assert.assert(edge.Source == this.LastEdge.Target)*/
    this.LastEdge.Next = edge
    edge.Prev = this.LastEdge
    this.LastEdge = edge
  }

  SetFirstEdge(edge: PathEdge) {
    this.FirstEdge = edge
    this.LastEdge = edge
    edge.Path = this
  }

  ///

  ///  <returns></returns>
  toString(): string {
    const sb: StringBuilder = new StringBuilder()
    if (this.PathPoints instanceof LinkedPoint) sb.Append('L')
    for (const p of iteratePoints(this.PathPoints)) sb.Append(p.toString())
    return sb.ToString()
  }
}
function* iteratePoints(
  pathPoints: LinkedPoint | Point[],
): IterableIterator<Point> {
  if (pathPoints instanceof LinkedPoint) {
    for (let p = <LinkedPoint>pathPoints; p != null; p = p.Next) {
      yield p.Point
    }
  } else {
    for (const p of pathPoints) yield p
  }
}
