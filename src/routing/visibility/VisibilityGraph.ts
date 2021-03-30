//  the visibility graph
export class VisibilityGraph {

  _prevEdgesDictionary: Dictionary<VisibilityVertex, VisibilityEdge> = new Dictionary<VisibilityVertex, VisibilityEdge>();

  private /* internal */ visVertexToId: Dictionary<VisibilityVertex, number> = new Dictionary<VisibilityVertex, number>();

  private /* internal */ ClearPrevEdgesTable() {
    this._prevEdgesDictionary.Clear();
  }

  private /* internal */ ShrinkLengthOfPrevEdge(v: VisibilityVertex, lengthMultiplier: number) {
    this._prevEdgesDictionary[v].LengthMultiplier = lengthMultiplier;
  }

  //  needed for shortest path calculations
  private /* internal */ PreviosVertex(v: VisibilityVertex): VisibilityVertex {
    let prev: VisibilityEdge;
    if (!this._prevEdgesDictionary.TryGetValue(v, /* out */prev)) {
      return null;
    }

    if ((prev.Source == v)) {
      return prev.Target;
    }

    return prev.Source;
  }

  private /* internal */ SetPreviousEdge(v: VisibilityVertex, e: VisibilityEdge) {
    Debug.Assert(((v == e.Source)
      || (v == e.Target)));
    this._prevEdgesDictionary[v] = e;
  }

  //  the default is just to return VisibilityVertex
  vertexFactory: Func<Point, VisibilityVertex>;

  private /* internal */ get VertexFactory(): Func<Point, VisibilityVertex> {
    return this.vertexFactory;
  }
  private /* internal */ set VertexFactory(value: Func<Point, VisibilityVertex>) {
    this.vertexFactory = value;
  }

  pointToVertexMap: Dictionary<Point, VisibilityVertex> = new Dictionary<Point, VisibilityVertex>();

  //  
  //  <param name="pathStart"></param>
  //  <param name="pathEnd"></param>
  //  <param name="obstacles"></param>
  //  <param name="sourceVertex">graph vertex corresponding to the source</param>
  //  <param name="targetVertex">graph vertex corresponding to the target</param>
  //  <returns></returns>
  private /* internal */ static GetVisibilityGraphForShortestPath(pathStart: Point, pathEnd: Point, obstacles: IEnumerable<Polyline>, /* out */sourceVertex: VisibilityVertex, /* out */targetVertex: VisibilityVertex): VisibilityGraph {
    let holes = new List<Polyline>(VisibilityGraph.OrientHolesClockwise(obstacles));
    let visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes);
    let polygons = holes.Select(() => { }, new Polygon(hole)).ToList();
    TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(polygons, visibilityGraph);
    PointVisibilityCalculator.CalculatePointVisibilityGraph(holes, visibilityGraph, pathStart, VisibilityKind.Tangent, /* out */sourceVertex);
    PointVisibilityCalculator.CalculatePointVisibilityGraph(holes, visibilityGraph, pathEnd, VisibilityKind.Tangent, /* out */targetVertex);
    return visibilityGraph;
  }

  //  Calculates the tangent visibility graph
  //  <param name="obstacles">a list of polylines representing obstacles</param>
  //  <returns></returns>
  public static FillVisibilityGraphForShortestPath(obstacles: IEnumerable<Polyline>): VisibilityGraph {
    let holes = new List<Polyline>(VisibilityGraph.OrientHolesClockwise(obstacles));
    let visibilityGraph = VisibilityGraph.CalculateGraphOfBoundaries(holes);
    let polygons = holes.Select(() => { }, new Polygon(hole)).ToList();
    TangentVisibilityGraphCalculator.AddTangentVisibilityEdgesToGraph(polygons, visibilityGraph);
    return visibilityGraph;
  }

  private /* internal */ static CalculateGraphOfBoundaries(holes: List<Polyline>): VisibilityGraph {
    let graphOfHoleBoundaries = new VisibilityGraph();
    for (let polyline: Polyline in holes) {
      graphOfHoleBoundaries.AddHole(polyline);
    }

    return graphOfHoleBoundaries;
  }

  private /* internal */ AddHole(polyline: Polyline) {
    let p = polyline.StartPoint;
    while ((p != polyline.EndPoint)) {
      this.AddEdge(p, p.Next);
      p = p.Next;
    }

    this.AddEdge(polyline.EndPoint, polyline.StartPoint);
  }

  private /* internal */ static OrientHolesClockwise(holes: IEnumerable<Polyline>): IEnumerable<Polyline> {
        #if((TEST_MSAGL || VERIFY))
    VisibilityGraph.CheckThatPolylinesAreConvex(holes);
        #endif
    //  TEST || VERIFY
    for (let poly: Polyline in holes) {
      for (let p: PolylinePoint = poly.StartPoint; ; p = p.Next) {
        //  Find the first non-collinear segments and see which direction the triangle is.
        //  If it's consistent with Clockwise, then return the polyline, else return its Reverse.
        let orientation = Point.GetTriangleOrientation(p.Point, p.Next.Point, p.Next.Next.Point);
        if ((orientation != TriangleOrientation.Collinear)) {
          yield;
          return (orientation == TriangleOrientation.Clockwise);
          // TODO: Warning!!!, inline IF is not supported ?
          // TODO: Warning!!!! NULL EXPRESSION DETECTED...
          ;
          break;
        }

      }

    }

  }

  private /* internal */ static CheckThatPolylinesAreConvex(holes: IEnumerable<Polyline>) {
    for (let polyline in holes) {
      VisibilityGraph.CheckThatPolylineIsConvex(polyline);
    }

  }

  @SuppressMessage("Microsoft.Usage", "CA2201:DoNotRaiseReservedExceptionTypes")
  private /* internal */ static CheckThatPolylineIsConvex(polyline: Polyline) {
    Debug.Assert(polyline.Closed, "Polyline is not closed");
    let a: PolylinePoint = polyline.StartPoint;
    let b: PolylinePoint = a.Next;
    let c: PolylinePoint = b.Next;
    let orient: TriangleOrientation = Point.GetTriangleOrientation(a.Point, b.Point, c.Point);
    while ((c != polyline.EndPoint)) {
      a = a.Next;
      b = b.Next;
      c = c.Next;
      let currentOrient = Point.GetTriangleOrientation(a.Point, b.Point, c.Point);
      if ((currentOrient == TriangleOrientation.Collinear)) {
        // TODO: Warning!!! continue If
      }

      if ((orient == TriangleOrientation.Collinear)) {
        orient = currentOrient;
      }
      else if ((orient != currentOrient)) {
        throw new InvalidOperationException();
      }

    }

    let o = Point.GetTriangleOrientation(polyline.EndPoint.Point, polyline.StartPoint.Point, polyline.StartPoint.Next.Point);
    if (((o != TriangleOrientation.Collinear)
      && (o != orient))) {
      throw new InvalidOperationException();
    }

  }

  //  TEST || VERIFY
  //  Enumerate all VisibilityEdges in the VisibilityGraph.
  public get Edges(): IEnumerable<VisibilityEdge> {
    return PointToVertexMap.Values.SelectMany(() => { }, vertex.OutEdges);
  }

  private /* internal */ get PointToVertexMap(): Dictionary<Point, VisibilityVertex> {
    return this.pointToVertexMap;
  }

  private /* internal */ get VertexCount(): number {
    return this.PointToVertexMap.Count;
  }

  private /* internal */ AddVertex(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.AddVertex(polylinePoint.Point);
  }

  private /* internal */ AddVertex(point: Point): VisibilityVertex {
        #if(SHARPKIT)
    let currentVertex: VisibilityVertex;
    if (this.PointToVertexMap.TryGetValue(point, /* out */currentVertex)) {
      return currentVertex;
    }

    let newVertex = VertexFactory(point);
    this.PointToVertexMap[point] = newVertex;
    return newVertex;
        #else
    let vertex: VisibilityVertex;
    return VertexFactory(point);
    // TODO: Warning!!!, inline IF is not supported ?
    !this.PointToVertexMap.TryGetValue(point, /* out */vertex);
    vertex;
        #endif
  }

  private /* internal */ AddVertex(vertex: VisibilityVertex) {
    Debug.Assert(!this.PointToVertexMap.ContainsKey(vertex.Point), "A vertex already exists at this location");
    this.PointToVertexMap[vertex.Point] = vertex;
  }

  private /* internal */ ContainsVertex(point: Point): boolean {
    return this.PointToVertexMap.ContainsKey(point);
  }

  private /* internal */ static AddEdge(source: VisibilityVertex, target: VisibilityVertex): VisibilityEdge {
    let visEdge: VisibilityEdge;
    if (source.TryGetEdge(target, /* out */visEdge)) {
      return visEdge;
    }

    if ((source == target)) {
      Debug.Assert(false, "Self-edges are not allowed");
      throw new InvalidOperationException("Self-edges are not allowed");
    }

    let edge = new VisibilityEdge(source, target);
    source.OutEdges.Insert(edge);
    target.InEdges.Add(edge);
    return edge;
  }

  AddEdge(source: PolylinePoint, target: PolylinePoint) {
    this.AddEdge(source.Point, target.Point);
  }

  private /* internal */ static AddEdge(edge: VisibilityEdge) {
    Debug.Assert((edge.Source != edge.Target));
    edge.Source.OutEdges.Insert(edge);
    edge.Target.InEdges.Add(edge);
  }

  private /* internal */ AddEdge(source: Point, target: Point): VisibilityEdge {
    let edge: VisibilityEdge;
    let sourceV = this.FindVertex(source);
    let targetV: VisibilityVertex = null;
    if ((sourceV != null)) {
      targetV = this.FindVertex(target);
      if (((targetV != null)
        && sourceV.TryGetEdge(targetV, /* out */edge))) {
        return edge;
      }

    }

    if ((sourceV == null)) {
      // then targetV is also null
      sourceV = this.AddVertex(source);
      targetV = this.AddVertex(target);
    }
    else if ((targetV == null)) {
      targetV = this.AddVertex(target);
    }

    edge = new VisibilityEdge(sourceV, targetV);
    sourceV.OutEdges.Insert(edge);
    targetV.InEdges.Add(edge);
    return edge;
  }

  private /* internal */ AddEdge(source: Point, target: Point, edgeCreator: Func<VisibilityVertex, VisibilityVertex, VisibilityEdge>): VisibilityEdge {
    let edge: VisibilityEdge;
    let sourceV = this.FindVertex(source);
    let targetV: VisibilityVertex = null;
    if ((sourceV != null)) {
      targetV = this.FindVertex(target);
      if (((targetV != null)
        && sourceV.TryGetEdge(targetV, /* out */edge))) {
        return edge;
      }

    }

    if ((sourceV == null)) {
      // then targetV is also null
      sourceV = this.AddVertex(source);
      targetV = this.AddVertex(target);
    }
    else if ((targetV == null)) {
      targetV = this.AddVertex(target);
    }

    edge = edgeCreator(sourceV, targetV);
    sourceV.OutEdges.Insert(edge);
    targetV.InEdges.Add(edge);
    return edge;
  }

  private /* internal */ FindVertex(point: Point): VisibilityVertex {
    let p = new Point(43764.972237238435, 17219.289729042284);
    if (ApproximateComparer.Close(point, p)) {
      Console.WriteLine("uff");
    }

    return this.PointToVertexMap.TryGetValue(point, /* out */VisibilityVertex, v);
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
    ;
  }

  private /* internal */ GetVertex(polylinePoint: PolylinePoint): VisibilityVertex {
    return this.FindVertex(polylinePoint.Point);
  }

  private /* internal */ Vertices(): IEnumerable<VisibilityVertex> {
    return this.PointToVertexMap.Values;
  }

  private /* internal */ RemoveVertex(vertex: VisibilityVertex) {
    //  Debug.Assert(PointToVertexMap.ContainsKey(vertex.Point), "Cannot find vertex in PointToVertexMap");
    for (let edge in vertex.OutEdges) {
      edge.Target.RemoveInEdge(edge);
    }

    for (let edge in vertex.InEdges) {
      edge.Source.RemoveOutEdge(edge);
    }

    this.PointToVertexMap.Remove(vertex.Point);
  }

  private /* internal */ RemoveEdge(v1: VisibilityVertex, v2: VisibilityVertex) {
    let edge: VisibilityEdge;
    if (!v1.TryGetEdge(v2, /* out */edge)) {
      return;
    }

    edge.Source.RemoveOutEdge(edge);
    edge.Target.RemoveInEdge(edge);
  }

  private /* internal */ RemoveEdge(p1: Point, p2: Point) {
    //  the order of p1 and p2 is not important.
    let edge: VisibilityEdge = this.FindEdge(p1, p2);
    if ((edge == null)) {
      return;
    }

    edge.Source.RemoveOutEdge(edge);
    edge.Target.RemoveInEdge(edge);
  }

  private /* internal */ static FindEdge(edge: VisibilityEdge): VisibilityEdge {
    if (edge.Source.TryGetEdge(edge.Target, /* out */edge)) {
      return edge;
    }

    return null;
  }

  private /* internal */ FindEdge(source: Point, target: Point): VisibilityEdge {
    let sourceV = this.FindVertex(source);
    if ((sourceV == null)) {
      return null;
    }

    let targetV = this.FindVertex(target);
    if ((targetV == null)) {
      return null;
    }

    let edge: VisibilityEdge;
    if (sourceV.TryGetEdge(targetV, /* out */edge)) {
      return edge;
    }

    return null;
  }

  private /* internal */ static RemoveEdge(edge: VisibilityEdge) {
    edge.Source.OutEdges.Remove(edge);
    // not efficient!
    edge.Target.InEdges.Remove(edge);
    // not efficient
  }

  public ClearEdges() {
    for (let visibilityVertex in this.Vertices()) {
      visibilityVertex.ClearEdges();
    }

  }
}
