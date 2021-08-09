import {Point} from '../../math/geometry/point'
import {RBNode} from '../../structs/RBTree/rbNode'
import {RBTree} from '../../structs/RBTree/rbTree'
import {Assert} from '../../utils/assert'
import {PointComparer} from './PointComparer'
import {ScanDirection} from './ScanDirection'
import {ScanSegment} from './ScanSegment'

export class ScanSegmentTree {
  ScanDirection: ScanDirection

  private segmentTree: RBTree<ScanSegment>
  // Temporary variables for lookup.
  lookupSegment: ScanSegment = ScanSegment.mk(new Point(0, 0), new Point(0, 1))
  findIntersectorPred: (ss: ScanSegment) => boolean
  findPointPred: (ss: ScanSegment) => boolean

  constructor(scanDir: ScanDirection) {
    this.ScanDirection = scanDir
    this.segmentTree = new RBTree<ScanSegment>((a, b) => this.Compare(a, b))
    this.findIntersectorPred = this.CompareIntersector
    this.findPointPred = this.CompareToPoint
  }
  get Segments(): IterableIterator<ScanSegment> {
    return this.segmentTree.allNodes()
  }

  //  If the seg is already in the tree it returns that instance, else it inserts the new
  //  seg and returns that.
  InsertUnique(seg: ScanSegment): RBNode<ScanSegment> {
    //  RBTree's internal operations on insert/remove etc. mean the node can't cache the
    //  RBNode returned by insert(); instead we must do find() on each call.  But we can
    //  use the returned node to get predecessor/successor.
    this.AssertValidSegmentForInsertion(seg)
    const node = this.segmentTree.find(seg)
    if (null != node) {
      Assert.assert(
        seg.IsOverlapped == node.item.IsOverlapped,
        'Existing node found with different isOverlapped',
      )
      return node
    }

    return this.segmentTree.insert(seg)
  }
  AssertValidSegmentForInsertion(seg: ScanSegment) {
    Assert.assert(
      seg.End.x >= seg.Start.x && seg.End.y >= seg.Start.y,
      'Reversed direction in ScanSegment',
    )
    Assert.assert(
      this.ScanDirection.IsFlatPP(seg.Start, seg.End),
      'non-flat segment cannot be inserted',
    )
  }

  Remove(seg: ScanSegment) {
    Assert.assert(
      seg.IsVertical == this.ScanDirection.IsVertical,
      'seg.IsVertical != this.ScanDirection.IsVertical',
    )
    this.segmentTree.remove(seg)
  }

  Find(start: Point, end: Point): ScanSegment {
    Assert.assert(
      PointComparer.EqualPP(start, end) ||
        !this.ScanDirection.IsPerpendicularPP(start, end),
      'perpendicular segment passed',
    )
    this.lookupSegment.Update(start, end)
    const node: RBNode<ScanSegment> = this.segmentTree.find(this.lookupSegment)
    if (null != node && PointComparer.EqualPP(node.item.End, end)) {
      return node.item
    }

    return null
  }
  // Find the lowest perpendicular scanseg that intersects the segment endpoints.
  FindLowestIntersector(start: Point, end: Point): ScanSegment {
    const node = this.FindLowestIntersectorNode(start, end)
    return null != node ? node.item : null
  }

  FindLowestIntersectorNode(start: Point, end: Point): RBNode<ScanSegment> {
    Assert.assert(
      this.ScanDirection.IsPerpendicularPP(start, end),
      'non-perpendicular segment passed',
    )
    //  Find the last segment that starts at or before 'start'.
    this.lookupSegment.Update(start, start)
    let node: RBNode<ScanSegment> = this.segmentTree.findLast(
      this.findIntersectorPred,
    )
    //  We have a segment that intersects start/end, or one that ends before 'start' and thus we
    //  must iterate to find the lowest bisector.  TODOperf: see how much that iteration costs us
    //  (here and Highest); consider a BSP tree or interval tree (maybe 2-d RBTree for updatability).
    if (PointComparer.EqualPP(start, end)) {
      if (
        null != node &&
        this.ScanDirection.Compare(node.item.End, start) < 0
      ) {
        node = null
      }
    } else {
      this.lookupSegment.Update(start, end)
      while (null != node && !node.item.IntersectsSegment(this.lookupSegment)) {
        //  If the node segment starts after 'end', no intersection was found.
        if (this.ScanDirection.Compare(node.item.Start, end) > 0) {
          return null
        }

        node = this.segmentTree.next(node)
      }
    }

    return node
  }

  //  Find the highest perpendicular scanseg that intersects the segment endpoints.
  FindHighestIntersector(start: Point, end: Point): ScanSegment {
    Assert.assert(
      this.ScanDirection.IsPerpendicularPP(start, end),
      'non-perpendicular segment passed',
    )
    //  Find the last segment that starts at or before 'end'.
    this.lookupSegment.Update(end, end)
    let node: RBNode<ScanSegment> = this.segmentTree.findLast(
      this.findIntersectorPred,
    )
    //  Now we either have a segment that intersects start/end, or one that ends before
    //  'end' and need to iterate to find the highest bisector.
    if (PointComparer.EqualPP(start, end)) {
      if (
        null != node &&
        this.ScanDirection.Compare(node.item.End, start) < 0
      ) {
        node = null
      }
    } else {
      this.lookupSegment.Update(start, end)
      while (null != node && !node.item.IntersectsSegment(this.lookupSegment)) {
        //  If the node segment ends before 'start', no intersection was found.
        if (this.ScanDirection.Compare(node.item.End, start) < 0) {
          return null
        }

        node = this.segmentTree.previous(node)
      }
    }
    return null != node ? node.item : null
  }
  CompareIntersector(seg: ScanSegment): boolean {
    //  We're looking for the last segment that starts before LookupSegment.Start.
    return this.ScanDirection.Compare(seg.Start, this.lookupSegment.Start) <= 0
  }

  FindSegmentContainingPoint(
    location: Point,
    allowUnfound: boolean,
  ): ScanSegment {
    return this.FindSegmentOverlappingPoints(location, location, allowUnfound)
  }

  FindSegmentOverlappingPoints(
    start: Point,
    end: Point,
    allowUnfound: boolean,
  ): ScanSegment {
    this.lookupSegment.Update(start, end)
    const node: RBNode<ScanSegment> = this.segmentTree.findFirst(
      this.findPointPred,
    )
    //  If we had any segments in the tree that end after 'start', node has the first one.
    //  Now we need to that it starts before 'end'.  ScanSegment.CompareToPointPositionFullLength
    //  asserts the point is on the segment which we don't want to require here, so
    //  compare the endpoints directly.
    if (null != node) {
      const seg: ScanSegment = node.item
      if (this.ScanDirection.Compare(seg.Start, end) <= 0) {
        return seg
      }
    }

    //  Not found.
    if (!allowUnfound) {
      Assert.assert(false, 'Could not find expected segment')
    }

    return null
  }

  CompareToPoint(treeSeg: ScanSegment): boolean {
    //  Test if treeSeg overlaps the LookupSegment.Start point.  We're using FindFirst,
    //  so we'll just return false for everything that ends before the point and true for anything
    //  that ends at or after it, then the caller will verify overlap.
    return (
      this.ScanDirection.Compare(treeSeg.End, this.lookupSegment.Start) >= 0
    )
  }

  MergeAndRemoveNextNode(
    currentSegment: ScanSegment,
    nextSegNode: RBNode<ScanSegment>,
  ): RBNode<ScanSegment> {
    //  Merge at the ends only - if we're here, start will be the same or greater.
    if (
      -1 == this.ScanDirection.Compare(currentSegment.End, nextSegNode.item.End)
    ) {
      currentSegment.Update(currentSegment.Start, nextSegNode.item.End)
    }

    //  Removing the node can revise the tree's RBNodes internally so re-get the current segment.
    currentSegment.MergeGroupBoundaryCrossingList(
      nextSegNode.item.GroupBoundaryPointAndCrossingsList,
    )
    this.segmentTree.deleteNodeInternal(nextSegNode)
    return this.segmentTree.find(currentSegment)
  }

  MergeSegments() {
    if (this.segmentTree.count < 2) {
      return
    }

    let currentSegNode: RBNode<ScanSegment> = this.segmentTree.treeMinimum()
    let nextSegNode: RBNode<ScanSegment> = this.segmentTree.next(currentSegNode)
    for (
      ;
      null != nextSegNode;
      nextSegNode = this.segmentTree.next(currentSegNode)
    ) {
      const cmp: number = this.ScanDirection.Compare(
        nextSegNode.item.Start,
        currentSegNode.item.End,
      )
      switch (cmp) {
        case 1:
          //  Next segment starts after the current one.
          currentSegNode = nextSegNode
          break
        case 0:
          if (
            nextSegNode.item.IsOverlapped == currentSegNode.item.IsOverlapped
          ) {
            //  Overlapping is the same, so merge.  Because the ordering in the tree is that
            //  same-Start nodes are ordered by longest-End first, this will retain the tree ordering.
            currentSegNode = this.MergeAndRemoveNextNode(
              currentSegNode.item,
              nextSegNode,
            )
          } else {
            //  Touching start/end with differing IsOverlapped so they need a connecting vertex.
            currentSegNode.item.NeedEndOverlapVertex = true
            nextSegNode.item.NeedStartOverlapVertex = true
            currentSegNode = nextSegNode
          }

          break
        default:
          Assert.assert(
            nextSegNode.item.Start != currentSegNode.item.Start ||
              nextSegNode.item.End < currentSegNode.item.End,
            'Identical segments are not allowed, and longer ones must come first',
          )
          //  Because longer segments are ordered before shorter ones at the same start position,
          //  nextSegNode.Item must be a duplicate segment or is partially or totally overlapped.
          //  In the case of reflection lookahead segments, the side-intersection calculated from
          //  horizontal vs. vertical directions may be slightly different along the parallel
          //  coordinate from an overlapped segment, so let non-overlapped win that disagreement.
          if (
            currentSegNode.item.IsOverlapped != nextSegNode.item.IsOverlapped
          ) {
            Assert.assert(
              Point.closeIntersections(
                currentSegNode.item.End,
                nextSegNode.item.Start,
              ),
              'Segments share a span with different IsOverlapped',
            )
            if (currentSegNode.item.IsOverlapped) {
              //  If the Starts are different, then currentSegNode is the only item at its
              //  start, so we don't need to re-insert.  Otherwise, we need to remove it and
              //  re-find nextSegNode's side.
              if (currentSegNode.item.Start == nextSegNode.item.Start) {
                //  currentSegNode is a tiny overlapped segment between two non-overlapped segments (so
                //  we'll have another merge later, when we hit the other non-overlapped segment).
                //  Notice reversed params.  TestNote: No longer have repro with the change to convex hulls;
                //  this may no longer happen since overlapped edges will now always be inside rectangular
                //  obstacles so there are no angled-side calculations.
                currentSegNode = this.MergeAndRemoveNextNode(
                  nextSegNode.item,
                  currentSegNode,
                )
              } else {
                currentSegNode.item.Update(
                  currentSegNode.item.Start,
                  nextSegNode.item.Start,
                )
                currentSegNode = nextSegNode
              }
            } else if (currentSegNode.item.End == nextSegNode.item.End) {
              //  nextSegNode is a tiny non-overlapped segment between two overlapped segments (so
              //  we'll have another merge later, when we hit the other non-overlapped segment).
              //  TestNote: No longer have repro with the change to convex hulls;
              //  this may no longer happen since overlapped edges will now always be inside rectangular
              //  obstacles so there are no angled-side calculations.
              currentSegNode = this.MergeAndRemoveNextNode(
                currentSegNode.item,
                nextSegNode,
              )
            } else {
              //  Remove nextSegNode, increment its start to be after currentSegment, re-insert nextSegNode, and
              //  re-find currentSegNode (there may be more segments between nextSegment.Start and currentSegment.End).
              const nextSegment: ScanSegment = nextSegNode.item
              const currentSegment: ScanSegment = currentSegNode.item
              this.segmentTree.deleteNodeInternal(nextSegNode)
              nextSegment.Update(currentSegment.End, nextSegment.End)
              this.segmentTree.insert(nextSegment)
              nextSegment.TrimGroupBoundaryCrossingList()

              currentSegNode = this.segmentTree.find(currentSegment)
            }

            break
          }

          //  Overlaps match so do a normal merge operation.
          currentSegNode = this.MergeAndRemoveNextNode(
            currentSegNode.item,
            nextSegNode,
          )
          break
      }

      //  endswitch
    }
  }

  ///  <summary>
  ///  For ordering the line segments inserted by the ScanLine. Assuming vertical sweep (sweeping up from
  ///  bottom, scanning horizontally) then order ScanSegments first by lowest Y coord, then by lowest X coord.
  ///  </summary>
  ///  <param name="first"></param>
  ///  <param name="second"></param>
  ///  <returns></returns>
  public Compare(first: ScanSegment, second: ScanSegment): number {
    if (first == second) {
      return 0
    }

    if (first == null) {
      return -1
    }

    if (second == null) {
      return 1
    }

    //  This orders on both axes.
    let cmp: number = this.ScanDirection.Compare(first.Start, second.Start)
    if (0 == cmp) {
      //  Longer segments come first, to make overlap removal easier.
      cmp = this.ScanDirection.Compare(first.End, second.End) * -1
    }

    return cmp
  }
}
