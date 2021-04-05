import { CornerSite } from '../../math/geometry/cornerSite'
import { Curve } from '../../math/geometry/curve'
import { GeomConstants } from '../../math/geometry/geomConstants'
import { ICurve } from '../../math/geometry/icurve'
import { LineSegment } from '../../math/geometry/lineSegment'
import { Parallelogram } from '../../math/geometry/parallelogram'
import { PN, PNInternal } from '../../math/geometry/parallelogramNode'
import { Point, TriangleOrientation } from '../../math/geometry/point'
import { Polyline } from '../../math/geometry/polyline'
import { SmoothedPolyline } from '../../math/geometry/smoothedPolyline'
import { GeomGraph } from '../core/GeomGraph'
import { Anchor } from './anchor'
import { Database } from './Database'
import { LayerArrays } from './LayerArrays'
import { LayerEdge } from './LayerEdge'
import { PolyIntEdge } from './polyIntEdge'
import { ProperLayeredGraph } from './ProperLayeredGraph'
import { SugiyamaLayoutSettings } from './SugiyamaLayoutSettings'
import { HierarchyCalculator } from './HierarchyCalculator'
import { BezierSeg } from '../../math/geometry/bezierSeg'
import { Routing } from './routing'
import { NodeKind } from './NodeKind'
import { Assert } from '../../utils/assert'
export class SmoothedPolylineCalculator {
  headSite: CornerSite

  //  corresponds to the bottom point
  edgePath: PolyIntEdge

  anchors: Anchor[]

  originalGraph: GeomGraph

  rightHierarchy: PN

  leftHierarchy: PN

  thinRightHierarchy: PN

  thinLeftHierarchy: PN

  thinRightNodes = new Array<PN>()

  thinLefttNodes = new Array<PN>()

  database: Database

  layeredGraph: ProperLayeredGraph

  layerArrays: LayerArrays

  settings: SugiyamaLayoutSettings

  //  <summary>
  //  Creates a smoothed polyline
  //  </summary>
  private /* internal */ constructor(
    edgePathPar: PolyIntEdge,
    anchorsP: Anchor[],
    origGraph: GeomGraph,
    settings: SugiyamaLayoutSettings,
    la: LayerArrays,
    layerGraph: ProperLayeredGraph,
    databaseP: Database,
  ) {
    this.database = databaseP
    this.edgePath = edgePathPar
    this.anchors = anchorsP
    this.layerArrays = la
    this.originalGraph = origGraph
    this.settings = this.settings
    this.layeredGraph = layerGraph
    this.rightHierarchy = this.BuildRightHierarchy()
    this.leftHierarchy = this.BuildLeftHierarchy()
  }

  private BuildRightHierarchy(): PN {
    const boundaryAnchorsCurves: Array<Polyline> = this.FindRightBoundaryAnchorCurves()
    const l = new Array<PN>()
    for (const c of boundaryAnchorsCurves) {
      l.push(c.pNodeOverICurve())
    }

    this.thinRightHierarchy = HierarchyCalculator.Calculate(this.thinRightNodes)
    return HierarchyCalculator.Calculate(l)
  }

  private BuildLeftHierarchy(): PN {
    const boundaryAnchorCurves: Array<Polyline> = this.FindLeftBoundaryAnchorCurves()
    const l = new Array<PN>()
    for (const a of boundaryAnchorCurves) {
      l.push(a.pNodeOverICurve())
    }

    this.thinLeftHierarchy = HierarchyCalculator.Calculate(this.thinLefttNodes)
    return HierarchyCalculator.Calculate(l)
  }

  FindRightBoundaryAnchorCurves(): Array<Polyline> {
    const ret: Array<Polyline> = new Array<Polyline>()
    let uOffset = 0
    for (const u of this.edgePath.nodes()) {
      let rightMostAnchor: Anchor = null
      for (const v of this.LeftBoundaryNodesOfANode(
        u,
        Routing.GetNodeKind(uOffset, this.edgePath),
      )) {
        const a: Anchor = this.anchors[v]
        if (rightMostAnchor == null || rightMostAnchor.Origin.x < a.Origin.x) {
          rightMostAnchor = a
        }

        ret.push(a.polygonalBoundary)
      }

      if (rightMostAnchor != null) {
        this.thinRightNodes.push(
          LineSegment.mkLinePXY(
            rightMostAnchor.Origin,
            this.originalGraph.left,
            rightMostAnchor.y,
          ).pNodeOverICurve(),
        )
      }

      uOffset++
    }

    // if (Routing.db) {
    //     var l = new Array<DebugCurve>();
    //        l.AddRange(db.Anchors.Select(a=>new DebugCurve(100,1,"red", a.PolygonalBoundary)));
    //     l.AddRange(thinRightNodes.Select(n=>n.parallelogram).Select(p=>new Polyline(p.Vertex(VertexId.Corner), p.Vertex(VertexId.VertexA),
    //         p.Vertex(VertexId.OtherCorner), p.Vertex(VertexId.VertexB))).Select(c=>new DebugCurve(100,3,"brown", c)));
    //     foreach (var le of this.edgePath.LayerEdges)
    //         l. push(new DebugCurve(100, 1, "blue", new LineSegment(db.anchors[le.Source].Origin, db.anchors[le.Target].Origin)));
    //    LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
    //     // Database(db, thinRightNodes.Select(p=>new Polyline(p.parallelogram.Vertex(VertexId.Corner), p.parallelogram.Vertex(VertexId.VertexA),
    //         //p.parallelogram.Vertex(VertexId.OtherCorner), p.parallelogram.Vertex(VertexId.VertexB)){Closed=true}).ToArray());
    // }
    return ret
  }

  private FindLeftBoundaryAnchorCurves(): Array<Polyline> {
    const ret: Array<Polyline> = new Array<Polyline>()
    let uOffset = 0
    for (const u of this.edgePath.nodes()) {
      let leftMost = -1
      for (const v of this.RightBoundaryNodesOfANode(
        u,
        Routing.GetNodeKind(uOffset, this.edgePath),
      )) {
        if (
          leftMost == -1 ||
          this.layerArrays.X[v] < this.layerArrays.X[leftMost]
        ) {
          leftMost = v
        }

        ret.push(this.anchors[v].polygonalBoundary)
      }

      if (leftMost != -1) {
        const a: Anchor = this.anchors[leftMost]
        this.thinLefttNodes.push(
          LineSegment.mkLinePXY(
            a.Origin,
            this.originalGraph.right,
            a.Origin.y,
          ).pNodeOverICurve(),
        )
      }

      uOffset++
    }

    return ret
  }

  *FillRightTopAndBottomVerts(
    layer: number[],
    vPosition: number,
    nodeKind: NodeKind,
  ): IterableIterator<number> {
    let b = 0
    let t = 0
    if (nodeKind == NodeKind.Bottom) {
      b = Number.MAX_VALUE
      // we don't have bottom boundaries here since they will be cut off
    } else if (nodeKind == NodeKind.Top) {
      t = Number.MAX_VALUE
      // we don't have top boundaries here since they will be cut off
    }

    const v: number = layer[vPosition]
    for (let i = vPosition + 1; i < layer.length; i++) {
      const u: number = layer[i]
      const anchor: Anchor = this.anchors[u]
      if (anchor.topAnchor > t) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = anchor.topAnchor
          if (anchor.bottomAnchor > b) {
            b = anchor.bottomAnchor
          }

          yield u
        }
      } else if (anchor.bottomAnchor > b) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          b = anchor.bottomAnchor
          if (anchor.topAnchor > t) {
            t = anchor.topAnchor
          }

          yield u
        }
      }
    }
  }

  *FillLeftTopAndBottomVerts(
    layer: number[],
    vPosition: number,
    nodeKind: NodeKind,
  ): IterableIterator<number> {
    let b = 0
    let t = 0
    if (nodeKind == NodeKind.Top) {
      t = Number.MAX_VALUE
    }

    // there are no top vertices - they are cut down by the top boundaryCurve curve
    if (nodeKind == NodeKind.Bottom) {
      b = Number.MAX_VALUE
    }

    // there are no bottom vertices - they are cut down by the top boundaryCurve curve
    const v: number = layer[vPosition]
    for (let i = vPosition - 1; i >= 0; i--) {
      const u: number = layer[i]
      const anchor: Anchor = this.anchors[u]
      if (anchor.topAnchor > t + GeomConstants.distanceEpsilon) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = anchor.topAnchor
          b = Math.max(b, anchor.bottomAnchor)
          yield u
        }
      } else if (anchor.bottomAnchor > b + GeomConstants.distanceEpsilon) {
        if (!this.NodeUCanBeCrossedByNodeV(u, v)) {
          t = Math.max(t, anchor.topAnchor)
          b = anchor.bottomAnchor
          yield u
        }
      }
    }
  }

  IsVirtualVertex(v: number): boolean {
    return v >= this.originalGraph.nodeCount
  }

  IsLabel(u: number): boolean {
    return this.anchors[u].representsLabel
  }

  private NodeUCanBeCrossedByNodeV(u: number, v: number): boolean {
    if (this.IsLabel(u)) {
      return false
    }

    if (this.IsLabel(v)) {
      return false
    }

    if (
      this.IsVirtualVertex(u) &&
      this.IsVirtualVertex(v) &&
      this.EdgesIntersectSomewhere(u, v)
    ) {
      return true
    }

    return false
  }

  private EdgesIntersectSomewhere(u: number, v: number): boolean {
    if (this.UVAreMiddlesOfTheSameMultiEdge(u, v)) {
      return false
    }

    return this.IntersectAbove(u, v) || this.IntersectBelow(u, v)
  }

  private UVAreMiddlesOfTheSameMultiEdge(u: number, v: number): boolean {
    if (
      this.database.MultipleMiddles.has(u) &&
      this.database.MultipleMiddles.has(v) &&
      this.SourceOfTheOriginalEdgeContainingAVirtualNode(u) ==
      this.SourceOfTheOriginalEdgeContainingAVirtualNode(v)
    ) {
      return true
    }

    return false
  }

  SourceOfTheOriginalEdgeContainingAVirtualNode(u: number): number {
    while (this.IsVirtualVertex(u)) {
      u = this.IncomingEdge(u).Source
    }

    return u
  }

  private IntersectBelow(u: number, v: number): boolean {
    while (true) {
      const eu: LayerEdge = this.OutcomingEdge(u)
      const ev: LayerEdge = this.OutcomingEdge(v)
      if (this.Intersect(eu, ev)) {
        return true
      }

      u = eu.Target
      v = ev.Target
      if (!(this.IsVirtualVertex(u) && this.IsVirtualVertex(v))) {
        if (v == u) {
          return true
        }

        return false
      }
    }
  }

  private IntersectAbove(u: number, v: number): boolean {
    while (true) {
      const eu: LayerEdge = this.IncomingEdge(u)
      const ev: LayerEdge = this.IncomingEdge(v)
      if (this.Intersect(eu, ev)) {
        return true
      }

      u = eu.Source
      v = ev.Source
      if (!(this.IsVirtualVertex(u) && this.IsVirtualVertex(v))) {
        if (u == v) {
          return true
        }

        return false
      }
    }
  }

  private Intersect(e: LayerEdge, m: LayerEdge): boolean {
    const a: number =
      this.layerArrays.X[e.Source] - this.layerArrays.X[m.Source]
    const b: number =
      this.layerArrays.X[e.Target] - this.layerArrays.X[m.Target]
    return (a > 0 && b < 0) || (a < 0 && b > 0)
    // return (layerArrays.X[e.Source] - layerArrays.X[m.Source]) * (layerArrays.X[e.Target] - layerArrays.X[m.Target]) < 0;
  }

  private IncomingEdge(u: number): LayerEdge {
    return this.layeredGraph.InEdgeOfVirtualNode(u)
  }

  // here u is a virtual vertex
  private OutcomingEdge(u: number): LayerEdge {
    return this.layeredGraph.OutEdgeOfVirtualNode(u)
  }

  private RightBoundaryNodesOfANode(
    i: number,
    nodeKind: NodeKind,
  ): IterableIterator<number> {
    return this.FillRightTopAndBottomVerts(
      this.NodeLayer(i),
      this.layerArrays.X[i],
      nodeKind,
    )
  }

  private NodeLayer(i: number): number[] {
    return this.layerArrays.Layers[this.layerArrays.Y[i]]
  }

  private LeftBoundaryNodesOfANode(
    i: number,
    nodeKind: NodeKind,
  ): IterableIterator<number> {
    return this.FillLeftTopAndBottomVerts(
      this.NodeLayer(i),
      this.layerArrays.X[i],
      nodeKind,
    )
  }

  private /* internal */ GetSpline(optimizeShortEdges: boolean): ICurve {
    this.CreateRefinedPolyline(optimizeShortEdges)
    return this.CreateSmoothedPolyline()
  }

  //    static int calls;
  //  bool debug { get { return calls == 5;} }
  Poly(): Curve {
    const c: Curve = new Curve()
    for (let s = this.headSite; s.next != null; s = s.next) {
      c.addSegment(
        new BezierSeg(
          s.point,
          Point.convSum(1 / 3, s.point, s.next.point),
          Point.convSum(2 / 3, s.point, s.next.point),
          s.next.point,
        ),
      )
    }

    return c
  }

  get GetPolyline(): SmoothedPolyline {
    Assert.assert(this.headSite != null)
    return new SmoothedPolyline(this.headSite)
  }

  LineSegIntersectBound(a: Point, b: Point): boolean {
    const l = LineSegment.mkLinePP(a, b)
    return (
      SmoothedPolylineCalculator.CurveIntersectsHierarchy(
        l,
        this.leftHierarchy,
      ) ||
      SmoothedPolylineCalculator.CurveIntersectsHierarchy(
        l,
        this.thinLeftHierarchy,
      ) ||
      SmoothedPolylineCalculator.CurveIntersectsHierarchy(
        l,
        this.rightHierarchy,
      ) ||
      SmoothedPolylineCalculator.CurveIntersectsHierarchy(
        l,
        this.thinRightHierarchy,
      )
    )
  }

  SegIntersectRightBound(a: CornerSite, b: CornerSite): boolean {
    return (
      SmoothedPolylineCalculator.SegIntersectsBound(a, b, this.leftHierarchy) ||
      SmoothedPolylineCalculator.SegIntersectsBound(
        a,
        b,
        this.thinLeftHierarchy,
      )
    )
  }

  SegIntersectLeftBound(a: CornerSite, b: CornerSite): boolean {
    return (
      SmoothedPolylineCalculator.SegIntersectsBound(
        a,
        b,
        this.rightHierarchy,
      ) ||
      SmoothedPolylineCalculator.SegIntersectsBound(
        a,
        b,
        this.thinRightHierarchy,
      )
    )
  }

  private TryToRemoveInflectionEdge(/* ref */ s: CornerSite): boolean {
    if (s.next.next == null) {
      return false
    }

    if (s.prev == null) {
      return false
    }

    if (s.turn < 0) {
      // left turn at s
      if (
        !this.SegIntersectRightBound(s, s.next.next) &&
        !this.SegIntersectLeftBound(s, s.next.next)
      ) {
        const n: CornerSite = s.next.next
        s.next = n
        // forget about s.next
        n.prev = s
        s = n
        return true
      }

      if (
        !this.SegIntersectLeftBound(s.prev, s.next) &&
        !this.SegIntersectRightBound(s.prev, s.next)
      ) {
        const a: CornerSite = s.prev
        // forget s
        const b: CornerSite = s.next
        a.next = b
        b.prev = a
        s = b
        return true
      }
    } else {
      // right turn at s
      if (
        !this.SegIntersectLeftBound(s, s.next.next) &&
        !this.SegIntersectRightBound(s, s.next.next)
      ) {
        const n: CornerSite = s.next.next
        s.next = n
        // forget about s.next
        n.prev = s
        s = n
        return true
      }

      if (
        !this.SegIntersectRightBound(s.prev, s.next) &&
        this.SegIntersectLeftBound(s.prev, s.next)
      ) {
        const a: CornerSite = s.prev
        // forget s
        const b: CornerSite = s.next
        a.next = b
        b.prev = a
        s = b
        return true
      }
    }

    return false
  }

  static SegIntersectsBound(
    a: CornerSite,
    b: CornerSite,
    hierarchy: PN,
  ): boolean {
    return SmoothedPolylineCalculator.CurveIntersectsHierarchy(
      LineSegment.mkLinePP(a.point, b.point),
      hierarchy,
    )
  }

  private static CurveIntersectsHierarchy(
    lineSeg: LineSegment,
    hierarchy: PN,
  ): boolean {
    if (hierarchy == null) {
      return false
    }

    if (
      !Parallelogram.intersect(
        lineSeg.pNodeOverICurve().parallelogram,
        hierarchy.parallelogram,
      )
    ) {
      return false
    }

    const n = hierarchy.node as PNInternal
    if (n != null) {
      return (
        SmoothedPolylineCalculator.CurveIntersectsHierarchy(
          lineSeg,
          n.children[0],
        ) ||
        SmoothedPolylineCalculator.CurveIntersectsHierarchy(
          lineSeg,
          n.children[1],
        )
      )
    }

    return Curve.intersectionOne(lineSeg, hierarchy.seg, false) != null
  }

  static Flat(i: CornerSite): boolean {
    return (
      Point.getTriangleOrientation(i.prev.point, i.point, i.next.point) ==
      TriangleOrientation.Collinear
    )
  }

  Reverse(): SmoothedPolylineCalculator {
    const ret: SmoothedPolylineCalculator = new SmoothedPolylineCalculator(
      this.edgePath,
      this.anchors,
      this.originalGraph,
      this.settings,
      this.layerArrays,
      this.layeredGraph,
      this.database,
    )
    let site: CornerSite = this.headSite
    let v: CornerSite = null
    while (site != null) {
      ret.headSite = site.clone()
      ret.headSite.next = v
      if (v != null) {
        v.prev = ret.headSite
      }

      v = ret.headSite
      site = site.next
    }

    return ret
  }

  private CreateRefinedPolyline(optimizeShortEdges: boolean) {
    this.CreateInitialListOfSites()
    let topSite: CornerSite = this.headSite
    let bottomSite: CornerSite
    for (let i = 0; i < this.edgePath.Count; i++) {
      bottomSite = topSite.next
      this.RefineBeetweenNeighborLayers(
        topSite,
        this.EdgePathNode(i),
        this.EdgePathNode(i + 1),
      )
      topSite = bottomSite
    }

    this.TryToRemoveInflections()
    if (optimizeShortEdges) {
      this.OptimizeShortPath()
    }
  }

  private RefineBeetweenNeighborLayers(
    topSite: CornerSite,
    topNode: number,
    bottomNode: number,
  ) {
    RefinerBetweenTwoLayers.Refine(
      topNode,
      bottomNode,
      topSite,
      this.anchors,
      this.layerArrays,
      this.layeredGraph,
      this.originalGraph,
      this.settings.LayerSeparation,
    )
  }

  private CreateInitialListOfSites() {
    const currentSite: CornerSite
    for (let i = 1; i <= this.edgePath.Count; i++) {
      currentSite = new CornerSite(currentSite, this.EdgePathPoint(i))
    }
  }

  get TailSite(): CornerSite {
    const s: CornerSite = this.headSite
    while (s.next != null) {
      s = s.next
    }

    return s
  }

  OptimizeForThreeSites() {
    Assert.assert(this.edgePath.LayerEdges.Count == 2)
    const top: number = this.EdgePathNode(0)
    const bottom: number = this.EdgePathNode(2)
    const a: Anchor = this.anchors[top]
    const b: Anchor = this.anchors[bottom]
    const ax: number = a.X
    const bx: number = b.X
    if (ApproximateComparer.Close(ax, bx)) {
      return
    }

    const sign: number
    if (
      !this.FindLegalPositions(a, b, /* ref */ ax, /* ref */ bx, /* out */ sign)
    ) {
      return
    }

    const ratio: number = (a.y - b.y) / (a.Bottom - b.Top)
    const xc = 0.5 * (ax + bx)
    const half: number = sign * ((ax - bx) * 0.5)
    ax = xc + ratio * (half * sign)
    bx = xc - ratio * (half * sign)
    this.headSite.point = new Point(ax, a.y)
    const ms = this.headSite.next
    const mY: number = ms.point.y
    ms.point = new Point(this.MiddlePos(ax, bx, a, b, mY), mY)
    ms.next.point = new Point(bx, b.y)
    const ma: Anchor = this.anchors[this.EdgePathNode(1)]
    ma.X = ms.point.x
    // show(new DebugCurve(200, 3, "yellow", new LineSegment(ax, a.y, ms.point.X, ms.point.y)),
    //     new DebugCurve(200, 3, "green", new LineSegment(bx, b.y, ms.point.X, ms.point.y)));
  }

  OptimizeForTwoSites() {
    Assert.assert(this.edgePath.LayerEdges.Count == 1)
    const top: number = this.EdgePathNode(0)
    const bottom: number = this.EdgePathNode(1)
    const a: Anchor = this.anchors[top]
    const b: Anchor = this.anchors[bottom]
    const ax: number = a.X
    const bx: number = b.X
    if (ApproximateComparer.Close(ax, bx)) {
      return
    }

    const sign: number
    if (!this.FindPositions(a, b, /* ref */ ax, /* ref */ bx, /* out */ sign)) {
      return
    }

    const ratio: number = (a.y - b.y) / (a.Bottom - b.Top)
    const xc = 0.5 * (ax + bx)
    const half: number = sign * ((ax - bx) * 0.5)
    ax = xc + ratio * (half * sign)
    bx = xc - ratio * (half * sign)
    this.headSite.point = new Point(ax, a.y)
    this.headSite.next.point = new Point(bx, b.y)
  }

  private FindLegalPositions(
    a: Anchor,
    b: Anchor,
    t: {
      ax: number
      bx: number
      sign: number
    },
  ): boolean {
    if (!this.FindPositions(a, b, t)) {
      return false
    }

    if (this.PositionsAreLegal(ax, bx, sign, a, b, this.EdgePathNode(1))) {
      return true
    }

    ax = (ax + a.X) / 2
    bx = (bx + b.X) / 2

    return false
  }

  private FindPositions(
    a: Anchor,
    b: Anchor,
    t: {
      ax: number
      bx: number
      sign: number
    },
  ): boolean {
    let overlapMax: number
    let overlapMin: number
    if (t.ax < t.bx) {
      t.sign = 1
      overlapMin = Math.max(t.ax, b.left)
      overlapMax = Math.min(a.right, t.bx)
    } else {
      t.sign = -1
      overlapMin = Math.max(a.left, t.bx)
      overlapMax = Math.min(b.right, t.ax)
    }

    if (overlapMin <= overlapMax) {
      t.bx = 0.5 * (overlapMin + overlapMax)
      t.ax = 0.5 * (overlapMin + overlapMax)
    } else {
      if (this.OriginToOriginSegCrossesAnchorSide(a, b)) {
        return false
      }

      if (t.sign == 1) {
        t.ax = a.right - 0.1 * a.RightAnchor
        t.bx = b.left
      } else {
        t.ax = a.left + 0.1 * a.LeftAnchor
        t.bx = b.right
      }
    }

    return true
  }

  private OriginToOriginSegCrossesAnchorSide(a: Anchor, b: Anchor): boolean {
    Assert.assert(a.y > b.y)
    const seg = new LineSegment(a.Origin, b.Origin)
    return (
      (a.X < b.X &&
        Curve.CurvesIntersect(
          seg,
          new LineSegment(a.RightBottom, a.RightTop),
        )) ||
      Curve.CurvesIntersect(seg, new LineSegment(b.LeftBottom, a.LeftTop)) ||
      (a.X > b.X &&
        Curve.CurvesIntersect(seg, new LineSegment(a.LeftBottom, a.LeftTop))) ||
      Curve.CurvesIntersect(seg, new LineSegment(b.RightBottom, a.RightTop))
    )
  }

  private OptimizeShortPath() {
    if (this.edgePath.Count > 2) {
      return
    }

    if (
      this.edgePath.Count == 2 &&
      this.headSite.next.next != null &&
      this.headSite.next.next.next == null &&
      this.anchors[this.EdgePathNode(1)].Node == null
    ) {
      this.OptimizeForThreeSites()
    } else if (this.edgePath.Count == 1) {
      this.OptimizeForTwoSites()
    }
  }

  private PositionsAreLegal(
    sax: number,
    sbx: number,
    sign: number,
    a: Anchor,
    b: Anchor,
    middleNodeIndex: number,
  ): boolean {
    if (!ApproximateComparer.Close(sax, sbx) && (sax - sbx) * sign > 0) {
      return false
    }

    const mAnchor: Anchor = this.anchors[middleNodeIndex]
    const mx: number = this.MiddlePos(sax, sbx, a, b, mAnchor.y)
    if (!this.MiddleAnchorLegal(mx, middleNodeIndex, mAnchor)) {
      return false
    }

    return !this.LineSegIntersectBound(
      new Point(sax, a.Bottom),
      new Point(sbx, b.Top),
    )
  }

  private MiddleAnchorLegal(
    mx: number,
    middleNodeIndex: number,
    mAnchor: Anchor,
  ): boolean {
    const mLayer = this.NodeLayer(middleNodeIndex)
    const pos: number = this.layerArrays.X[middleNodeIndex]
    const shift: number = mx - mAnchor.X
    if (pos > 0) {
      const l: Anchor = this.anchors[mLayer[pos - 1]]
      if (l.right > shift + mAnchor.left) {
        return false
      }
    }

    if (pos < mLayer.Length - 1) {
      const r: Anchor = this.anchors[mLayer[pos + 1]]
      if (r.left < shift + mAnchor.right) {
        return false
      }
    }

    return true
  }

  private MiddlePos(
    sax: number,
    sbx: number,
    a: Anchor,
    b: Anchor,
    mY: number,
  ): number {
    const u: number = a.y - mY
    const l: number = mY - b.y
    Assert.assert(u >= 0 && l >= 0)
    return (sax * u + sbx * l) / (u + l)
  }

  private TryToRemoveInflections() {
    if (this.TurningAlwaySameDirection()) {
      return
    }

    let progress = true
    while (progress) {
      progress = false
      for (
        const s: CornerSite = this.headSite;
        s != null && s.next != null;
        s = s.next
      ) {
        progress = this.TryToRemoveInflectionEdge(/* ref */ s) || progress
      }
    }
  }

  private TurningAlwaySameDirection(): boolean {
    let sign = 0
    // undecided
    for (
      const s: CornerSite = this.headSite.next;
      s != null && s.next != null;
      s = s.next
    ) {
      const nsign: number = s.Turn
      if (sign == 0) {
        // try to set the sign
        if (nsign > 0) {
          sign = 1
        } else if (nsign < 0) {
          sign = -1
        }
      } else if (sign * nsign < 0) {
        return false
      }
    }

    return true
  }

  EdgePathPoint(i: number): Point {
    return this.anchors[this.EdgePathNode(i)].Origin
  }

  EdgePathNode(i: number): number {
    const v: number
    if (i == this.edgePath.Count) {
      v = this.edgePath[this.edgePath.Count - 1].Target
    } else {
      v = this.edgePath[i].Source
    }

    return v
  }

  CreateSmoothedPolyline(): Curve {
    this.RemoveVerticesWithNoTurns()
    const curve: Curve = new Curve()
    const a: CornerSite = this.headSite
    // the corner start
    const b: CornerSite
    // the corner origin
    const c: CornerSite
    // the corner other end
    if (Curve.FindCorner(a, /* out */ b, /* out */ c)) {
      this.CreateFilletCurve(curve, /* ref */ a, /* ref */ b, /* ref */ c)
      curve = this.ExtendCurveToEndpoints(curve)
    } else {
      curve.AddSegment(
        new LineSegment(this.headSite.point, this.TailSite.point),
      )
    }

    return curve
  }

  private RemoveVerticesWithNoTurns() {
    while (this.RemoveVerticesWithNoTurnsOnePass()) { }
  }

  private RemoveVerticesWithNoTurnsOnePass(): boolean {
    const ret = false
    for (
      const s: CornerSite = this.headSite;
      s.next != null && s.next.next != null;
      s = s.next
    ) {
      if (SmoothedPolylineCalculator.Flat(s.next)) {
        ret = true
        s.next = s.next.next
        // crossing out s.next
        s.next.prev = s
      }
    }

    return ret
  }

  private ExtendCurveToEndpoints(curve: Curve): Curve {
    const p: Point = this.headSite.point
    if (!ApproximateComparer.Close(p, curve.Start)) {
      const nc: Curve = new Curve()
      nc.AddSegs(new LineSegment(p, curve.Start), curve)
      curve = nc
    }

    p = this.TailSite.point
    if (!ApproximateComparer.Close(p, curve.End)) {
      curve.AddSegment(new LineSegment(curve.End, p))
    }

    return curve
  }

  private CreateFilletCurve(
    curve: Curve,
    /* ref */ a: CornerSite,
    /* ref */ b: CornerSite,
    /* ref */ c: CornerSite,
  ) {
    for (; true;) {
      this.AddSmoothedCorner(a, b, c, curve)
      a = b
      b = c
      if (b.next != null) {
        c = b.next
      } else {
        break
      }
    }
  }

  private AddSmoothedCorner(
    a: CornerSite,
    b: CornerSite,
    c: CornerSite,
    curve: Curve,
  ) {
    const k = 0.5
    const seg: CubicBezierSegment
    for (; this.BezierSegIntersectsBoundary(seg);) {
      seg = Curve.CreateBezierSeg(k, k, a, b, c)
      // if (Routing.db)
      //     LayoutAlgorithmSettings .Show(seg, CreatePolyTest());
      b.PreviousBezierSegmentFitCoefficient = k
      2
    }

    k = k * 2
    // that was the last k
    if (k < 0.5) {
      // one time try a smoother seg
      k = 0.5 * (k + k * 2)
      const nseg: CubicBezierSegment = Curve.CreateBezierSeg(k, k, a, b, c)
      if (!this.BezierSegIntersectsBoundary(nseg)) {
        b.NextBezierSegmentFitCoefficient = k
        b.PreviousBezierSegmentFitCoefficient = k
        seg = nseg
      }
    }

    if (
      curve.Segments.Count > 0 &&
      !ApproximateComparer.Close(curve.End, seg.Start)
    ) {
      curve.AddSegment(new LineSegment(curve.End, seg.Start))
    }

    curve.AddSegment(seg)
  }

  private BezierSegIntersectsBoundary(seg: CubicBezierSegment): boolean {
    const side: number = Point.SignedDoubledTriangleArea(
      seg.B(0),
      seg.B(1),
      seg.B(2),
    )
    if (side > 0) {
      return (
        this.BezierSegIntersectsTree(seg, this.thinLeftHierarchy) ||
        this.BezierSegIntersectsTree(seg, this.leftHierarchy)
      )
    } else {
      return (
        this.BezierSegIntersectsTree(seg, this.thinRightHierarchy) ||
        this.BezierSegIntersectsTree(seg, this.rightHierarchy)
      )
    }
  }

  private BezierSegIntersectsTree(seg: BezierSeg, tree: PN): boolean {
    if (tree == null) {
      return false
    }

    if (
      Parallelogram.intersect(
        seg.pNodeOverICurve().parallelogram,
        tree.parallelogram,
      )
    ) {
      const n = tree
      if (n != null) {
        return (
          this.BezierSegIntersectsTree(
            seg,
            (n.node as PNInternal).children[0],
          ) ||
          this.BezierSegIntersectsTree(seg, (n.node as PNInternal).children[1])
        )
      } else {
        return this.BezierSegIntersectsBoundary(seg, (tree as PN).seg)
      }
    } else {
      return false
    }
  }

  static BezierSegIntersectsBoundary(
    seg: CubicBezierSegment,
    curve: ICurve,
  ): boolean {
    for (const x of Curve.GetAllIntersections(seg, curve, false)) {
      const c: Curve = <Curve>curve
      if (c != null) {
        if (Curve.RealCutWithClosedCurve(x, c, false)) {
          return true
        }
      } else {
        // curve is a line from a thin hierarchy that's forbidden to touch
        return true
      }
    }

    return false
  }
}
