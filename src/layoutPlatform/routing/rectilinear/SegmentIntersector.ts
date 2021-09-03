import {IEnumerable} from 'linq-to-typescript'
import {Point} from '../../math/geometry/point'
import {RBNode} from '../../structs/RBTree/rbNode'
import {RBTree} from '../../structs/RBTree/rbTree'
import {Assert} from '../../utils/assert'
import {VisibilityGraph} from '../visibility/VisibilityGraph'
import {VisibilityVertex} from '../visibility/VisibilityVertex'
import {PointComparer} from './PointComparer'
import {ScanSegment} from './ScanSegment'
import {ScanSegmentTree} from './ScanSegmentTree'
import {StaticGraphUtility} from './StaticGraphUtility'
import {VisibilityGraphGenerator} from './VisibilityGraphGenerator'
import {String} from 'typescript-string-operations'

class SegEvent {
  constructor(eventType: SegEventType, seg: ScanSegment) {
    eventType = eventType
    this.Segment = seg
  }

  EventType: SegEventType

  Segment: ScanSegment

  get IsVertical(): boolean {
    return SegEventType.HOpen != this.EventType
  }

  get Site(): Point {
    return SegEventType.VClose == this.EventType
      ? this.Segment.End
      : this.Segment.Start
  }

  ToString(): string {
    return String.Format(
      '{0} {1} {2} {3}',
      this.EventType,
      this.IsVertical,
      this.Site,
      this.Segment,
    )
  }
}
enum SegEventType {
  VOpen,

  VClose,

  HOpen,
}

export class SegmentIntersector {
  eventList: Array<SegEvent> = new Array<SegEvent>()

  //  For searching the tree to find the first VSeg for an HSeg.
  findFirstHSeg: ScanSegment

  visGraph: VisibilityGraph

  verticalSegmentsScanLine: RBTree<ScanSegment>
  findFirstPred: (s: ScanSegment) => boolean

  segmentsWithoutVisibility: Array<ScanSegment> = new Array<ScanSegment>()

  //  The event types.  We sweep vertically, with a horizontal scanline, so the vertical
  //  segments that are active and have X coords within the current vertical segment's
  //  span all create intersections with it.  All events are ordered on Y coordinate then X.
  constructor() {
    this.verticalSegmentsScanLine = new RBTree<ScanSegment>((a, b) =>
      this.CompareSS(a, b),
    )
    this.findFirstPred = (s) => this.IsVSegInHSegRange(s)
  }

  IsVSegInHSegRange(v: ScanSegment): boolean {
    return PointComparer.Compare(v.Start.x, this.findFirstHSeg.Start.x) >= 0
  }

  //  This creates the VisibilityVertex objects along the segments.
  Generate(
    hSegments: IEnumerable<ScanSegment>,
    vSegments: IEnumerable<ScanSegment>,
  ): VisibilityGraph {
    for (const seg of vSegments) {
      this.eventList.push(new SegEvent(SegEventType.VOpen, seg))
      this.eventList.push(new SegEvent(SegEventType.VClose, seg))
    }

    for (const seg of hSegments) {
      this.eventList.push(new SegEvent(SegEventType.HOpen, seg))
    }

    if (0 == this.eventList.length) {
      return null
      //  empty
    }

    this.eventList.sort((a, b) => this.Compare(a, b))
    //  Note: We don't need any sentinels in the scanline here, because the lowest VOpen
    //  events are loaded before the first HOpen is.
    //  Process all events.
    this.visGraph = VisibilityGraphGenerator.NewVisibilityGraph()
    for (const evt of this.eventList) {
      switch (evt.EventType) {
        case SegEventType.VOpen:
          this.OnSegmentOpen(evt.Segment)
          this.ScanInsert(evt.Segment)
          break
        case SegEventType.VClose:
          this.OnSegmentClose(evt.Segment)
          this.ScanRemove(evt.Segment)
          break
        case SegEventType.HOpen:
          this.OnSegmentOpen(evt.Segment)
          this.ScanIntersect(evt.Segment)
          break
        default:
          Assert.assert(false, 'Unknown SegEventType')
          break
      }
    }

    //  endforeach
    return this.visGraph
  }

  OnSegmentOpen(seg: ScanSegment) {
    seg.OnSegmentIntersectorBegin(this.visGraph)
  }
  OnSegmentClose(seg: ScanSegment) {
    seg.OnSegmentIntersectorEnd(this.visGraph)
    if (seg.LowestVisibilityVertex == null) {
      this.segmentsWithoutVisibility.push(seg)
    }
  }
  //  The event types.  We sweep vertically, with a horizontal scanline, so the vertical
  //  segments that are active and have X coords within the current vertical segment's
  //  span all create intersections with it.  All events are ordered on Y coordinate then X.
  //  Scan segments with no visibility will usually be internal to an overlap clump,
  //  but may be in an external "corner" of intersecting sides for a small enough span
  //  that no other segment crosses them.  In that case we don't need them and they
  //  would require extra handling later.
  RemoveSegmentsWithNoVisibility(
    horizontalScanSegments: ScanSegmentTree,
    verticalScanSegments: ScanSegmentTree,
  ) {
    for (const seg of this.segmentsWithoutVisibility) {
      ;(seg.IsVertical ? verticalScanSegments : horizontalScanSegments).Remove(
        seg,
      )
    }
  }
  ScanInsert(seg: ScanSegment) {
    Assert.assert(
      this.verticalSegmentsScanLine.find(seg) == null,
      'seg already exists in the rbtree',
    )
    //  RBTree's internal operations on insert/remove etc. mean the node can't cache the
    //  RBNode returned by insert(); instead we must do find() on each call.  But we can
    //  use the returned node to get predecessor/successor.
    this.verticalSegmentsScanLine.insert(seg)
  }

  ScanRemove(seg: ScanSegment) {
    this.verticalSegmentsScanLine.remove(seg)
  }

  ScanIntersect(hSeg: ScanSegment) {
    //  Find the VSeg in the scanline with the lowest X-intersection with HSeg, then iterate
    //  all VSegs in the scan line after that until we leave the HSeg range.
    //  We only use FindFirstHSeg in this routine, to find the first satisfying node,
    //  so we don't care that we leave leftovers in it.
    this.findFirstHSeg = hSeg
    let segNode: RBNode<ScanSegment> = this.verticalSegmentsScanLine.findFirst(
      this.findFirstPred,
    )
    for (
      ;
      null != segNode;
      segNode = this.verticalSegmentsScanLine.next(segNode)
    ) {
      const vSeg: ScanSegment = segNode.item
      if (1 == PointComparer.Compare(vSeg.Start.x, hSeg.End.x)) {
        break
        //  Out of HSeg range
      }

      const newVertex: VisibilityVertex = this.visGraph.AddVertexP(
        new Point(vSeg.Start.x, hSeg.Start.y),
      )
      //  HSeg has just opened so if we are overlapped and newVertex already existed,
      //  it was because we just closed a previous HSeg or VSeg and are now opening one
      //  whose Start is the same as previous.  So we may be appending a vertex that
      //  is already the *Seg.HighestVisibilityVertex, which will be a no-op.  Otherwise
      //  this will add a (possibly Overlapped)VisibilityEdge in the *Seg direction.
      hSeg.AppendVisibilityVertex(this.visGraph, newVertex)
      vSeg.AppendVisibilityVertex(this.visGraph, newVertex)
    }

    //  endforeach scanline VSeg in range
    this.OnSegmentClose(hSeg)
  }

  //  For ordering events first by Y, then X, then by whether it's an H or V seg.

  Compare(first: SegEvent, second: SegEvent): number {
    if (first == second) {
      return 0
    }

    if (first == null) {
      return -1
    }

    if (second == null) {
      return 1
    }

    //  Unlike the ScanSegment-generating scanline in VisibilityGraphGenerator, this scanline has no slope
    //  calculations so no additional rounding error is introduced.
    let cmp: number = PointComparer.Compare(first.Site.y, second.Site.y)
    if (0 != cmp) {
      return cmp
    }

    //  Both are at same Y so we must ensure that for equivalent Y, VClose comes after
    //  HOpen which comes after VOpen, thus make sure VOpen comes before VClose.
    if (first.IsVertical && second.IsVertical) {
      //  Separate segments may join at Start and End due to overlap.
      Assert.assert(
        !StaticGraphUtility.IntervalsOverlapSS(first.Segment, second.Segment) ||
          0 ==
            PointComparer.ComparePP(first.Segment.Start, second.Segment.End) ||
          0 == PointComparer.ComparePP(first.Segment.End, second.Segment.Start),
        'V subsumption failure detected in SegEvent comparison',
      )
      if (0 == cmp) {
        //  false is < true.
        cmp =
          (SegEventType.VClose == first.EventType ? 1 : 0) -
          (SegEventType.VClose == second.EventType ? 1 : 0)
      }

      return cmp
    }

    //  If both are H segs, then sub-order by X.
    if (!first.IsVertical && !second.IsVertical) {
      //  Separate segments may join at Start and End due to overlap, so compare by Start.X;
      //  the ending segment (lowest Start.X) comes before the Open (higher Start.X).
      Assert.assert(
        !StaticGraphUtility.IntervalsOverlapSS(first.Segment, second.Segment) ||
          0 ==
            PointComparer.ComparePP(first.Segment.Start, second.Segment.End) ||
          0 == PointComparer.ComparePP(first.Segment.End, second.Segment.Start),
        'H subsumption failure detected in SegEvent comparison',
      )
      cmp = PointComparer.Compare(first.Site.x, second.Site.x)
      return cmp
    }

    //  One is Vertical and one is Horizontal; we are only interested in the vertical at this point.
    const vEvent: SegEvent = first.IsVertical ? first : second
    //  Make sure that we have opened all V segs before and closed them after opening
    //  an H seg at the same Y coord. Otherwise we'll miss "T" or "corner" intersections.
    //  (RectilinearTests.Connected_Vertical_Segments_Are_Intersected tests that we get the expected count here.)
    //  Start assuming Vevent is 'first' and it's VOpen, which should come before HOpen.
    cmp = -1
    //  Start with first == VOpen
    if (SegEventType.VClose == vEvent.EventType) {
      cmp = 1
      //  change to first == VClose
    }

    if (vEvent != first) {
      cmp *= -1
      //  undo the swap.
    }

    return cmp
  }

  //  For ordering V segments in the scanline by X.

  CompareSS(first: ScanSegment, second: ScanSegment): number {
    if (first == second) {
      return 0
    }

    if (first == null) {
      return -1
    }

    if (second == null) {
      return 1
    }

    //  Note: Unlike the ScanSegment-generating scanline, this scanline has no slope
    //  calculations so no additional rounding error is introduced.
    let cmp: number = PointComparer.Compare(first.Start.x, second.Start.x)
    //  Separate segments may join at Start and End due to overlap, so compare the Y positions;
    //  the Close (lowest Y) comes before the Open.
    if (0 == cmp) {
      cmp = PointComparer.Compare(first.Start.y, second.Start.y)
    }

    return cmp
  }

  //  Tracks the currently open V segments.
}
