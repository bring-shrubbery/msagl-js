import { IEnumerable, InvalidOperationException } from "linq-to-typescript"
import { Point, TriangleOrientation } from "../../math/geometry/point"
import { Polyline } from "../../math/geometry/polyline"
import { PolylinePoint } from "../../math/geometry/polylinePoint"
import { Assert } from "../../utils/assert"
import { PointMap } from "../../utils/PointMap"
import { VisibilityEdge } from "./VisibilityEdge"
import { VisibilityKind } from "./VisibilityKind"
import { VisibilityVertex } from "./VisibilityVertex"
class Polygon {
  constructor(hole: Object) {

  }
}
class TangentVisibilityGraphCalculator {
  static AddTangentVisibilityEdgesToGraph(polygons: Polygon[], visibilityGraph: VisibilityGraph) {
    throw new Error("Method not implemented.")
  }
}

class PointVisibilityCalculator {
  static CalculatePointVisibilityGraph: any
}






























//  the visibility graph
export class VisibilityGraph {
  _prevEdgesDictionary: Map<
    VisibilityVertex,
    VisibilityEdge
  > = new Map<VisibilityVertex, VisibilityEdge>()

  visVertexToId: Map<VisibilityVertex, number> = new Map<
    VisibilityVertex,
    number
  >()

  ClearPrevEdgesTable() {
    this._prevEdgesDictionary.clear()
  }

  ShrinkLengthOfPrevEdge(v: VisibilityVertex, lengthMultiplier: number) {
    this._prevEdgesDictionary.get(v).LengthMultiplier = lengthMultiplier
  }

  //  needed for shortest path calculations
  PreviosVertex(v: VisibilityVertex): VisibilityVertex {
    const prev = this._prevEdgesDictionary.get(v)
    if (prev == null) {
      return null
    }

    if (prev.Source == v) {
      return prev.Target
    }

    return prev.Source
  }

  SetPreviousEdge(v: VisibilityVertex, e: VisibilityEdge) {
    Assert.assert(v == e.Source || v == e.Target)
    this._prevEdgesDictionary.set(v, e)
  }

  //  the default is just to return VisibilityVertex
  VertexFactory: (Point) => VisibilityVertex

  pointToVertexMap: PointMap<VisibilityVertex> = new PointMap<VisibilityVertex>()

  static GetVisibilityGraphForShortestPath(
    pathStart: Point,
    pathEnd: Point,
    obstacles: IEnumerable<Polyline>,
    /* out */ sourceVertex: VisibilityVertex,
    /* out */ targetVertex: VisibilityVertex,
  ): VisibilityGraph {
    const holes = [...OrientHolesClockwise(obstacles)]
    const visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes)
    const polygons = holes.map((hole) => new Polygon(hole))
    TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(
      polygons,
      visibilityGraph,
    )
    PointVisibilityCalculator.CalculatePointVisibilityGraph(
      holes,
      visibilityGraph,
      pathStart,
      VisibilityKind.Tangent,
      /* out */ sourceVertex,
    )
    PointVisibilityCalculator.CalculatePointVisibilityGraph(
      holes,
      visibilityGraph,
      pathEnd,
      VisibilityKind.Tangent,
      /* out */ targetVertex,
    )
    return visibilityGraph
  }

  //  Calculates the tangent visibility graph
  //  <param name="obstacles">a list of polylines representing obstacles</param>
  //  <returns></returns>
  public static FillVisibilityGraphForShortestPath(
    obstacles: IEnumerable<Polyline>,
  ): VisibilityGraph {
    const holes = [...OrientHolesClockwise(obstacles)]
    const visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes)
    const polygons = holes.map((hole) => new Polygon(hole))
    TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(
      polygons,
      visibilityGraph,
    )
    return visibilityGraph
  }

  static CalculateGraphOfBoundaries(holes: Array<Polyline>): VisibilityGraph {
    const graphOfHoleBoundaries = new VisibilityGraph()
    for (const polyline of holes) {
      graphOfHoleBoundaries.AddHole(polyline)
    }

    return graphOfHoleBoundaries
  }

  AddHole(polyline: Polyline) {
    const p = polyline.startPoint
    while (p != polyline.endPoint) {
      this.addEdge(p, p.next)
      p = p.next
    }

    this.addEdge(polyline.endPoint, polyline.startPoint)
  }


  static CheckThatPolylinesAreConvex(holes: IEnumerable<Polyline>) {
    for (const polyline of holes) {
      VisibilityGraph.CheckThatPolylineIsConvex(polyline)
    }
  }

  @SuppressMessage('Microsoft.Usage', 'CA2201:DoNotRaiseReservedExceptionTypes')
  static CheckThatPolylineIsConvex(polyline: Polyline) {
    Assert.assert(polyline.Closed, 'Polyline is not closed')
    const a: PolylinePoint = polyline.startPoint
    const b: PolylinePoint = a.next
    const c: PolylinePoint = b.next
    const orient: TriangleOrientation = Point.GetTriangleOrientation(
      a.Point,
      b.Point,
      c.Point,
    )
    while (c != polyline.endPoint) {
      a = a.next
      b = b.next
      c = c.next
      const currentOrient = Point.GetTriangleOrientation(
        a.Point,
        b.Point,
        c.Point,
      )
      if (currentOrient == TriangleOrientation.Collinear) {
        // TODO: Warning!!! continue If
      }

      if (orient == TriangleOrientation.Collinear) {
        orient = currentOrient
      } else if (orient != currentOrient) {
        throw new InvalidOperationException()
      }
    }

    const o = Point.GetTriangleOrientation(
      polyline.endPoint.Point,
      polyline.startPoint.Point,
      polyline.startPoint.next.Point,
    )
    if (o != TriangleOrientation.Collinear && o != orient) {
      throw new InvalidOperationException()
    }
  }

  //  TEST || VERIFY
  //  Enumerate all VisibilityEdges in the VisibilityGraph.
  public get Edges(): IEnumerable<VisibilityEdge> {
    return PointToVertexMap.Values.SelectMany((vertex) => vertex.OutEdges)
  }

  get PointToVertexMap(): Map<Point, VisibilityVertex> {
    return this.pointToVertexMap
  }

  get VertexCount(): number {
    return this.PointToVertexMap.Count
  }

  AddVertex(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.AddVertex(polylinePoint.Point)
  }

  AddVertex(point: Point): VisibilityVertex {
    const currentVertex: VisibilityVertex
    if (this.PointToVertexMap.TryGetValue(point, /* out */ currentVertex)) {
      return currentVertex
    }

    const newVertex = VertexFactory(point)
    this.PointToVertexMap[point] = newVertex
    return newVertex
  }

  AddVertex(vertex: VisibilityVertex) {
    Assert.assert(
      !this.PointToVertexMap.ContainsKey(vertex.Point),
      'A vertex already exists at this location',
    )
    this.PointToVertexMap[vertex.Point] = vertex
  }

  ContainsVertex(point: Point): boolean {
    return this.PointToVertexMap.ContainsKey(point)
  }

  static AddEdge_vv(
    source: VisibilityVertex,
    target: VisibilityVertex,
  ): VisibilityEdge {
    const visEdge: VisibilityEdge
    if (source.TryGetEdge(target, /* out */ visEdge)) {
      return visEdge
    }

    if (source == target) {
      Assert.assert(false, 'Self-edges are not allowed')
      throw new InvalidOperationException('Self-edges are not allowed')
    }

    const edge = new VisibilityEdge(source, target)
    source.OutEdges.Insert(edge)
    target.InEdges.Add(edge)
    return edge
  }

  AddEdge_PolyPoly(source: PolylinePoint, target: PolylinePoint) {
    this.addEdge(source.Point, target.Point)
  }

  static AddEdge(edge: VisibilityEdge) {
    Assert.assert(edge.Source != edge.Target)
    edge.Source.OutEdges.Insert(edge)
    edge.Target.InEdges.Add(edge)
  }

  AddEdge_PointPoint(source: Point, target: Point): VisibilityEdge {
    const edge: VisibilityEdge
    const sourceV = this.FindVertex(source)
    const targetV: VisibilityVertex = null
    if (sourceV != null) {
      targetV = this.FindVertex(target)
      if (targetV != null && sourceV.TryGetEdge(targetV, /* out */ edge)) {
        return edge
      }
    }

    if (sourceV == null) {
      // then targetV is also null
      sourceV = this.AddVertex(source)
      targetV = this.AddVertex(target)
    } else if (targetV == null) {
      targetV = this.AddVertex(target)
    }

    edge = new VisibilityEdge(sourceV, targetV)
    sourceV.OutEdges.Insert(edge)
    targetV.InEdges.Add(edge)
    return edge
  }

  AddEdge_pp_ec(
    source: Point,
    target: Point,
    edgeCreator: Func<VisibilityVertex, VisibilityVertex, VisibilityEdge>,
  ): VisibilityEdge {
    const edge: VisibilityEdge
    const sourceV = this.FindVertex(source)
    const targetV: VisibilityVertex = null
    if (sourceV != null) {
      targetV = this.FindVertex(target)
      if (targetV != null && sourceV.TryGetEdge(targetV, /* out */ edge)) {
        return edge
      }
    }

    if (sourceV == null) {
      // then targetV is also null
      sourceV = this.AddVertex(source)
      targetV = this.AddVertex(target)
    } else if (targetV == null) {
      targetV = this.AddVertex(target)
    }

    edge = edgeCreator(sourceV, targetV)
    sourceV.OutEdges.Insert(edge)
    targetV.InEdges.Add(edge)
    return edge
  }

  FindVertex(point: Point): VisibilityVertex {
    return this.PointToVertexMap.get(point)
  }

  GetVertex(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.FindVertex(polylinePoint.Point)
  }

  Vertices(): IEnumerable<VisibilityVertex> {
    return this.PointToVertexMap.Values
  }

  RemoveVertex(vertex: VisibilityVertex) {
    //  Assert.assert(PointToVertexMap.ContainsKey(vertex.Point), "Cannot find vertex in PointToVertexMap");
    for (const edge of vertex.OutEdges) {
      edge.Target.RemoveInEdge(edge)
    }

    for (const edge of vertex.InEdges) {
      edge.Source.RemoveOutEdge(edge)
    }

    this.PointToVertexMap.Remove(vertex.Point)
  }

  RemoveEdge(v1: VisibilityVertex, v2: VisibilityVertex) {
    const edge: VisibilityEdge
    if (!v1.TryGetEdge(v2, /* out */ edge)) {
      return
    }

    edge.Source.RemoveOutEdge(edge)
    edge.Target.RemoveInEdge(edge)
  }

  RemoveEdge(p1: Point, p2: Point) {
    //  the order of p1 and p2 is not important.
    const edge: VisibilityEdge = this.FindEdge(p1, p2)
    if (edge == null) {
      return
    }

    edge.Source.RemoveOutEdge(edge)
    edge.Target.RemoveInEdge(edge)
  }

  static FindEdge(edge: VisibilityEdge): VisibilityEdge {
    if (edge.Source.TryGetEdge(edge.Target, /* out */ edge)) {
      return edge
    }

    return null
  }

  FindEdge(source: Point, target: Point): VisibilityEdge {
    const sourceV = this.FindVertex(source)
    if (sourceV == null) {
      return null
    }

    const targetV = this.FindVertex(target)
    if (targetV == null) {
      return null
    }

    const edge: VisibilityEdge
    if (sourceV.TryGetEdge(targetV, /* out */ edge)) {
      return edge
    }

    return null
  }

  static RemoveEdge(edge: VisibilityEdge) {
    edge.Source.OutEdges.Remove(edge)
    // not efficient!
    edge.Target.InEdges.Remove(edge)
    // not efficient
  }

  public ClearEdges() {
    for (const visibilityVertex of this.Vertices()) {
      visibilityVertex.ClearEdges()
    }
  }
}
function* OrientHolesClockwise(
  holes: IEnumerable<Polyline>
): IterableIterator<Polyline> {
  //     #if((TEST_MSAGL || VERIFY))
  // VisibilityGraph.CheckThatPolylinesAreConvex(holes);
  //     #endif
  //  TEST || VERIFY
  for (const poly of holes) {
    for (const p = poly.startPoint; ; p = p.next) {
      //  Find the first non-collinear segments and see which direction the triangle is.
      //  If it's consistent with Clockwise, then return the polyline, else return its Reverse.
      const orientation = Point.GetTriangleOrientation(
        p.Point,
        p.next.Point,
        p.next.next.Point,
      )
      if (orientation != TriangleOrientation.Collinear) {
        yield orientation == TriangleOrientation.Clockwise
          ? poly
          : poly.Reverse()
        break
      }
    }
  }
}
