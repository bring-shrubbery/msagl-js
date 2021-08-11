import {Point} from '../../math/geometry/point'
import {PolylinePoint} from '../../math/geometry/polylinePoint'
import {Assert} from '../../utils/assert'
import {PointMap} from '../../utils/PointMap'
import {VisibilityEdge} from './VisibilityEdge'
import {VisibilityVertex} from './VisibilityVertex'

export class VisibilityGraph {
  //  needed for shortest path calculations
  _prevEdgesMap: Map<VisibilityVertex, VisibilityEdge> = new Map<
    VisibilityVertex,
    VisibilityEdge
  >()

  visVertexToId: Map<VisibilityVertex, number> = new Map<
    VisibilityVertex,
    number
  >()

  ClearPrevEdgesTable() {
    this._prevEdgesMap.clear()
  }

  ShrinkLengthOfPrevEdge(v: VisibilityVertex, lengthMultiplier: number) {
    this._prevEdgesMap.get(v).LengthMultiplier = lengthMultiplier
  }

  //  needed for shortest path calculations
  PreviosVertex(v: VisibilityVertex): VisibilityVertex {
    const prev: VisibilityEdge = this._prevEdgesMap.get(v)
    if (!prev) return null

    if (prev.Source == v) {
      return prev.Target
    }

    return prev.Source
  }

  SetPreviousEdge(v: VisibilityVertex, e: VisibilityEdge) {
    Assert.assert(v == e.Source || v == e.Target)
    this._prevEdgesMap.set(v, e)
  }

  //  the default is just to return a new VisibilityVertex
  VertexFactory = (p: Point) => new VisibilityVertex(p)
  pointToVertexMap: PointMap<VisibilityVertex> = new PointMap<VisibilityVertex>()

  //   static GetVisibilityGraphForShortestPath(pathStart: Point, pathEnd: Point, obstacles: IEnumerable<Polyline>, /* out */sourceVertex: VisibilityVertex, /* out */targetVertex: VisibilityVertex): VisibilityGraph {
  //       let holes = new List<Polyline>(VisibilityGraph.OrientHolesClockwise(obstacles));
  //       let visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes);
  //       let polygons = holes.Select(() => {  }, new Polygon(holes)).ToList();
  //       TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(polygons, visibilityGraph);
  //       PointVisibilityCalculator.CalculatePointVisibilityGraph(holes, visibilityGraph, pathStart, VisibilityKind.Tangent, /* out */sourceVertex);
  //       PointVisibilityCalculator.CalculatePointVisibilityGraph(holes, visibilityGraph, pathEnd, VisibilityKind.Tangent, /* out */targetVertex);
  //       return visibilityGraph;
  //   }

  //   //  Calculates the tangent visibility graph

  //   public static FillVisibilityGraphForShortestPath(obstacles: IEnumerable<Polyline>): VisibilityGraph {
  //       let holes = new List<Polyline>(VisibilityGraph.OrientHolesClockwise(obstacles));
  //       let visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes);
  //       let polygons = holes.Select(() => {  }, new Polygon(hole)).ToList();
  //       TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(polygons, visibilityGraph);
  //       return visibilityGraph;
  //   }

  //   static CalculateGraphOfBoundaries(holes: List<Polyline>): VisibilityGraph {
  //       let graphOfHoleBoundaries = new VisibilityGraph();
  //       for (let polyline: Polyline in holes) {
  //           graphOfHoleBoundaries.AddHole(polyline);
  //       }

  //       return graphOfHoleBoundaries;
  //   }

  //   AddHole(polyline: Polyline) {
  //       let p = polyline.startPoint;
  //       while ((p != polyline.endPoint)) {
  //           this.AddEdge(p, p.Next);
  //           p = p.Next;
  //       }

  //       this.AddEdge(polyline.endPoint, polyline.startPoint);
  //   }

  //   static OrientHolesClockwise(holes: IEnumerable<Polyline>): IEnumerable<Polyline> {
  //       #if ((TEST_MSAGL || VERIFY))
  //       VisibilityGraph.CheckThatPolylinesAreConvex(holes);
  //       #endif
  //       //  TEST || VERIFY
  //       for (let poly: Polyline in holes) {
  //           for (let p: PolylinePoint = poly.StartPoint; ; p = p.next) {
  //               //  Find the first non-collinear segments and see which direction the triangle is.
  //               //  If it's consistent with Clockwise, then return the polyline, else return its Reverse.
  //               let orientation = Point.getTriangleOrientation(p.point, p.next.Point, p.next.Next.Point);
  //               if ((orientation != TriangleOrientation.Collinear)) {
  //                   yield;
  //                   return (orientation == TriangleOrientation.Clockwise);
  //                   // TODO: Warning!!!, inline IF is not supported ?
  //                   // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  //                   ;
  //                   break;
  //               }

  //           }

  //       }

  //   }

  //   static CheckThatPolylinesAreConvex(holes: IEnumerable<Polyline>) {
  //       for (let polyline in holes) {
  //           VisibilityGraph.CheckThatPolylineIsConvex(polyline);
  //       }

  //   }

  //   @SuppressMessage("Microsoft.Usage", "CA2201:DoNotRaiseReservedExceptionTypes")
  //   static CheckThatPolylineIsConvex(polyline: Polyline) {
  //       Assert.assert(polyline.closed, "Polyline is not closed");
  //       let a: PolylinePoint = polyline.startPoint;
  //       let b: PolylinePoint = a.next;
  //       let c: PolylinePoint = b.next;
  //       let orient: TriangleOrientation = Point.getTriangleOrientation(a.point, b.point, c.point);
  //       while ((c != polyline.endPoint)) {
  //           a = a.next;
  //           b = b.next;
  //           c = c.next;
  //           let currentOrient = Point.getTriangleOrientation(a.point, b.point, c.point);
  //           if ((currentOrient == TriangleOrientation.Collinear)) {
  //               // TODO: Warning!!! continue If
  //           }

  //           if ((orient == TriangleOrientation.Collinear)) {
  //               orient = currentOrient;
  //           }
  //           else if ((orient != currentOrient)) {
  //               throw new InvalidOperationException();
  //           }

  //       }

  //       let o = Point.getTriangleOrientation(polyline.endPoint.Point, polyline.startPoint.Point, polyline.startPoint.Next.Point);
  //       if (((o != TriangleOrientation.Collinear)
  //                   && (o != orient))) {
  //           throw new InvalidOperationException();
  //       }

  //   }

  //   //  TEST || VERIFY

  //   //  Enumerate all VisibilityEdges in the VisibilityGraph.

  //   public get Edges(): IEnumerable<VisibilityEdge> {
  //       return PointToVertexMap.Values.SelectMany(() => {  }, vertex.OutEdges);
  //   }

  //   get PointToVertexMap(): Map<Point, VisibilityVertex> {
  //       return this.pointToVertexMap;
  //   }

  //   get VertexCount(): number {
  //       return this.PointToVertexMap.Count;
  //   }

  //   AddVertex(polylinePoint: PolylinePoint): VisibilityVertex {
  //       return this.AddVertex(polylinePoint.point);
  //   }

  AddVertexP(point: Point): VisibilityVertex {
    const currentVertex = this.pointToVertexMap.get(point)
    if (currentVertex) {
      return currentVertex
    }

    const newVertex = this.VertexFactory(point)
    this.pointToVertexMap.set(point, newVertex)
    return newVertex
  }

  AddVertexV(vertex: VisibilityVertex) {
    Assert.assert(
      !this.pointToVertexMap.hasP(vertex.point),
      'A vertex already exists at this location',
    )
    this.pointToVertexMap.set(vertex.point, vertex)
  }

  ContainsVertex(point: Point): boolean {
    return this.pointToVertexMap.hasP(point)
  }

  //   static AddEdge(source: VisibilityVertex, target: VisibilityVertex): VisibilityEdge {
  //       let visEdge: VisibilityEdge;
  //       if (source.TryGetEdge(target, /* out */visEdge)) {
  //           return visEdge;
  //       }

  //       if ((source == target)) {
  //           Assert.assert(false, "Self-edges are not allowed");
  //           throw new InvalidOperationException("Self-edges are not allowed");
  //       }

  //       let edge = new VisibilityEdge(source, target);
  //       source.OutEdges.insert(edge);
  //       target.InEdges.Add(edge);
  //       return edge;
  //   }

  AddEdgePlPl(source: PolylinePoint, target: PolylinePoint) {
    this.AddEdge(source.point, target.point)
  }

  static AddEdge(edge: VisibilityEdge) {
    Assert.assert(edge.Source != edge.Target)
    edge.Source.OutEdges.insert(edge)
    edge.Target.InEdges.push(edge)
  }

  AddEdgeF(
    source: Point,
    target: Point,
    edgeCreator: (a: VisibilityVertex, b: VisibilityVertex) => VisibilityEdge,
  ): VisibilityEdge {
    let sourceV = this.FindVertex(source)
    let targetV: VisibilityVertex = null
    if (sourceV != null) {
      targetV = this.FindVertex(target)
      if (targetV != null) {
        const edge: VisibilityEdge = sourceV.get(targetV)
        if (edge) return edge
      }
    }

    if (sourceV == null) {
      // then targetV is also null
      sourceV = this.AddVertexP(source)
      targetV = this.AddVertexP(target)
    } else if (targetV == null) {
      targetV = this.AddVertexP(target)
    }

    const edge = edgeCreator(sourceV, targetV)
    sourceV.OutEdges.insert(edge)
    targetV.InEdges.push(edge)
    return edge
  }

  AddEdge(source: Point, target: Point): VisibilityEdge {
    return this.AddEdgeF(source, target, (a, b) => new VisibilityEdge(a, b))
  }

  FindVertex(point: Point): VisibilityVertex {
    return this.pointToVertexMap.get(point)
  }

  //   GetVertex(polylinePoint: PolylinePoint): VisibilityVertex {
  //       return this.FindVertex(polylinePoint.point);
  //   }

  Vertices(): IterableIterator<VisibilityVertex> {
    return this.pointToVertexMap.values()
  }

  RemoveVertex(vertex: VisibilityVertex) {
    //  Assert.assert(PointToVertexMap.ContainsKey(vertex.Point), "Cannot find vertex in PointToVertexMap");
    for (const edge of vertex.OutEdges) {
      edge.Target.RemoveInEdge(edge)
    }

    for (const edge of vertex.InEdges) {
      edge.Source.RemoveOutEdge(edge)
    }

    this.pointToVertexMap.deleteP(vertex.point)
  }

  //   RemoveEdge(v1: VisibilityVertex, v2: VisibilityVertex) {
  //       let edge: VisibilityEdge;
  //       if (!v1.TryGetEdge(v2, /* out */edge)) {
  //           return;
  //       }

  //       edge.Source.RemoveOutEdge(edge);
  //       edge.Target.RemoveInEdge(edge);
  //   }

  //   RemoveEdge(p1: Point, p2: Point) {
  //       //  the order of p1 and p2 is not important.
  //       let edge: VisibilityEdge = this.FindEdge(p1, p2);
  //       if ((edge == null)) {
  //           return;
  //       }

  //       edge.Source.RemoveOutEdge(edge);
  //       edge.Target.RemoveInEdge(edge);
  //   }

  //   static FindEdge(edge: VisibilityEdge): VisibilityEdge {
  //       if (edge.Source.TryGetEdge(edge.Target, /* out */edge)) {
  //           return edge;
  //       }

  //       return null;
  //   }

  FindEdgePP(source: Point, target: Point): VisibilityEdge {
    const sourceV = this.FindVertex(source)
    if (sourceV == null) {
      return null
    }

    const targetV = this.FindVertex(target)
    if (targetV == null) {
      return null
    }

    return sourceV.get(targetV)
  }

  static RemoveEdge(edge: VisibilityEdge) {
    edge.Source.OutEdges.remove(edge)
    // not efficient!
    const arr = edge.Target.InEdges
    const i = arr.indexOf(edge)
    if (i != arr.length - 1) arr[i] == arr[arr.length - 1]
    arr.pop()
  }

  public ClearEdges() {
    for (const visibilityVertex of this.Vertices()) {
      visibilityVertex.ClearEdges()
    }
  }
}
