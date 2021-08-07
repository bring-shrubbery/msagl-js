class SegmentIntersector extends IComparer<SegmentIntersector.SegEvent>, IComparer<ScanSegment> {
    
    //  The event types.  We sweep vertically, with a horizontal scanline, so the vertical
    //  segments that are active and have X coords within the current vertical segment's
    //  span all create intersections with it.  All events are ordered on Y coordinate then X.
    private /* internal */ constructor () {
        verticalSegmentsScanLine = new RbTree<ScanSegment>(this);
        findFirstPred = new Func<ScanSegment, boolean>(IsVSegInHSegRange);
    }
    
    IsVSegInHSegRange(v: ScanSegment): boolean {
        return (PointComparer.Compare(v.Start.X, findFirstHSeg.Start.X) >= 0);
    }
    
    //  This creates the VisibilityVertex objects along the segments.
    private /* internal */ Generate(hSegments: IEnumerable<ScanSegment>, vSegments: IEnumerable<ScanSegment>): VisibilityGraph {
        for (let seg: ScanSegment in vSegments) {
            eventList.Add(new SegEvent(SegEventType.VOpen, seg));
            eventList.Add(new SegEvent(SegEventType.VClose, seg));
        }
        
        for (let seg: ScanSegment in hSegments) {
            eventList.Add(new SegEvent(SegEventType.HOpen, seg));
        }
        
        if ((0 == eventList.Count)) {
            return null;
            //  empty
        }
        
        eventList.Sort(this);
        //  Note: We don't need any sentinels in the scanline here, because the lowest VOpen
        //  events are loaded before the first HOpen is.
        //  Process all events.
        visGraph = VisibilityGraphGenerator.NewVisibilityGraph();
        for (let evt: SegEvent in eventList) {
            switch (evt.EventType) {
                case SegEventType.VOpen:
                    this.OnSegmentOpen(evt.Segment);
                    ScanInsert(evt.Segment);
                    break;
                case SegEventType.VClose:
                    OnSegmentClose(evt.Segment);
                    ScanRemove(evt.Segment);
                    break;
                case SegEventType.HOpen:
                    this.OnSegmentOpen(evt.Segment);
                    ScanIntersect(evt.Segment);
                    break;
                default:
                    Debug.Assert(false, "Unknown SegEventType");
                    break;
            }
            
        }
        
        //  endforeach
        return visGraph;
    }
    
    OnSegmentOpen(seg: ScanSegment) {
        seg.OnSegmentIntersectorBegin(visGraph);
    }
    OnSegmentClose(seg: ScanSegment) {
            seg.OnSegmentIntersectorEnd(visGraph);
            if ((seg.LowestVisibilityVertex == null)) {
                segmentsWithoutVisibility.Add(seg);
            }
            
        }
        //  The event types.  We sweep vertically, with a horizontal scanline, so the vertical
        //  segments that are active and have X coords within the current vertical segment's
        //  span all create intersections with it.  All events are ordered on Y coordinate then X.
        //  Scan segments with no visibility will usually be internal to an overlap clump, 
        //  but may be in an external "corner" of intersecting sides for a small enough span
        //  that no other segment crosses them.  In that case we don't need them and they 
        //  would require extra handling later.
        private /* internal */ RemoveSegmentsWithNoVisibility(horizontalScanSegments: ScanSegmentTree, verticalScanSegments: ScanSegmentTree) {
            for (let seg: ScanSegment in segmentsWithoutVisibility){
            (seg.IsVertical ? verticalScanSegments : horizontalScanSegments).Remove(seg);
            }
        }
ScanInsert(seg: ScanSegment) {
             Debug.Assert(null == this.verticalSegmentsScanLine.Find(seg), "seg already exists in the rbtree");
            //  RBTree's internal operations on insert/remove etc. mean the node can't cache the
            //  RBNode returned by insert(); instead we must do find() on each call.  But we can
            //  use the returned node to get predecessor/successor.
            verticalSegmentsScanLine.Insert(seg);
        }
        
        ScanRemove(seg: ScanSegment) {
            verticalSegmentsScanLine.Remove(seg);
        }
        
        ScanIntersect(hSeg: ScanSegment) {
            //  Find the VSeg in the scanline with the lowest X-intersection with HSeg, then iterate
            //  all VSegs in the scan line after that until we leave the HSeg range.
            //  We only use FindFirstHSeg in this routine, to find the first satisfying node,
            //  so we don't care that we leave leftovers in it.
            findFirstHSeg = hSeg;
            let segNode: RBNode<ScanSegment> = verticalSegmentsScanLine.FindFirst(findFirstPred);
            for (
            ; (null != segNode); segNode = verticalSegmentsScanLine.Next(segNode)) {
                let vSeg: ScanSegment = segNode.Item;
                if ((1 == PointComparer.Compare(vSeg.Start.X, hSeg.End.X))) {
                    break;
                    //  Out of HSeg range
                }
                
                let newVertex: VisibilityVertex = visGraph.AddVertex(new Point(vSeg.Start.X, hSeg.Start.Y));
                //  HSeg has just opened so if we are overlapped and newVertex already existed,
                //  it was because we just closed a previous HSeg or VSeg and are now opening one
                //  whose Start is the same as previous.  So we may be appending a vertex that
                //  is already the *Seg.HighestVisibilityVertex, which will be a no-op.  Otherwise
                //  this will add a (possibly Overlapped)VisibilityEdge in the *Seg direction.
                hSeg.AppendVisibilityVertex(visGraph, newVertex);
                vSeg.AppendVisibilityVertex(visGraph, newVertex);
            }
            
            //  endforeach scanline VSeg in range
            OnSegmentClose(hSeg);
        }
        
        ///  <summary>
        ///  For ordering events first by Y, then X, then by whether it's an H or V seg.
        ///  </summary>
        ///  <param name="first"></param>
        ///  <param name="second"></param>
        ///  <returns></returns>
        public Compare(first: SegEvent, second: SegEvent): number {
            if ((first == second)) {
                return 0;
            }
            
            if ((first == null)) {
                return -1;
            }
            
            if ((second == null)) {
                return 1;
            }
            
            //  Unlike the ScanSegment-generating scanline in VisibilityGraphGenerator, this scanline has no slope
            //  calculations so no additional rounding error is introduced.
            let cmp: number = PointComparer.Compare(first.Site.Y, second.Site.Y);
            if ((0 != cmp)) {
                return cmp;
            }
            
            //  Both are at same Y so we must ensure that for equivalent Y, VClose comes after 
            //  HOpen which comes after VOpen, thus make sure VOpen comes before VClose.
            if ((first.IsVertical && second.IsVertical)) {
                //  Separate segments may join at Start and End due to overlap.
                Debug.Assert((!StaticGraphUtility.IntervalsOverlap(first.Segment, second.Segment) 
                                || ((0 == PointComparer.Compare(first.Segment.Start, second.Segment.End)) || (0 == PointComparer.Compare(first.Segment.End, second.Segment.Start)))), "V subsumption failure detected in SegEvent comparison");
                if ((0 == cmp)) {
                    //  false is < true.
                    cmp = ((SegEventType.VClose == first.EventType)).CompareTo((SegEventType.VClose == second.EventType));
                }
                
                return cmp;
            }
            
            //  If both are H segs, then sub-order by X.
            if ((!first.IsVertical 
                        && !second.IsVertical)) {
                //  Separate segments may join at Start and End due to overlap, so compare by Start.X;
                //  the ending segment (lowest Start.X) comes before the Open (higher Start.X).
                Debug.Assert((!StaticGraphUtility.IntervalsOverlap(first.Segment, second.Segment) 
                                || ((0 == PointComparer.Compare(first.Segment.Start, second.Segment.End)) || (0 == PointComparer.Compare(first.Segment.End, second.Segment.Start)))), "H subsumption failure detected in SegEvent comparison");
                cmp = PointComparer.Compare(first.Site.X, second.Site.X);
                return cmp;
            }
            
            //  One is Vertical and one is Horizontal; we are only interested in the vertical at this point.
            let vEvent: SegEvent = first.IsVertical;
            // TODO: Warning!!!, inline IF is not supported ?
            // TODO: Warning!!!! NULL EXPRESSION DETECTED...
            ;
            //  Make sure that we have opened all V segs before and closed them after opening
            //  an H seg at the same Y coord. Otherwise we'll miss "T" or "corner" intersections.
            //  (RectilinearTests.Connected_Vertical_Segments_Are_Intersected tests that we get the expected count here.)
            //  Start assuming Vevent is 'first' and it's VOpen, which should come before HOpen.
            cmp = -1;
            //  Start with first == VOpen
            if ((SegEventType.VClose == vEvent.EventType)) {
                cmp = 1;
                //  change to first == VClose
            }
            
            if ((vEvent != first)) {
                cmp = (cmp * -1);
                //  undo the swap.
            }
            
            return cmp;
        }
        
        ///  <summary>
        ///  For ordering V segments in the scanline by X.
        ///  </summary>
        ///  <param name="first"></param>
        ///  <param name="second"></param>
        ///  <returns></returns>
        public Compare(first: ScanSegment, second: ScanSegment): number {
            if ((first == second)) {
                return 0;
            }
            
            if ((first == null)) {
                return -1;
            }
            
            if ((second == null)) {
                return 1;
            }
            
            //  Note: Unlike the ScanSegment-generating scanline, this scanline has no slope
            //  calculations so no additional rounding error is introduced.
            let cmp: number = PointComparer.Compare(first.Start.X, second.Start.X);
            //  Separate segments may join at Start and End due to overlap, so compare the Y positions;
            //  the Close (lowest Y) comes before the Open.
            if ((0 == cmp)) {
                cmp = PointComparer.Compare(first.Start.Y, second.Start.Y);
            }
            
            return cmp;
        }
        
        class SegEvent {
            
            private /* internal */ constructor (eventType: SegEventType, seg: ScanSegment) {
                EventType = eventType;
                Segment = seg;
            }
            
            private /* internal */ get EventType(): SegEventType {
            }
            private /* internal */ set EventType(value: SegEventType)  {
            }
            
            private /* internal */ get Segment(): ScanSegment {
            }
            private /* internal */ set Segment(value: ScanSegment)  {
            }
            
            private /* internal */ get IsVertical(): boolean {
                return (SegEventType.HOpen != this.EventType);
            }
            
            private /* internal */ get Site(): Point {
                return this.Segment.End;
                // TODO: Warning!!!, inline IF is not supported ?
                (SegEventType.VClose == this.EventType);
                this.Segment.Start;
            }
            
            ///  <summary>
            ///  </summary>
            ///  <returns></returns>
            @System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1305:SpecifyIFormatProvider", MessageId="System.String.Format(System.String,System.Object[])")
            public /* override */ ToString(): string {
                return string.Format("{0} {1} {2} {3}", this.EventType, this.IsVertical, this.Site, this.Segment);
            }
        }
        
        eventList: List<SegEvent> = new List<SegEvent>();
        
        //  Tracks the currently open V segments.
        findFirstPred: Func<ScanSegment, boolean>;
        
        segmentsWithoutVisibility: List<ScanSegment> = new List<ScanSegment>();
        
        verticalSegmentsScanLine: RbTree<ScanSegment>;
        
        //  For searching the tree to find the first VSeg for an HSeg.
        findFirstHSeg: ScanSegment;
        
        visGraph: VisibilityGraph;
        
        enum SegEventType {
            
            VOpen,
            
            VClose,
            
            HOpen,
        }
    }
}

}