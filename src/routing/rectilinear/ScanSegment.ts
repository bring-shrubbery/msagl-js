import {from} from 'linq-to-typescript'
// import {Curve} from '../../math/geometry/curve'
import {Point} from '../../math/geometry/point'
// import {Assert} from '../../utils/assert'
import {compareNumbers} from '../../utils/compare'
import {SegmentBase} from '../visibility/SegmentBase'
import {VisibilityEdge} from '../visibility/VisibilityEdge'
import {VisibilityGraph} from '../visibility/VisibilityGraph'
import {VisibilityVertex} from '../visibility/VisibilityVertex'
import {GroupBoundaryCrossing} from './GroupBoundaryCrossing'
import {PointAndCrossings} from './PointAndCrossings'
import {PointAndCrossingsList} from './PointAndCrossingsList'
import {PointComparer} from './PointComparer'
import {ScanDirection} from './ScanDirection'
import {ScanSegmentTree} from './ScanSegmentTree'
import {StaticGraphUtility} from './StaticGraphUtility'

export class ScanSegment extends SegmentBase {
  //  This is a single segment added by the ScanLine.
  GroupBoundaryPointAndCrossingsList: PointAndCrossingsList

  private endPoint: Point

  private startPoint: Point

  static readonly NormalWeight: number = VisibilityEdge.DefaultWeight

  static readonly ReflectionWeight: number = 5

  static readonly OverlappedWeight: number = 500

  Weight: number

  //  For sparse visibility graph.
  NextSegment: ScanSegment

  static mk(start: Point, end: Point): ScanSegment {
    return new ScanSegment(
      start,
      end,
      ScanSegment.NormalWeight,
      /* gbcList:*/ null,
    )
  }

  constructor(
    start: Point,
    end: Point,
    weight: number,
    gbcList: PointAndCrossingsList,
  ) {
    super()
    this.Update(start, end)
    this.Weight = weight
    this.GroupBoundaryPointAndCrossingsList = gbcList
  }

  /* override */ get Start(): Point {
    return this.startPoint
  }

  /* override */ get End(): Point {
    return this.endPoint
  }

  get IsVertical(): boolean {
    return ScanSegment.IsVerticalSegment(this.Start, this.End)
  }

  get ScanDirection(): ScanDirection {
    return this.IsVertical
      ? ScanDirection.VerticalInstance
      : ScanDirection.HorizontalInstance
  }

  //  For fast intersection calculation and ScanSegment splicing.
  LowestVisibilityVertex: VisibilityVertex

  HighestVisibilityVertex: VisibilityVertex

  //  For overlaps, we will need to create a VisibilityVertex at the junction of overlapped/nonoverlapped
  //  segments, but we don't want to create this for non-overlapped situations.
  get IsOverlapped(): boolean {
    return ScanSegment.OverlappedWeight == this.Weight
  }

  get IsReflection(): boolean {
    return ScanSegment.ReflectionWeight == this.Weight
  }

  NeedStartOverlapVertex: boolean

  NeedEndOverlapVertex: boolean

  static IsVerticalSegment(start: Point, end: Point): boolean {
    return start.x == end.x
  }

  MergeGroupBoundaryCrossingList(other: PointAndCrossingsList) {
    if (other != null) {
      if (this.GroupBoundaryPointAndCrossingsList == null) {
        this.GroupBoundaryPointAndCrossingsList = new PointAndCrossingsList()
      }

      this.GroupBoundaryPointAndCrossingsList.MergeFrom(other)
    }
  }

  TrimGroupBoundaryCrossingList() {
    if (this.GroupBoundaryPointAndCrossingsList != null) {
      this.GroupBoundaryPointAndCrossingsList.Trim(this.Start, this.End)
    }
  }

  //  ctor
  Update(start: Point, end: Point) {
    /*Assert.assert(
      PointComparer.EqualPP(start, end) ||
        StaticGraphUtility.IsAscending(PointComparer.GetDirections(start, end)),
      'non-ascending segment',
    )*/
    this.startPoint = start
    this.endPoint = end
  }

  private SetInitialVisibilityVertex(newVertex: VisibilityVertex) {
    this.LowestVisibilityVertex = newVertex
    this.HighestVisibilityVertex = newVertex
  }
  AppendVisibilityVertex(vg: VisibilityGraph, newVertex: VisibilityVertex) {
    /*Assert.assert(newVertex != null, 'newVertex must not be null')*/
    /*Assert.assert(
      (this.LowestVisibilityVertex == null) ==
        (this.HighestVisibilityVertex == null),
      'Mismatched null Lowest/HighestVisibilityVertex',
    )*/
    /*Assert.assert(
      StaticGraphUtility.PointIsOnSegmentSP(this, newVertex.point),
      'newVertex is out of segment range',
    )*/
    if (this.HighestVisibilityVertex == null) {
      if (!this.AddGroupCrossingsBeforeHighestVisibilityVertex(vg, newVertex)) {
        this.SetInitialVisibilityVertex(newVertex)
      }
    } else {
      //  In the event of overlaps where ScanSegments share a Start/End at a border, SegmentIntersector
      //  may be appending the same Vertex twice.  If that point is on the border of a group,
      //  then we may have just added the border-crossing edge as well.
      if (
        PointComparer.IsPureLower(
          newVertex.point,
          this.HighestVisibilityVertex.point,
        )
      ) {
        /*Assert.assert(
          null !=
            vg.FindEdgePP(newVertex.point, this.HighestVisibilityVertex.point),
          'unexpected low/middle insertion to ScanSegment',
        )*/
        return
      }

      //  Add the new edge.  This will always be in the ascending direction.
      if (!this.AddGroupCrossingsBeforeHighestVisibilityVertex(vg, newVertex)) {
        this.AppendHighestVisibilityVertex(newVertex)
      }
    }
  }
  private AddVisibilityEdge(
    source: VisibilityVertex,
    target: VisibilityVertex,
  ): VisibilityEdge {
    /*Assert.assert(source.point != target.point, 'Self-edges are not allowed')*/
    /*Assert.assert(
      PointComparer.IsPureLower(source.point, target.point),
      'Impure or reversed direction encountered',
    )*/
    //  Make sure we aren't adding two edges in the same direction to the same vertex.
    /*Assert.assert(
      StaticGraphUtility.FindAdjacentVertex(
        source,
        StaticGraphUtility.EdgeDirectionVV(source, target),
      ) == null,
      'Duplicate outEdge from Source vertex',
    )*/
    /*Assert.assert(
      StaticGraphUtility.FindAdjacentVertex(
        target,
        StaticGraphUtility.EdgeDirectionVV(target, source),
      ) == null,
      'Duplicate inEdge to Target vertex',
    )*/
    const edge = new VisibilityEdge(source, target, this.Weight)
    VisibilityGraph.AddEdge(edge)
    return edge
  }

  private AppendHighestVisibilityVertex(newVertex: VisibilityVertex) {
    if (
      !PointComparer.EqualPP(
        this.HighestVisibilityVertex.point,
        newVertex.point,
      )
    ) {
      this.AddVisibilityEdge(this.HighestVisibilityVertex, newVertex)
      this.HighestVisibilityVertex = newVertex
    }
  }
  private LoadStartOverlapVertexIfNeeded(vg: VisibilityGraph) {
    //  For adjacent segments with different IsOverlapped, we need a vertex that
    //  joins the two so a path may be run.  This is paired with the other segment's
    //  LoadEndOverlapVertexIfNeeded.
    if (this.NeedStartOverlapVertex) {
      const vertex: VisibilityVertex = vg.FindVertex(this.Start)
      this.AppendVisibilityVertex(vg, vertex ?? vg.AddVertexP(this.Start))
    }
  }

  private LoadEndOverlapVertexIfNeeded(vg: VisibilityGraph) {
    //  See comments in LoadStartOverlapVertexIfNeeded.
    if (this.NeedEndOverlapVertex) {
      const vertex: VisibilityVertex = vg.FindVertex(this.End)
      this.AppendVisibilityVertex(vg, vertex ?? vg.AddVertexP(this.End))
    }
  }
  OnSegmentIntersectorBegin(vg: VisibilityGraph) {
    //  If we process any group crossings, they'll have created the first point.
    if (!this.AppendGroupCrossingsThroughPoint(vg, this.Start)) {
      this.LoadStartOverlapVertexIfNeeded(vg)
    }
  }

  OnSegmentIntersectorEnd(vg: VisibilityGraph) {
    this.AppendGroupCrossingsThroughPoint(vg, this.End)
    this.GroupBoundaryPointAndCrossingsList = null
    if (
      this.HighestVisibilityVertex == null ||
      PointComparer.IsPureLower(this.HighestVisibilityVertex.point, this.End)
    ) {
      this.LoadEndOverlapVertexIfNeeded(vg)
    }
  }
  // If we have collinear segments, then we may be able to just update the previous one
  // instead of growing the ScanSegmentTree.
  //  - For multiple collinear OpenVertexEvents, neighbors to the high side have not yet
  //    been seen, so a segment is created that spans the lowest and highest neighbors.
  //    A subsequent collinear OpenVertexEvent will be to the high side and will add a
  //    subsegment of that segment, so we subsume it into LastAddedSegment.
  //  - For multiple collinear CloseVertexEvents, closing neighbors to the high side are
  //    still open, so a segment is created from the lowest neighbor to the next-highest
  //    collinear obstacle to be closed.  When that next-highest CloseVertexEvent is
  //    encountered, it will extend LastAddedSegment.
  //  - For multiple collinear mixed Open and Close events, we'll do all Opens first,
  //    followed by all closes (per EventQueue opening), so we may add multiple discrete
  //    segments, which ScanSegmentTree will merge.
  static Subsume(
    t: {seg: ScanSegment},
    newStart: Point,
    newEnd: Point,
    weight: number,
    gbcList: PointAndCrossingsList,
    scanDir: ScanDirection,
    tree: ScanSegmentTree,
    ot: {extendStart: boolean; extendEnd: boolean},
  ): boolean {
    // Initialize these to the non-subsumed state; the endpoints were extended (or on a
    // different line).
    ot.extendStart = true
    ot.extendEnd = true
    if (t.seg == null) {
      return false
    }

    // If they don't overlap (including touching at an endpoint), we don't subsume.
    if (
      !StaticGraphUtility.IntervalsOverlapPPPP(
        t.seg.Start,
        t.seg.End,
        newStart,
        newEnd,
      )
    ) {
      return false
    }

    // If the overlapped-ness isn't the same, we don't subsume.  ScanSegmentTree::MergeSegments
    // will mark that the low-to-high direction needs a VisibilityVertex to link the two segments.
    // These may differ by more than Curve.DistanceEpsilon in the case of reflection lookahead
    // segments collinear with vertex-derived segments, so have a looser tolerance here and we'll
    // adjust the segments in ScanSegmentTree.MergeSegments.
    if (t.seg.Weight != weight) {
      if (t.seg.Start == newStart && t.seg.End == newEnd) {
        // This is probably because of a rounding difference by one DistanceEpsilon reporting being
        // inside an obstacle vs. the scanline intersection calculation side-ordering.
        // Test is RectilinearFileTests.Overlap_Rounding_Vertex_Intersects_Side.
        t.seg.Weight = Math.min(t.seg.Weight, weight)
        return true
      }

      // In the case of groups, we go through the group boundary; this may coincide with a
      // reflection segment. RectilinearFileTests.ReflectionSubsumedBySegmentExitingGroup.
      /*Assert.assert(
        (t.seg.Weight == ScanSegment.OverlappedWeight) ==
          (weight == ScanSegment.OverlappedWeight) ||
          Curve.closeIntersectionPoints(t.seg.End, newStart) ||
          Curve.closeIntersectionPoints(t.seg.Start, newEnd),
        'non-equal overlap-mismatched ScanSegments overlap by more than just Start/End',
      )*/
      return false
    }

    // Subsume the input segment.  Return whether the start/end points were extended (newStart
    // is before this.Start, or newEnd is after this.End), so the caller can generate reflections
    // and so we can merge group border crossings.
    ot.extendStart = -1 == scanDir.CompareScanCoord(newStart, t.seg.Start)
    ot.extendEnd = 1 == scanDir.CompareScanCoord(newEnd, t.seg.End)
    if (ot.extendStart || ot.extendEnd) {
      // We order by start and end so need to replace this in the tree regardless of which end changes.
      tree.Remove(t.seg)
      t.seg.startPoint = scanDir.Min(t.seg.Start, newStart)
      t.seg.endPoint = scanDir.Max(t.seg.End, newEnd)
      t.seg = tree.InsertUnique(t.seg).item
      t.seg.MergeGroupBoundaryCrossingList(gbcList)
    }
    return true
  }

  IntersectsSegment(seg: ScanSegment): boolean {
    return StaticGraphUtility.SegmentsIntersection(this, seg) != undefined
  }

  toString(): string {
    return (
      '[' +
      this.Start +
      ' -> ' +
      this.End +
      (this.IsOverlapped ? ' olap' : ' free') +
      ']'
    )
  }

  ContainsPoint(test: Point): boolean {
    //  This may be off the line so do not use GetPureDirections.
    return (
      PointComparer.EqualPP(this.Start, test) ||
      PointComparer.EqualPP(this.End, test) ||
      PointComparer.GetDirections(this.Start, test) ==
        PointComparer.GetDirections(test, this.End)
    )
  }

  private sparsePerpendicularCoords: Set<number>

  get HasSparsePerpendicularCoords(): boolean {
    return this.sparsePerpendicularCoords == null
      ? false
      : this.sparsePerpendicularCoords.size > 0
  }

  private CreatePointFromPerpCoord(perpCoord: number): Point {
    return this.IsVertical
      ? new Point(this.Start.x, perpCoord)
      : new Point(perpCoord, this.Start.y)
  }

  AddSparseVertexCoord(perpCoord: number) {
    /*Assert.assert(
      this.ContainsPoint(this.CreatePointFromPerpCoord(perpCoord)),
      'vertexLocation is not on Segment',
    )*/
    if (this.sparsePerpendicularCoords == null) {
      this.sparsePerpendicularCoords = new Set<number>()
    }

    this.sparsePerpendicularCoords.add(perpCoord)
  }

  AddSparseEndpoint(coord: number): boolean {
    //  This is called after AddSparseVertexCoord so this.sparsePerpendicularCoords is already instantiated.
    if (!this.sparsePerpendicularCoords.has(coord)) {
      this.sparsePerpendicularCoords.add(coord)
      return true
    }

    return false
  }

  CreateSparseVerticesAndEdges(vg: VisibilityGraph) {
    if (this.sparsePerpendicularCoords == null) {
      return
    }

    this.AppendGroupCrossingsThroughPoint(vg, this.Start)
    for (const perpCoord of Array.from(
      this.sparsePerpendicularCoords.values(),
    ).sort(compareNumbers)) {
      const vertexLocation = this.CreatePointFromPerpCoord(perpCoord)
      /*Assert.assert(
        this.ContainsPoint(vertexLocation),
        'vertexLocation is not on Segment',
      )*/
      this.AppendVisibilityVertex(
        vg,
        vg.FindVertex(vertexLocation) ?? vg.AddVertexP(vertexLocation),
      )
    }

    this.AppendGroupCrossingsThroughPoint(vg, this.End)
    this.GroupBoundaryPointAndCrossingsList = null
    this.sparsePerpendicularCoords.clear()
    this.sparsePerpendicularCoords = null
  }

  HasVisibility(): boolean {
    //  Skip this only if it has no visibility vertex.
    return null != this.LowestVisibilityVertex
  }

  private AddGroupCrossingsBeforeHighestVisibilityVertex(
    vg: VisibilityGraph,
    newVertex: VisibilityVertex,
  ): boolean {
    if (this.AppendGroupCrossingsThroughPoint(vg, newVertex.point)) {
      //  We may have added an interior vertex that is just higher than newVertex.
      if (
        PointComparer.IsPureLower(
          this.HighestVisibilityVertex.point,
          newVertex.point,
        )
      ) {
        this.AddVisibilityEdge(this.HighestVisibilityVertex, newVertex)
        this.HighestVisibilityVertex = newVertex
      }

      return true
    }

    return false
  }

  private AppendGroupCrossingsThroughPoint(
    vg: VisibilityGraph,
    lastPoint: Point,
  ): boolean {
    if (this.GroupBoundaryPointAndCrossingsList == null) {
      return false
    }

    let found = false
    while (
      this.GroupBoundaryPointAndCrossingsList.CurrentIsBeforeOrAt(lastPoint)
    ) {
      //  We will only create crossing Edges that the segment actually crosses, not those it ends before crossing.
      //  For those terminal crossings, the adjacent segment creates the interior vertex and crossing edge.
      const pac: PointAndCrossings = this.GroupBoundaryPointAndCrossingsList.Pop()
      let lowDirCrossings: GroupBoundaryCrossing[] = null
      let highDirCrossings: GroupBoundaryCrossing[] = null
      if (PointComparer.ComparePP(pac.Location, this.Start) > 0) {
        lowDirCrossings = PointAndCrossingsList.ToCrossingArray(
          pac.Crossings,
          this.ScanDirection.OppositeDirection,
        )
      }

      if (PointComparer.ComparePP(pac.Location, this.End) < 0) {
        highDirCrossings = PointAndCrossingsList.ToCrossingArray(
          pac.Crossings,
          this.ScanDirection.Dir,
        )
      }

      found = true
      const crossingVertex =
        vg.FindVertex(pac.Location) ?? vg.AddVertexP(pac.Location)
      vg.AddVertexP(pac.Location)
      if (null != lowDirCrossings || null != highDirCrossings) {
        this.AddLowCrossings(vg, crossingVertex, lowDirCrossings)
        this.AddHighCrossings(vg, crossingVertex, highDirCrossings)
      } else {
        //  This is at this.Start with only lower-direction toward group interior(s), or at this.End with only
        //  higher-direction toward group interior(s).  Therefore an adjacent ScanSegment will create the crossing
        //  edge, so create the crossing vertex here and we'll link to it.
        if (this.LowestVisibilityVertex == null) {
          this.SetInitialVisibilityVertex(crossingVertex)
        } else {
          /*Assert.assert(
            PointComparer.EqualPP(this.End, crossingVertex.point),
            'Expected this.End crossingVertex',
          )*/
          this.AppendHighestVisibilityVertex(crossingVertex)
        }
      }
    }

    return found
  }

  private static GetCrossingInteriorVertex(
    vg: VisibilityGraph,
    crossingVertex: VisibilityVertex,
    crossing: GroupBoundaryCrossing,
  ): VisibilityVertex {
    const interiorPoint: Point = crossing.GetInteriorVertexPoint(
      crossingVertex.point,
    )
    return vg.FindVertex(interiorPoint) ?? vg.AddVertexP(interiorPoint)
  }

  private AddCrossingEdge(
    vg: VisibilityGraph,
    lowVertex: VisibilityVertex,
    highVertex: VisibilityVertex,
    crossings: GroupBoundaryCrossing[],
  ) {
    let edge: VisibilityEdge = null
    if (null != this.HighestVisibilityVertex) {
      //  We may have a case where point xx.xxxxx8 has added an ascending-direction crossing, and now we're on
      //  xx.xxxxx9 adding a descending-direction crossing.  In that case there should already be a VisibilityEdge
      //  in the direction we want.
      if (
        PointComparer.EqualPP(
          this.HighestVisibilityVertex.point,
          highVertex.point,
        )
      ) {
        edge = vg.FindEdgePP(lowVertex.point, highVertex.point)
        /*Assert.assert(
          edge != null,
          'Inconsistent forward-backward sequencing in HighVisibilityVertex',
        )*/
      } else {
        this.AppendHighestVisibilityVertex(lowVertex)
      }
    }

    if (edge == null) {
      edge = this.AddVisibilityEdge(lowVertex, highVertex)
    }

    const crossingsArray = crossings.map((c) => c.Group.InputShape)
    const prevIsPassable = edge.IsPassable
    if (prevIsPassable == null) {
      edge.IsPassable = () => from(crossingsArray).any((s) => s.IsTransparent)
    } else {
      //  Because we don't have access to the previous delegate's internals, we have to chain.  Fortunately this
      //  will never be more than two deep.  File Test: Groups_Forward_Backward_Between_Same_Vertices.
      edge.IsPassable = () =>
        from(crossingsArray).any((s) => s.IsTransparent) || prevIsPassable()
    }

    if (this.LowestVisibilityVertex == null) {
      this.SetInitialVisibilityVertex(lowVertex)
    }

    this.HighestVisibilityVertex = highVertex
  }

  private AddLowCrossings(
    vg: VisibilityGraph,
    crossingVertex: VisibilityVertex,
    crossings: GroupBoundaryCrossing[],
  ) {
    if (crossings != null) {
      const interiorVertex: VisibilityVertex = ScanSegment.GetCrossingInteriorVertex(
        vg,
        crossingVertex,
        crossings[0],
      )
      this.AddCrossingEdge(vg, interiorVertex, crossingVertex, crossings)
      //  low-to-high
    }
  }

  private AddHighCrossings(
    vg: VisibilityGraph,
    crossingVertex: VisibilityVertex,
    crossings: GroupBoundaryCrossing[],
  ) {
    if (crossings != null) {
      const interiorVertex: VisibilityVertex = ScanSegment.GetCrossingInteriorVertex(
        vg,
        crossingVertex,
        crossings[0],
      )
      this.AddCrossingEdge(vg, crossingVertex, interiorVertex, crossings)
      //  low-to-high
    }
  }
}
