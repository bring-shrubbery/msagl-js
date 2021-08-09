///  <summary>
///  Wrap the tree of events.

import {GenericBinaryHeapPriorityQueue} from '../../structs/genericBinaryHeapPriorityQueue'
import {Assert} from '../../utils/assert'
import {SweepEvent} from '../spline/sweepEvent'
import {BasicReflectionEvent} from './basicReflectionEvent'
import {ScanDirection} from './ScanDirection'

///  </summary>
export class EventQueue {
  scanDirection: ScanDirection

  eventTree: GenericBinaryHeapPriorityQueue<SweepEvent>

  constructor() {
    this.eventTree = new GenericBinaryHeapPriorityQueue<SweepEvent>((a, b) =>
      this.Compare(a, b),
    )
  }

  Reset(scanDir: ScanDirection) {
    Assert.assert(0 == this.eventTree.count, 'Stray events in EventQueue.Reset')
    this.scanDirection = scanDir
  }

  Enqueue(evt: SweepEvent) {
    this.eventTree.Enqueue(evt, 1)
  }

  Dequeue(): SweepEvent {
    const evt: SweepEvent = this.eventTree.Dequeue()
    return evt
  }

  get Count(): number {
    return this.eventTree.count
  }

  public Compare(lhs: SweepEvent, rhs: SweepEvent): number {
    if (lhs == rhs) {
      return 0
    }

    if (lhs == null) {
      return -1
    }

    if (rhs == null) {
      return 1
    }

    //  First see if it's at the same scanline level (perpendicular coordinate).
    const cmp: number = this.scanDirection.ComparePerpCoord(lhs.Site, rhs.Site)
    if (0 == cmp) {
      //  Event sites are at the same scanline level. Make sure that any reflection events are lowest (come before
      //  any side events, which could remove the side the reflection event was queued for).  We may have two
      //  reflection events at same coordinate, because we enqueue in two situations: when a side is opened,
      //  and when a side that is within that side's scanline-parallel span is closed.
      const lhsIsNotReflection = !(lhs instanceof BasicReflectionEvent) ? 1 : 0
      const rhsIsNotReflection = !(rhs instanceof BasicReflectionEvent) ? 1 : 0
      let cmp = lhsIsNotReflection - rhsIsNotReflection
      //  If the scanline-parallel coordinate is the same these events are at the same point.
      if (0 == cmp) {
        cmp = this.scanDirection.CompareScanCoord(lhs.Site, rhs.Site)
      }
    }

    return cmp
  }
}
