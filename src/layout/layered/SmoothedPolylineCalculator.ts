import { IEnumerable } from "linq-to-typescript";
import { CornerSite } from "../../math/geometry/cornerSite";
import { Curve } from "../../math/geometry/curve";
import { GeomConstants } from "../../math/geometry/geomConstants";
import { ICurve } from "../../math/geometry/icurve";
import { IntersectionInfo } from "../../math/geometry/intersectionInfo";
import { LineSegment } from "../../math/geometry/lineSegment";
import { Parallelogram } from "../../math/geometry/parallelogram";
import { ParallelogramNode, PN } from "../../math/geometry/parallelogramNode";
import { Point, TriangleOrientation } from "../../math/geometry/point";
import { Polyline } from "../../math/geometry/polyline";
import { SmoothedPolyline } from "../../math/geometry/smoothedPolyline";
import { GeomGraph } from "../core/GeomGraph";
import { Anchor } from "./anchor";
import { Database } from "./Database";
import { LayerArrays } from "./LayerArrays";
import { LayerEdge } from "./LayerEdge";
import { PolyIntEdge } from "./polyIntEdge";
import { ProperLayeredGraph } from "./ProperLayeredGraph";
import { SugiyamaLayoutSettings } from "./SugiyamaLayoutSettings";
import { HierarchyCalculator } from "./HierarchyCalculator";
class SmoothedPolylineCalculator {

  headSite: CornerSite;

  //  corresponds to the bottom point
  edgePath: PolyIntEdge;

  anchors: Anchor[];

  originalGraph: GeomGraph;

  rightHierarchy: ParallelogramNode;

  leftHierarchy: ParallelogramNode;

  thinRightHierarchy: ParallelogramNode;

  thinLeftHierarchy: ParallelogramNode;

  thinRightNodes: Array<ParallelogramNode> = new Array<ParallelogramNode>();

  thinLefttNodes: Array<ParallelogramNode> = new Array<ParallelogramNode>();

  database: Database;

  layeredGraph: ProperLayeredGraph;

  layerArrays: LayerArrays;

  settings: SugiyamaLayoutSettings;

  ///  <summary>
  ///  Creates a smoothed polyline
  ///  </summary>
  private /* internal */ constructor(edgePathPar: PolyIntEdge, anchorsP: Anchor[], origGraph: GeomGraph, settings: SugiyamaLayoutSettings, la: LayerArrays, layerGraph: ProperLayeredGraph, databaseP: Database) {
    this.database = databaseP;
    this.edgePath = edgePathPar;
    this.anchors = anchorsP;
    this.layerArrays = la;
    this.originalGraph = origGraph;
    this.settings = this.settings;
    this.layeredGraph = layerGraph;
    this.rightHierarchy = this.BuildRightHierarchy();
    this.leftHierarchy = this.BuildLeftHierarchy();
  }

  private BuildRightHierarchy(): PN {
    const boundaryAnchorsCurves: Array<Polyline> = this.FindRightBoundaryAnchorCurves();
    const l = new Array<ParallelogramNode>();
    for (const c of boundaryAnchorsCurves) {
      l.push(c.pNodeOverICurve);
    }

    this.thinRightHierarchy = HierarchyCalculator.Calculate(this.thinRightNodes, this.settings.GroupSplit);
    return HierarchyCalculator.Calculate(l, this.settings.GroupSplit);
  }

  private BuildLeftHierarchy(): ParallelogramNode {
    const boundaryAnchorCurves: Array<Polyline> = this.FindLeftBoundaryAnchorCurves();
    const l: Array<ParallelogramNode> = new Array<ParallelogramNode>();
    for (const a: Polyline in boundaryAnchorCurves) {
      l.Add(a.ParallelogramNodeOverICurve);
    }

    this.thinLeftHierarchy = HierarchyCalculator.Calculate(this.thinLefttNodes, this.settings.GroupSplit);
    return HierarchyCalculator.Calculate(l, this.settings.GroupSplit);
  }

  FindRightBoundaryAnchorCurves(): Array<Polyline> {
    const ret: Array<Polyline> = new Array<Polyline>();
    const uOffset: number = 0;
    for (const u: number in this.edgePath) {
      const rightMostAnchor: Anchor = null;
      for (const v: number in this.LeftBoundaryNodesOfANode(u, Routing.GetNodeKind(uOffset, this.edgePath))) {
        const a: Anchor = this.anchors[v];
        if (((rightMostAnchor == null)
          || (rightMostAnchor.Origin.X < a.Origin.X))) {
          rightMostAnchor = a;
        }

        ret.Add(a.PolygonalBoundary);
      }

      if ((rightMostAnchor != null)) {
        this.thinRightNodes.Add((new LineSegment(rightMostAnchor.Origin, this.originalGraph.Left, rightMostAnchor.Y) + ParallelogramNodeOverICurve));
      }

      uOffset++;
    }

    // if (Routing.db) {
    //     var l = new Array<DebugCurve>();
    //        l.AddRange(db.Anchors.Select(a=>new DebugCurve(100,1,"red", a.PolygonalBoundary)));
    //     l.AddRange(thinRightNodes.Select(n=>n.Parallelogram).Select(p=>new Polyline(p.Vertex(VertexId.Corner), p.Vertex(VertexId.VertexA),
    //         p.Vertex(VertexId.OtherCorner), p.Vertex(VertexId.VertexB))).Select(c=>new DebugCurve(100,3,"brown", c)));
    //     foreach (var le in this.edgePath.LayerEdges)
    //         l.Add(new DebugCurve(100, 1, "blue", new LineSegment(db.anchors[le.Source].Origin, db.anchors[le.Target].Origin)));
    //    LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    //     // Database(db, thinRightNodes.Select(p=>new Polyline(p.Parallelogram.Vertex(VertexId.Corner), p.Parallelogram.Vertex(VertexId.VertexA),
    //         //p.Parallelogram.Vertex(VertexId.OtherCorner), p.Parallelogram.Vertex(VertexId.VertexB)){Closed=true}).ToArray());
    // }
    return ret;
  }

  private FindLeftBoundaryAnchorCurves(): Array<Polyline> {
    const ret: Array<Polyline> = new Array<Polyline>();
    const uOffset: number = 0;
    for (const u: number in this.edgePath) {
      const leftMost: number = -1;
      for (const v: number in this.RightBoundaryNodesOfANode(u, Routing.GetNodeKind(uOffset, this.edgePath))) {
        if (((leftMost == -1)
          || (this.layerArrays.X[v] < this.layerArrays.X[leftMost]))) {
          leftMost = v;
        }

        ret.Add(this.anchors[v].PolygonalBoundary);
      }

      if ((leftMost != -1)) {
        const a: Anchor = this.anchors[leftMost];
        this.thinLefttNodes.Add((new LineSegment(a.Origin, this.originalGraph.Right, a.Origin.Y) + ParallelogramNodeOverICurve));
      }

      uOffset++;
    }

    return ret;
  }

  FillRightTopAndBottomVerts(layer: number[], vPosition: number, nodeKind: NodeKind): IEnumerable<number> {
    const b: number = 0;
    const t: number = 0;
    if ((nodeKind == NodeKind.Bottom)) {
      b = Single.MaxValue;
      // we don't have bottom boundaries here since they will be cut off
    }
    else if ((nodeKind == NodeKind.Top)) {
      t = Single.MaxValue;
      // we don't have top boundaries here since they will be cut off
    }

    const v: number = layer[vPosition];
    for (const i: number = (vPosition + 1); (i < layer.Length); i++) {
      const u: number = layer[i];
      const anchor: Anchor = this.anchors[u];
      if ((anchor.TopAnchor > t)) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = anchor.TopAnchor;
          if ((anchor.BottomAnchor > b)) {
            b = anchor.BottomAnchor;
          }

          yield;
          return u;
        }

      }
      else if ((anchor.BottomAnchor > b)) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          b = anchor.BottomAnchor;
          if ((anchor.TopAnchor > t)) {
            t = anchor.TopAnchor;
          }

          yield;
          return u;
        }

      }

    }

  }

  * FillLeftTopAndBottomVerts(layer: number[], vPosition: number, nodeKind: NodeKind): IterableIterator<number> {
    const b: number = 0;
    const t: number = 0;
    if ((nodeKind == NodeKind.Top)) {
      t = Number.MAX_VALUE
    }

    // there are no top vertices - they are cut down by the top boundaryCurve curve       
    if ((nodeKind == NodeKind.Bottom)) {
      b = Number.MAX_VALUE
    }

    // there are no bottom vertices - they are cut down by the top boundaryCurve curve
    const v: number = layer[vPosition];
    for (const i: number = (vPosition - 1); (i >= 0); i--) {
      const u: number = layer[i];
      const anchor: Anchor = this.anchors[u];
      if ((anchor.TopAnchor
        > (t + GeomConstants.distanceEpsilon))) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = anchor.TopAnchor;
          b = Math.max(b, anchor.BottomAnchor);
          yield u;
        }

      }
      else if ((anchor.BottomAnchor
        > (b + GeomConstants.distanceEpsilon))) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = Math.max(t, anchor.TopAnchor);
          b = anchor.BottomAnchor;
          yield u;
        }

      }

    }

  }

  IsVirtualVertex(v: number): boolean {
    return (v >= this.originalGraph.nodeCount);
  }

  IsLabel(u: number): boolean {
    return this.anchors[u].RepresentsLabel;
  }

  private NodeUCanBeCrossedByNodeV(u: number, v: number): boolean {
    if (this.IsLabel(u)) {
      return false;
    }

    if (this.IsLabel(v)) {
      return false;
    }

    if ((this.IsVirtualVertex(u)
      && (this.IsVirtualVertex(v) && this.EdgesIntersectSomewhere(u, v)))) {
      return true;
    }

    return false;
  }

  private EdgesIntersectSomewhere(u: number, v: number): boolean {
    if (this.UVAreMiddlesOfTheSameMultiEdge(u, v)) {
      return false;
    }

    return (this.IntersectAbove(u, v) || this.IntersectBelow(u, v));
  }

  private UVAreMiddlesOfTheSameMultiEdge(u: number, v: number): boolean {
    if ((this.database.MultipleMiddles.Contains(u)
      && (this.database.MultipleMiddles.Contains(v)
        && (this.SourceOfTheOriginalEdgeContainingAVirtualNode(u) == this.SourceOfTheOriginalEdgeContainingAVirtualNode(v))))) {
      return true;
    }

    return false;
  }

  SourceOfTheOriginalEdgeContainingAVirtualNode(u: number): number {
    while (this.IsVirtualVertex(u)) {
      u = this.IncomingEdge(u).Source;
    }

    return u;
  }

  private IntersectBelow(u: number, v: number): boolean {
    while (true) {
      const eu: LayerEdge = this.OutcomingEdge(u);
      const ev: LayerEdge = this.OutcomingEdge(v);
      if (this.Intersect(eu, ev)) {
        return true;
      }

      u = eu.Target;
      v = ev.Target;
      if (!(this.IsVirtualVertex(u) && this.IsVirtualVertex(v))) {
        if ((v == u)) {
          return true;
        }

        return false;
      }

    }

  }

  private IntersectAbove(u: number, v: number): boolean {
    while (true) {
      const eu: LayerEdge = this.IncomingEdge(u);
      const ev: LayerEdge = this.IncomingEdge(v);
      if (this.Intersect(eu, ev)) {
        return true;
      }

      u = eu.Source;
      v = ev.Source;
      if (!(this.IsVirtualVertex(u) && this.IsVirtualVertex(v))) {
        if ((u == v)) {
          return true;
        }

        return false;
      }

    }

  }

  private Intersect(e: LayerEdge, m: LayerEdge): boolean {
    const a: number = (this.layerArrays.X[e.Source] - this.layerArrays.X[m.Source]);
    const b: number = (this.layerArrays.X[e.Target] - this.layerArrays.X[m.Target]);
    return (((a > 0)
      && (b < 0))
      || ((a < 0)
        && (b > 0)));
    // return (layerArrays.X[e.Source] - layerArrays.X[m.Source]) * (layerArrays.X[e.Target] - layerArrays.X[m.Target]) < 0;
  }

  private IncomingEdge(u: number): LayerEdge {
    return this.layeredGraph.InEdgeOfVirtualNode(u);
  }

  // here u is a virtual vertex
  private OutcomingEdge(u: number): LayerEdge {
    return this.layeredGraph.OutEdgeOfVirtualNode(u);
  }

  private RightBoundaryNodesOfANode(i: number, nodeKind: NodeKind): IEnumerable<number> {
    return this.FillRightTopAndBottomVerts(this.NodeLayer(i), this.layerArrays.X[i], nodeKind);
  }

  private NodeLayer(i: number): number[] {
    return this.layerArrays.Layers[this.layerArrays.Y[i]];
  }

  private LeftBoundaryNodesOfANode(i: number, nodeKind: NodeKind): IEnumerable<number> {
    return this.FillLeftTopAndBottomVerts(this.NodeLayer(i), this.layerArrays.X[i], nodeKind);
  }

  private /* internal */ GetSpline(optimizeShortEdges: boolean): ICurve {
    this.CreateRefinedPolyline(optimizeShortEdges);
    return this.CreateSmoothedPolyline();
  }

  //    static int calls;
  //  bool debug { get { return calls == 5;} }
  Poly(): Curve {
    const c: Curve = new Curve();
    for (const s: CornerSite = this.headSite; (s.Next != null); s = s.Next) {
      c.AddSegment(new CubicBezierSegment(s.Point, ((2
        * (s.Point / 3))
        + (s.Next.Point / 3)), ((s.Point / 3) + (2
          * (s.Next.Point / 3))), s.Next.Point));
    }

    return c;
  }

  private /* internal */ get GetPolyline(): SmoothedPolyline {
    System.Diagnostics.Debug.Assert((this.headSite != null));
    return new SmoothedPolyline(this.headSite);
  }

  LineSegIntersectBound(a: Point, b: Point): boolean {
    const l = new LineSegment(a, b);
    return (SmoothedPolylineCalculator.CurveIntersectsHierarchy(l, this.leftHierarchy)
      || (SmoothedPolylineCalculator.CurveIntersectsHierarchy(l, this.thinLeftHierarchy)
        || (SmoothedPolylineCalculator.CurveIntersectsHierarchy(l, this.rightHierarchy) || SmoothedPolylineCalculator.CurveIntersectsHierarchy(l, this.thinRightHierarchy))));
  }

  SegIntersectRightBound(a: CornerSite, b: CornerSite): boolean {
    return (SmoothedPolylineCalculator.SegIntersectsBound(a, b, this.leftHierarchy) || SmoothedPolylineCalculator.SegIntersectsBound(a, b, this.thinLeftHierarchy));
  }

  SegIntersectLeftBound(a: CornerSite, b: CornerSite): boolean {
    return (SmoothedPolylineCalculator.SegIntersectsBound(a, b, this.rightHierarchy) || SmoothedPolylineCalculator.SegIntersectsBound(a, b, this.thinRightHierarchy));
  }

  private TryToRemoveInflectionEdge(/* ref */s: CornerSite): boolean {
    if ((s.Next.Next == null)) {
      return false;
    }

    if ((s.Previous == null)) {
      return false;
    }

    if ((s.Turn < 0)) {
      // left turn at s
      if ((!this.SegIntersectRightBound(s, s.Next.Next)
        && !this.SegIntersectLeftBound(s, s.Next.Next))) {
        const n: CornerSite = s.Next.Next;
        s.Next = n;
        // forget about s.next
        n.Previous = s;
        s = n;
        return true;
      }

      if ((!this.SegIntersectLeftBound(s.Previous, s.Next)
        && !this.SegIntersectRightBound(s.Previous, s.Next))) {
        const a: CornerSite = s.Previous;
        // forget s
        const b: CornerSite = s.Next;
        a.Next = b;
        b.Previous = a;
        s = b;
        return true;
      }

    }
    else {
      // right turn at s
      if ((!this.SegIntersectLeftBound(s, s.Next.Next)
        && !this.SegIntersectRightBound(s, s.Next.Next))) {
        const n: CornerSite = s.Next.Next;
        s.Next = n;
        // forget about s.next
        n.Previous = s;
        s = n;
        return true;
      }

      if ((!this.SegIntersectRightBound(s.Previous, s.Next)
        && this.SegIntersectLeftBound(s.Previous, s.Next))) {
        const a: CornerSite = s.Previous;
        // forget s
        const b: CornerSite = s.Next;
        a.Next = b;
        b.Previous = a;
        s = b;
        return true;
      }

    }

    return false;
  }

  static SegIntersectsBound(a: CornerSite, b: CornerSite, hierarchy: ParallelogramNode): boolean {
    return SmoothedPolylineCalculator.CurveIntersectsHierarchy(new LineSegment(a.Point, b.Point), hierarchy);
  }

  private static CurveIntersectsHierarchy(lineSeg: LineSegment, hierarchy: ParallelogramNode): boolean {
    if ((hierarchy == null)) {
      return false;
    }

    if (!Parallelogram.Intersect(lineSeg.ParallelogramNodeOverICurve.Parallelogram, hierarchy.Parallelogram)) {
      return false;
    }

    const n: ParallelogramBinaryTreeNode = (<ParallelogramBinaryTreeNode>(hierarchy));
    if ((n != null)) {
      return (SmoothedPolylineCalculator.CurveIntersectsHierarchy(lineSeg, n.LeftSon) || SmoothedPolylineCalculator.CurveIntersectsHierarchy(lineSeg, n.RightSon));
    }

    return (Curve.CurveCurveIntersectionOne(lineSeg, (<ParallelogramNodeOverICurve>(hierarchy)).Seg, false) != null);
  }

  static Flat(i: CornerSite): boolean {
    return (Point.GetTriangleOrientation(i.Previous.Point, i.Point, i.Next.Point) == TriangleOrientation.Collinear);
  }

  private /* internal */ Reverse(): SmoothedPolylineCalculator {
    const ret: SmoothedPolylineCalculator = new SmoothedPolylineCalculator(this.edgePath, this.anchors, this.originalGraph, this.settings, this.layerArrays, this.layeredGraph, this.database);
    const site: CornerSite = this.headSite;
    const v: CornerSite = null;
    while ((site != null)) {
      ret.headSite = site.Clone();
      ret.headSite.Next = v;
      if ((v != null)) {
        v.Previous = ret.headSite;
      }

      v = ret.headSite;
      site = site.Next;
    }

    return ret;
  }

  private CreateRefinedPolyline(optimizeShortEdges: boolean) {
    this.CreateInitialListOfSites();
    const topSite: CornerSite = this.headSite;
    const bottomSite: CornerSite;
    for (const i: number = 0; (i < this.edgePath.Count); i++) {
      bottomSite = topSite.Next;
      this.RefineBeetweenNeighborLayers(topSite, this.EdgePathNode(i), this.EdgePathNode((i + 1)));
      topSite = bottomSite;
    }

    this.TryToRemoveInflections();
    if (optimizeShortEdges) {
      this.OptimizeShortPath();
    }

  }

  private RefineBeetweenNeighborLayers(topSite: CornerSite, topNode: number, bottomNode: number) {
    RefinerBetweenTwoLayers.Refine(topNode, bottomNode, topSite, this.anchors, this.layerArrays, this.layeredGraph, this.originalGraph, this.settings.LayerSeparation);
  }

  private CreateInitialListOfSites() {
    const currentSite: CornerSite;
    for (const i: number = 1; (i <= this.edgePath.Count); i++) {
      currentSite = new CornerSite(currentSite, this.EdgePathPoint(i));
    }

  }

  get TailSite(): CornerSite {
    const s: CornerSite = this.headSite;
    while ((s.Next != null)) {
      s = s.Next;
    }

    return s;
  }

  OptimizeForThreeSites() {
    Debug.Assert((this.edgePath.LayerEdges.Count == 2));
    const top: number = this.EdgePathNode(0);
    const bottom: number = this.EdgePathNode(2);
    const a: Anchor = this.anchors[top];
    const b: Anchor = this.anchors[bottom];
    const ax: number = a.X;
    const bx: number = b.X;
    if (ApproximateComparer.Close(ax, bx)) {
      return;
    }

    const sign: number;
    if (!this.FindLegalPositions(a, b, /* ref */ax, /* ref */bx, /* out */sign)) {
      return;
    }

    const ratio: number = ((a.Y - b.Y)
      / (a.Bottom - b.Top));
    const xc: number = (0.5
      * (ax + bx));
    const half: number = (sign
      * ((ax - bx)
        * 0.5));
    ax = (xc
      + (ratio
        * (half * sign)));
    bx = (xc
      - (ratio
        * (half * sign)));
    this.headSite.Point = new Point(ax, a.Y);
    const ms = this.headSite.Next;
    const mY: number = ms.Point.Y;
    ms.Point = new Point(this.MiddlePos(ax, bx, a, b, mY), mY);
    ms.Next.Point = new Point(bx, b.Y);
    const ma: Anchor = this.anchors[this.EdgePathNode(1)];
    ma.X = ms.Point.X;
    // show(new DebugCurve(200, 3, "yellow", new LineSegment(ax, a.Y, ms.Point.X, ms.Point.Y)),
    //     new DebugCurve(200, 3, "green", new LineSegment(bx, b.Y, ms.Point.X, ms.Point.Y)));
  }

  OptimizeForTwoSites() {
    Debug.Assert((this.edgePath.LayerEdges.Count == 1));
    const top: number = this.EdgePathNode(0);
    const bottom: number = this.EdgePathNode(1);
    const a: Anchor = this.anchors[top];
    const b: Anchor = this.anchors[bottom];
    const ax: number = a.X;
    const bx: number = b.X;
    if (ApproximateComparer.Close(ax, bx)) {
      return;
    }

    const sign: number;
    if (!this.FindPositions(a, b, /* ref */ax, /* ref */bx, /* out */sign)) {
      return;
    }

    const ratio: number = ((a.Y - b.Y)
      / (a.Bottom - b.Top));
    const xc: number = (0.5
      * (ax + bx));
    const half: number = (sign
      * ((ax - bx)
        * 0.5));
    ax = (xc
      + (ratio
        * (half * sign)));
    bx = (xc
      - (ratio
        * (half * sign)));
    this.headSite.Point = new Point(ax, a.Y);
    this.headSite.Next.Point = new Point(bx, b.Y);
  }

  private FindLegalPositions(a: Anchor, b: Anchor, /* ref */ax: number, /* ref */bx: number, /* out */sign: number): boolean {
    if (!this.FindPositions(a, b, /* ref */ax, /* ref */bx, /* out */sign)) {
      return false;
    }

    const count: number = 10;
    for (
      ; ;
    ) {
      if (this.PositionsAreLegal(ax, bx, sign, a, b, this.EdgePathNode(1))) {
        return true;
      }

      ax = ((ax + a.X)
        / 2);
      bx = ((bx + b.X)
        / 2);
    }

    10;
    return false;
  }

  private FindPositions(a: Anchor, b: Anchor, /* ref */ax: number, /* ref */bx: number, /* out */sign: number): boolean {
    const overlapMax: number;
    const overlapMin: number;
    if ((ax < bx)) {
      sign = 1;
      overlapMin = Math.max(ax, b.Left);
      overlapMax = Math.Min(a.Right, bx);
    }
    else {
      sign = -1;
      overlapMin = Math.max(a.Left, bx);
      overlapMax = Math.Min(b.Right, ax);

    }

    if ((overlapMin <= overlapMax)) {
      bx = (0.5
        * (overlapMin + overlapMax));
      ax = (0.5
        * (overlapMin + overlapMax));
    }
    else {
      if (this.OriginToOriginSegCrossesAnchorSide(a, b)) {
        return false;
      }

      if ((sign == 1)) {
        ax = (a.Right - (0.1 * a.RightAnchor));
        bx = b.Left;
      }
      else {
        ax = (a.Left + (0.1 * a.LeftAnchor));
        bx = b.Right;
      }

    }

    return true;
  }

  private OriginToOriginSegCrossesAnchorSide(a: Anchor, b: Anchor): boolean {
    Debug.Assert((a.Y > b.Y));
    const seg = new LineSegment(a.Origin, b.Origin);
    return ((((a.X < b.X)
      && Curve.CurvesIntersect(seg, new LineSegment(a.RightBottom, a.RightTop)))
      || Curve.CurvesIntersect(seg, new LineSegment(b.LeftBottom, a.LeftTop)))
      || (((a.X > b.X)
        && Curve.CurvesIntersect(seg, new LineSegment(a.LeftBottom, a.LeftTop)))
        || Curve.CurvesIntersect(seg, new LineSegment(b.RightBottom, a.RightTop))));
  }

  private OptimizeShortPath() {
    if ((this.edgePath.Count > 2)) {
      return;
    }

    if (((this.edgePath.Count == 2)
      && ((this.headSite.Next.Next != null)
        && ((this.headSite.Next.Next.Next == null)
          && (this.anchors[this.EdgePathNode(1)].Node == null))))) {
      this.OptimizeForThreeSites();
    }
    else if ((this.edgePath.Count == 1)) {
      this.OptimizeForTwoSites();
    }

  }

  private PositionsAreLegal(sax: number, sbx: number, sign: number, a: Anchor, b: Anchor, middleNodeIndex: number): boolean {
    if ((!ApproximateComparer.Close(sax, sbx)
      && (((sax - sbx)
        * sign)
        > 0))) {
      return false;
    }

    const mAnchor: Anchor = this.anchors[middleNodeIndex];
    const mx: number = this.MiddlePos(sax, sbx, a, b, mAnchor.Y);
    if (!this.MiddleAnchorLegal(mx, middleNodeIndex, mAnchor)) {
      return false;
    }

    return !this.LineSegIntersectBound(new Point(sax, a.Bottom), new Point(sbx, b.Top));
  }

  private MiddleAnchorLegal(mx: number, middleNodeIndex: number, mAnchor: Anchor): boolean {
    const mLayer = this.NodeLayer(middleNodeIndex);
    const pos: number = this.layerArrays.X[middleNodeIndex];
    const shift: number = (mx - mAnchor.X);
    if ((pos > 0)) {
      const l: Anchor = this.anchors[mLayer[(pos - 1)]];
      if ((l.Right
        > (shift + mAnchor.Left))) {
        return false;
      }

    }

    if ((pos
      < (mLayer.Length - 1))) {
      const r: Anchor = this.anchors[mLayer[(pos + 1)]];
      if ((r.Left
        < (shift + mAnchor.Right))) {
        return false;
      }

    }

    return true;
  }

  private MiddlePos(sax: number, sbx: number, a: Anchor, b: Anchor, mY: number): number {
    const u: number = (a.Y - mY);
    const l: number = (mY - b.Y);
    Debug.Assert(((u >= 0)
      && (l >= 0)));
    return (((sax * u)
      + (sbx * l))
      / (u + l));
  }

  private TryToRemoveInflections() {
    if (this.TurningAlwaySameDirection()) {
      return;
    }

    const progress: boolean = true;
    while (progress) {
      progress = false;
      for (const s: CornerSite = this.headSite; ((s != null)
        && (s.Next != null)); s = s.Next) {
        progress = (this.TryToRemoveInflectionEdge(/* ref */s) || progress);
      }

    }

  }

  private TurningAlwaySameDirection(): boolean {
    const sign: number = 0;
    // undecided
    for (const s: CornerSite = this.headSite.Next; ((s != null)
      && (s.Next != null)); s = s.Next) {
      const nsign: number = s.Turn;
      if ((sign == 0)) {
        // try to set the sign
        if ((nsign > 0)) {
          sign = 1;
        }
        else if ((nsign < 0)) {
          sign = -1;
        }

      }
      else if (((sign * nsign)
        < 0)) {
        return false;
      }

    }

    return true;
  }

  EdgePathPoint(i: number): Point {
    return this.anchors[this.EdgePathNode(i)].Origin;
  }

  EdgePathNode(i: number): number {
    const v: number;
    if ((i == this.edgePath.Count)) {
      v = this.edgePath[(this.edgePath.Count - 1)].Target;
    }
    else {
      v = this.edgePath[i].Source;
    }

    return v;
  }

  CreateSmoothedPolyline(): Curve {
    this.RemoveVerticesWithNoTurns();
    const curve: Curve = new Curve();
    const a: CornerSite = this.headSite;
    // the corner start
    const b: CornerSite;
    // the corner origin
    const c: CornerSite;
    // the corner other end
    if (Curve.FindCorner(a, /* out */b, /* out */c)) {
      this.CreateFilletCurve(curve, /* ref */a, /* ref */b, /* ref */c);
      curve = this.ExtendCurveToEndpoints(curve);
    }
    else {
      curve.AddSegment(new LineSegment(this.headSite.Point, this.TailSite.Point));
    }

    return curve;
  }

  private RemoveVerticesWithNoTurns() {
    while (this.RemoveVerticesWithNoTurnsOnePass()) {

    }

  }

  private RemoveVerticesWithNoTurnsOnePass(): boolean {
    const ret: boolean = false;
    for (const s: CornerSite = this.headSite; ((s.Next != null)
      && (s.Next.Next != null)); s = s.Next) {
      if (SmoothedPolylineCalculator.Flat(s.Next)) {
        ret = true;
        s.Next = s.Next.Next;
        // crossing out s.next
        s.Next.Previous = s;
      }

    }

    return ret;
  }

  private ExtendCurveToEndpoints(curve: Curve): Curve {
    const p: Point = this.headSite.Point;
    if (!ApproximateComparer.Close(p, curve.Start)) {
      const nc: Curve = new Curve();
      nc.AddSegs(new LineSegment(p, curve.Start), curve);
      curve = nc;
    }

    p = this.TailSite.Point;
    if (!ApproximateComparer.Close(p, curve.End)) {
      curve.AddSegment(new LineSegment(curve.End, p));
    }

    return curve;
  }

  private CreateFilletCurve(curve: Curve, /* ref */a: CornerSite, /* ref */b: CornerSite, /* ref */c: CornerSite) {
    for (
      ; true;
    ) {
      this.AddSmoothedCorner(a, b, c, curve);
      a = b;
      b = c;
      if ((b.Next != null)) {
        c = b.Next;
      }
      else {
        break;
      }

    }

  }

  private AddSmoothedCorner(a: CornerSite, b: CornerSite, c: CornerSite, curve: Curve) {
    const k: number = 0.5;
    const seg: CubicBezierSegment;
    for (
      ; this.BezierSegIntersectsBoundary(seg);
    ) {
      seg = Curve.CreateBezierSeg(k, k, a, b, c);
      // if (Routing.db)
      //     LayoutAlgorithmSettings .Show(seg, CreatePolyTest());
      b.PreviousBezierSegmentFitCoefficient = k;
      2;
    }

    k = (k * 2);
    // that was the last k
    if ((k < 0.5)) {
      // one time try a smoother seg
      k = (0.5
        * (k
          + (k * 2)));
      const nseg: CubicBezierSegment = Curve.CreateBezierSeg(k, k, a, b, c);
      if (!this.BezierSegIntersectsBoundary(nseg)) {
        b.NextBezierSegmentFitCoefficient = k;
        b.PreviousBezierSegmentFitCoefficient = k;
        seg = nseg;
      }

    }

    if (((curve.Segments.Count > 0)
      && !ApproximateComparer.Close(curve.End, seg.Start))) {
      curve.AddSegment(new LineSegment(curve.End, seg.Start));
    }

    curve.AddSegment(seg);
  }

  private BezierSegIntersectsBoundary(seg: CubicBezierSegment): boolean {
    const side: number = Point.SignedDoubledTriangleArea(seg.B(0), seg.B(1), seg.B(2));
    if ((side > 0)) {
      return (this.BezierSegIntersectsTree(seg, this.thinLeftHierarchy) || this.BezierSegIntersectsTree(seg, this.leftHierarchy));
    }
    else {
      return (this.BezierSegIntersectsTree(seg, this.thinRightHierarchy) || this.BezierSegIntersectsTree(seg, this.rightHierarchy));
    }

  }

  private BezierSegIntersectsTree(seg: CubicBezierSegment, tree: ParallelogramNode): boolean {
    if ((tree == null)) {
      return false;
    }

    if (Parallelogram.Intersect(seg.ParallelogramNodeOverICurve.Parallelogram, tree.Parallelogram)) {
      const n: ParallelogramBinaryTreeNode = (<ParallelogramBinaryTreeNode>(tree));
      if ((n != null)) {
        return (this.BezierSegIntersectsTree(seg, n.LeftSon) || this.BezierSegIntersectsTree(seg, n.RightSon));
      }
      else {
        return this.BezierSegIntersectsBoundary(seg, (<ParallelogramNodeOverICurve>(tree)).Seg);
      }

    }
    else {
      return false;
    }

  }

  static BezierSegIntersectsBoundary(seg: CubicBezierSegment, curve: ICurve): boolean {
    for (const x: IntersectionInfo in Curve.GetAllIntersections(seg, curve, false)) {
      const c: Curve = (<Curve>(curve));
      if ((c != null)) {
        if (Curve.RealCutWithClosedCurve(x, c, false)) {
          return true;
        }

      }
      else {
        // curve is a line from a thin hierarchy that's forbidden to touch
        return true;
      }

    }

    return false;
  }
}
