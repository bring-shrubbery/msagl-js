import { IEnumerable, from } from "linq-to-typescript"
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
  vertexFactory: (Point) => VisibilityVertex

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
    let p = polyline.startPoint
    while (p != polyline.endPoint) {
      this.addEdge_pp(p, p.next)
      p = p.next
    }

    this.addEdge_pp(polyline.endPoint, polyline.startPoint)
  }


  static CheckThatPolylinesAreConvex(holes: IEnumerable<Polyline>) {
    for (const polyline of holes) {
      VisibilityGraph.CheckThatPolylineIsConvex(polyline)
    }
  }

  static CheckThatPolylineIsConvex(polyline: Polyline) {
    Assert.assert(polyline.closed, 'Polyline is not closed')
    let a: PolylinePoint = polyline.startPoint
    let b: PolylinePoint = a.next
    let c: PolylinePoint = b.next
    let orient: TriangleOrientation = Point.getTriangleOrientation(
      a.point,
      b.point,
      c.point,
    )
    while (c != polyline.endPoint) {
      a = a.next
      b = b.next
      c = c.next
      const currentOrient = Point.getTriangleOrientation(
        a.point,
        b.point,
        c.point,
      )
      if (currentOrient == TriangleOrientation.Collinear) {
        // TODO: Warning!!! continue If
      }

      if (orient == TriangleOrientation.Collinear) {
        orient = currentOrient
      } else if (orient != currentOrient) {
        throw new Error()
      }
    }

    const o = Point.getTriangleOrientation(
      polyline.endPoint.point,
      polyline.startPoint.point,
      polyline.startPoint.next.point,
    )
    if (o != TriangleOrientation.Collinear && o != orient) {
      throw new Error()
    }
  }

  //  TEST || VERIFY
  //  Enumerate all VisibilityEdges in the VisibilityGraph.
  public get Edges(): IEnumerable<VisibilityEdge> {
    const fr = from(this.pointToVertexMap.values())
    return fr.selectMany((vertex) => vertex.OutEdges)
  }

  get VertexCount(): number {
    return this.pointToVertexMap.size
  }

  addVertex_plp(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.addVertex_point(polylinePoint.point)
  }

  addVertex_point(point: Point): VisibilityVertex {
    const currentVertex = this.pointToVertexMap.getP(point)
    if (currentVertex != null) {
      return currentVertex
    }

    const newVertex = this.vertexFactory(point)
    this.pointToVertexMap.setP(point, newVertex)
    return newVertex
  }

  AddVertex(vertex: VisibilityVertex) {
    Assert.assert(
      !this.pointToVertexMap.hasP(vertex.point),
      'A vertex already exists at this location',
    )
    this.pointToVertexMap.setP(vertex.point, vertex)
  }

  ContainsVertex(point: Point): boolean {
    return this.pointToVertexMap.hasP(point)
  }

  static addEdge_vv(
    source: VisibilityVertex,
    target: VisibilityVertex,
  ): VisibilityEdge {
    const visEdge = source.get(target)
    if (visEdge != null) {
      return visEdge
    }

    if (source == target) {
      Assert.assert(false, 'Self-edges are not allowed')
      throw new Error('Self-edges are not allowed')
    }

    const edge = new VisibilityEdge(source, target)
    source.OutEdges.insert(edge)
    target.InEdges.push(edge)
    return edge
  }

  addEdge_pp(source: PolylinePoint, target: PolylinePoint) {
    this.addEdge_PointPoint(source.point, target.point)
  }

  static addEdge(edge: VisibilityEdge) {
    Assert.assert(edge.Source != edge.Target)
    edge.Source.OutEdges.insert(edge)
    edge.Target.InEdges.push(edge)
  }

  addEdge_PointPoint(source: Point, target: Point): VisibilityEdge {
    let edge: VisibilityEdge
    let sourceV = this.FindVertex(source)
    let targetV: VisibilityVertex = null
    if (sourceV != null) {
      targetV = this.FindVertex(target)
      if (targetV != null) {
        edge = sourceV.get(targetV)
        if (edge != null) {
          return edge
        }
      }
    }

    if (sourceV == null) {
      // then targetV is also null
      sourceV = this.addVertex_point(source)
      targetV = this.addVertex_point(target)
    } else if (targetV == null) {
      targetV = this.addVertex_point(target)
    }

    edge = new VisibilityEdge(sourceV, targetV)
    sourceV.OutEdges.insert(edge)
    targetV.InEdges.push(edge)
    return edge
  }

  addEdge_pp_ec(
    source: Point,
    target: Point,
    edgeCreator: (a: VisibilityVertex, b: VisibilityVertex) => VisibilityEdge,
  ): VisibilityEdge {
    let edge: VisibilityEdge
    let sourceV = this.FindVertex(source)
    let targetV: VisibilityVertex = null
    if (sourceV != null) {
      targetV = this.FindVertex(target)
      if (targetV != null) {
        edge = sourceV.get(targetV)
        if (edge != null) {
          return edge
        }
      }
    }

    if (sourceV == null) {
      // then targetV is also null
      sourceV = this.addVertex_point(source)
      targetV = this.addVertex_point(target)
    } else if (targetV == null) {
      targetV = this.addVertex_point(target)
    }

    edge = edgeCreator(sourceV, targetV)
    sourceV.OutEdges.insert(edge)
    targetV.InEdges.push(edge)
    return edge
  }

  FindVertex(point: Point): VisibilityVertex {
    return this.pointToVertexMap.getP(point)
  }

  GetVertex(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.FindVertex(polylinePoint.point)
  }

  *Vertices(): IterableIterator<VisibilityVertex> {
    return this.pointToVertexMap.values()
  }

  RemoveVertex(vertex: VisibilityVertex) {
    //  Assert.assert(pointToVertexMap.ContainsKey(vertex.point), "Cannot find vertex in pointToVertexMap");
    for (const edge of vertex.OutEdges) {
      edge.Target.RemoveInEdge(edge)
    }

    for (const edge of vertex.InEdges) {
      edge.Source.RemoveOutEdge(edge)
    }

    this.pointToVertexMap.deleteP(vertex.point)
  }

  RemoveEdge(v1: VisibilityVertex, v2: VisibilityVertex) {
    const edge = v1.get(v2)
    if (!v1.get(v2)) {
      return
    }

    edge.Source.RemoveOutEdge(edge)
    edge.Target.RemoveInEdge(edge)
  }

  RemoveEdge_pp(p1: Point, p2: Point) {
    //  the order of p1 and p2 is not important.
    const edge: VisibilityEdge = this.FindEdge(p1, p2)
    if (edge == null) {
      return
    }

    edge.Source.RemoveOutEdge(edge)
    edge.Target.RemoveInEdge(edge)
  }

  static FindEdge(edge: VisibilityEdge): VisibilityEdge {
    return edge.Source.get(edge.Target)
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

    const edge: VisibilityEdge = sourceV.get(targetV)
    if (edge != null) {
      return edge
    }

    return null
  }

  static RemoveEdge(edge: VisibilityEdge) {
    edge.Source.OutEdges.remove(edge)
    // not efficient!

    let i = edge.Target.InEdges.indexOf(edge)
    Assert.assert(i >= 0)
    edge.Target.InEdges.splice(i, 1)
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
    for (let p = poly.startPoint; ; p = p.next) {
      // Find the first non-collinear segments and see which direction the triangle is.
      // If it's consistent with Clockwise, then return the polyline, else return its Reverse.
      const orientation = Point.getTriangleOrientation(
        p.point,
        p.next.point,
        p.next.next.point,
      )
      if (orientation != TriangleOrientation.Collinear) {
        yield orientation == TriangleOrientation.Clockwise ? poly : poly.reverse() as Polyline;
        break;
      }
    }
  }
}
