import {ICurve} from './icurve';
import {PN, PNInternal} from './parallelogramNode';
import {Point} from './point';
import {LineSegment} from './lineSegment';
import {Assert} from './../assert';
import {Parallelogram, allVerticesOfParall} from './parallelogram';
export class Curve {
	static lengthWithInterpolationAndThreshold(seg: ICurve, eps: number): number {
		throw 'not implemented';
		return 0;
	}
	static lengthWithInterpolation(seg: ICurve): number {
		throw 'not implemented';
		return 0;
	}

	parStart() {
		return 0;
	}
	parEnd() {
		return this.parEnd_;
	}

	parEnd_: number;

	pBNode: PN;
	//the parameter domain is [0,parEnd_] where parEnd_ is the sum (seg.parEnd() - seg.parStart()) over all segment in this.segs
	segs: ICurve[];

	// a, b are parameters of the curve
	static isCloseToLineSeg(a: number, ap: Point, b: number, bp: Point, s: ICurve, e: number): boolean {
		Assert.assert(Point.closeDistEps(s.value(a), ap));
		Assert.assert(Point.closeDistEps(s.value(b), bp));

		for (const x of [1 / 3, 0.5, 2 / 3]) {
			const p = a * x + b * (1 - x); // the parameter on the curve s
			if (!Point.closeSquare(s.value(p), Point.mkPoint(x, ap, 1 - x, bp), e)) return false;
		}

		return true;
	}

	// interpolates the curve between parameters 'a' and 'b' by a sequence of line segments
	static interpolate(a: number, ap: Point, b: number, bp: Point, s: ICurve, eps: number): LineSegment[] {
		Assert.assert(Point.closeDistEps(s.value(a), ap));
		Assert.assert(Point.closeDistEps(s.value(b), bp));
		const r = new Array<LineSegment>(0);
		if (Curve.isCloseToLineSeg(a, ap, b, bp, s, eps)) r.push(LineSegment.lineSegmentStartEnd(ap, bp));
		else {
			const m = 0.5 * (a + b);
			const mp = s.value(m);
			r.concat(Curve.interpolate(a, ap, m, mp, s, eps));
			r.concat(Curve.interpolate(m, mp, b, bp, s, eps));
		}
		return r;
	}

	// this function always produces at least two segments
	static interpolateWithAtLeastTwoSegs(eps: number, a: number, ap: Point, b: number, bp: Point, s: ICurve) {
		const m = (a + b) / 2;
		const mp = s.value(m);
		const ret = Curve.interpolate(a, ap, m, mp, s, eps * eps);
		ret.concat(Curve.interpolate(m, mp, b, bp, s, eps * eps));
		return ret;
	}

	static interpolateICurve(s: ICurve, eps: number) {
		return Curve.interpolate(s.parStart(), s.start(), s.parEnd(), s.end(), s, eps);
	}

	// this[Reverse[t]]=this[ParEnd+ParStart-t]
	reverse() {
		const ret = new Curve(this.segs.length);
		for (let i = this.segs.length - 1; i >= 0; i--) ret.addSegment(this.segs[i].reverse());
		return ret;
	}

	// Constructs the curve for a given number of segments
	constructor(capacity: number) {
		this.segs = new Array(capacity);
		this.parEnd_ = 0;
	}

	static paramLen(ic: ICurve) {
		return ic.parEnd() - ic.parStart();
	}

	mkCurveWithSegs(segs: ICurve[]) {
		this.segs = segs;
		for (const s of segs) this.parEnd_ += Curve.paramLen(s);
	}

	start() {
		return this.segs[0].start();
	}

	end() {
		return this.segs[this.segs.length - 1].end();
	}

	/*      // Returns the trim curve
          public ICurve Trim(number start, number end) {
          AdjustStartEndEndParametersToDomain(ref start, ref end);
     
          int sseg;
          number spar;
     
          GetSegmentAndParameter(start, out spar, out sseg);
     
          int eseg;
          number epar;
     
          GetSegmentAndParameter(end, out epar, out eseg);
     
          if (sseg == eseg)
          return Segments[sseg].Trim(spar, epar);
     
          var c = new Curve(eseg-sseg+1);
     
          if (spar < Segments[sseg].ParEnd)
          c = c.AddSegment(Segments[sseg].Trim(spar, Segments[sseg].ParEnd));
     
          for (int i = sseg + 1; i < eseg; i++)
          c = c.AddSegment(Segments[i]);
     
          if (Segments[eseg].ParStart < epar)
          c = c.AddSegment(Segments[eseg].Trim(Segments[eseg].ParStart, epar));
     
          return c;
          }
     
          void AdjustStartEndEndParametersToDomain(ref number start, ref number end) {
          if (start > end) {
          number t = start;
          start = end;
          end = t;
          }
     
          if (start < ParStart)
          start = ParStart;
     
          if (end > ParEnd)
          end = ParEnd;
          
          }
     
          // Returns the trimmed curve, wrapping around the end if start is greater than end.
          public ICurve TrimWithWrap(number start, number end) {
          Debug.Assert(start >= ParStart && start <= ParEnd);
          Debug.Assert(end >= ParStart && end <= ParEnd);
          if (start < end)
          return Trim(start, end) as Curve;
     
          Debug.Assert(ApproximateComparer.Close(Start, End), "Curve must be closed to wrap");
          var c = new Curve();
          c.AddSegment(Trim(start, ParEnd) as Curve);
          c.AddSegment(Trim(ParStart, end) as Curve);
          return c;
          }
     
        */
	// Adds a segment to the curve
	addSegment(curve: ICurve) {
		if (curve == null) return this; //nothing happens
		Assert.assert(this.segs.length == 0 || !Point.close(this.end(), curve.start(), 0.001));
		if (!(curve instanceof Curve)) {
			this.segs.push(curve);
			this.parEnd_ += Curve.paramLen(curve);
		} else {
			for (const cc of (curve as Curve).segs) {
				this.segs.push(cc);
				this.parEnd_ += Curve.paramLen(cc);
			}
		}
		return this;
	}

	addSegs(a: ICurve, b: ICurve) {
		return this.addSegment(a).addSegment(b);
	}

	addFourSegs(a: ICurve, b: ICurve, c: ICurve, d: ICurve) {
		return this.addSegs(a, b).addSegs(c, d);
	}

	// A tree of ParallelogramNodes covering the curve.
	// This tree is used in curve intersections routines.
	// <value></value>
	pNodeOverICurve() {
		if (this.pBNode != null) return this.pBNode;

		this.pBNode = {
			seg: this,
			node: {
				children: [],
			},
		};
		const internalNode = this.pBNode.node as PNInternal;
		const parallelograms: Parallelogram[] = [];
		for (const curveSeg of this.segs) {
			const pBoxNode = curveSeg.pNodeOverICurve();
			parallelograms.push(pBoxNode.parallelogram);
			internalNode.children.push(pBoxNode);
		}
		this.pBNode.parallelogram = Parallelogram.getParallelogramOfAGroup(parallelograms);

		return this.pBNode;
	}

	/*

      // finds an intersection between to curves, 
      public static IntersectionInfo CurveCurveIntersectionOne(ICurve curve0, ICurve curve1, bool liftIntersection) {
      ValidateArg.IsNotNull(curve0, "curve0");
      ValidateArg.IsNotNull(curve1, "curve1");
      Debug.Assert(curve0 != curve1, "curve0 == curve1");
      #if TEST_MSAGL
      //            number c0S = curve0.ParStart, c1S = curve1.ParStart;
      //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
      //                number mc0 = 0.5 * (curve0.ParStart + curve0.ParEnd);
      //                number mc1 = 0.5 * (curve1.ParStart + curve1.ParEnd);
      //                number c0E = curve0.ParEnd;
      //                if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1)) {
      //                    number c1E = curve1.ParEnd;
      //                    CurvesAreCloseAtParams(curve0, curve1, c0E, c1E);
      //                    throw new InvalidOperationException();
      //                }
      //            }
      #endif
      //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

      IntersectionInfo ret = CurveCurveXWithParallelogramNodesOne(curve0.ParallelogramNodeOverICurve,
      curve1.ParallelogramNodeOverICurve);

      if (liftIntersection && ret != null)
      ret = LiftIntersectionToCurves(curve0, curve1, ret);


      return ret;
      }

      // calculates all intersections between curve0 and curve1
      public static IList<IntersectionInfo> GetAllIntersections(ICurve curve0, ICurve curve1, bool liftIntersections) {
      ValidateArg.IsNotNull(curve0, "curve0");
      ValidateArg.IsNotNull(curve1, "curve1");
      Debug.Assert(curve0 != curve1);
      #if TEST_MSAGL
      //            var c0S = curve0.ParStart;
      //            var c1S = curve1.ParStart;
      //            var c0E = curve0.ParEnd;
      //            var c1E = curve1.ParEnd;
      //            if (CurvesAreCloseAtParams(curve0, curve1, c0S, c1S)) {
      //                if (CurvesAreCloseAtParams(curve0, curve1, c0E, c1E)) {
      //                    var mc0 = 0.5*(curve0.ParStart + curve0.ParEnd);
      //                    var mc1 = 0.5*(curve1.ParStart + curve1.ParEnd);
      //                    if (CurvesAreCloseAtParams(curve0, curve1, mc0, mc1))
      //                        throw new InvalidOperationException();
      //                }
      //            }
      #endif

      var lineSeg = curve0 as LineSegment;
      if (lineSeg != null)
      return GetAllIntersectionsOfLineAndICurve(lineSeg, curve1, liftIntersections);

      return GetAllIntersectionsInternal(curve0, curve1, liftIntersections);
      }


      internal static IList<IntersectionInfo> GetAllIntersectionsInternal(ICurve curve0, ICurve curve1,
      bool liftIntersections) {
      //recurse down to find all PBLeaf pairs which intesect and try to cross their segments

      var intersections = new List<IntersectionInfo>();
      CurveCurveXWithParallelogramNodes(curve0.ParallelogramNodeOverICurve, curve1.ParallelogramNodeOverICurve,
      ref intersections);

      if (liftIntersections)
      for (int i = 0; i < intersections.length; i++)
      intersections[i] = LiftIntersectionToCurves(curve0, curve1, intersections[i]);


      //fix the parameters - adjust them to the curve
      return intersections;
      }

      static IList<IntersectionInfo> GetAllIntersectionsOfLineAndICurve(LineSegment lineSeg, ICurve iCurve,
      bool liftIntersections) {
      var poly = iCurve as Polyline;
      if (poly != null)
      return GetAllIntersectionsOfLineAndPolyline(lineSeg, poly);

      var curve = iCurve as Curve;
      if (curve != null)
      return GetAllIntersectionsOfLineAndCurve(lineSeg, curve, liftIntersections);

      var roundedRect = iCurve as RoundedRect;
      if (roundedRect != null)
      return GetAllIntersectionsOfLineAndRoundedRect(lineSeg, roundedRect, liftIntersections);

      var ellipse = iCurve as Ellipse;
      if (ellipse != null && ellipse.IsArc())
      return GetAllIntersectionsOfLineAndArc(lineSeg, ellipse);

      return GetAllIntersectionsInternal(lineSeg, iCurve, liftIntersections);
      }

      static IList<IntersectionInfo> GetAllIntersectionsOfLineAndRoundedRect(LineSegment lineSeg, RoundedRect roundedRect, bool liftIntersections) {
      var ret = GetAllIntersectionsOfLineAndCurve(lineSeg, roundedRect.Curve, liftIntersections);
      if(liftIntersections)
      foreach (var intersectionInfo in ret) {
      intersectionInfo.Segment1 = roundedRect;
      }
      return ret;
      }

      static IList<IntersectionInfo> GetAllIntersectionsOfLineAndCurve(LineSegment lineSeg, Curve curve, bool liftIntersections) {
      var ret = new List<IntersectionInfo>();
      var lineParallelogram = lineSeg.ParallelogramNodeOverICurve;
      var curveParallelogramRoot = curve.ParallelogramNodeOverICurve;
      if (Parallelogram.Intersect(lineParallelogram.Parallelogram, curveParallelogramRoot.Parallelogram) == false)
      return ret;
      var parOffset = 0.0;
      foreach (var seg in curve.Segments) {
      var iiList = GetAllIntersections(lineSeg, seg, false);
      if(liftIntersections) {
      foreach (var intersectionInfo in iiList) {
      intersectionInfo.Par1 += parOffset-seg.ParStart;
      intersectionInfo.Segment1 = curve;
      }
      parOffset += seg.ParEnd - seg.ParStart;
      }
      foreach (var intersectionInfo in iiList) {
      if(! AlreadyInside(ret, intersectionInfo))
      ret.Add(intersectionInfo);
      }
      }

      return ret;
      }

      static bool AlreadyInside(List<IntersectionInfo> ret, IntersectionInfo intersectionInfo) {
      for(int i=0;i<ret.length;i++) {
      var ii = ret[i];
      if (ApproximateComparer.CloseIntersections(ii.IntersectionPoint, intersectionInfo.IntersectionPoint))
      return true;
      }
      return false;
      }

      static IList<IntersectionInfo> GetAllIntersectionsOfLineAndArc(LineSegment lineSeg, Ellipse ellipse) {
      Point lineDir = lineSeg.end() - lineSeg.start();
      var ret = new List<IntersectionInfo>();
      number segLength = lineDir.Length;
      if (segLength < ApproximateComparer.DistanceEpsilon) {
      if (ApproximateComparer.Close((lineSeg.start() - ellipse.Center).Length, ellipse.AxisA.Length)) {
      number angle = Point.Angle(ellipse.AxisA, lineSeg.start() - ellipse.Center);
      if (ellipse.ParStart - ApproximateComparer.Tolerance <= angle) {
      angle = Math.Max(angle, ellipse.ParStart);
      if (angle <= ellipse.ParEnd + ApproximateComparer.Tolerance) {
      angle = Math.Min(ellipse.ParEnd, angle);
      ret.Add(new IntersectionInfo(0, angle, lineSeg.start(), lineSeg, ellipse));
      }
      }
      }
      return ret;
      }

      Point perp = lineDir.Rotate90Ccw()/segLength;
      number segProjection = (lineSeg.start() - ellipse.Center)*perp;
      Point closestPointOnLine = ellipse.Center + perp*segProjection;

      number rad = ellipse.AxisA.Length;
      number absSegProj = Math.Abs(segProjection);
      if (rad < absSegProj - ApproximateComparer.DistanceEpsilon)
      return ret; //we don't have an intersection
      lineDir = perp.Rotate90Cw();
      if (ApproximateComparer.Close(rad, absSegProj))
      TryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine, segLength, lineDir);
      else {
      Debug.Assert(rad > absSegProj);
      number otherLeg = Math.Sqrt(rad*rad - segProjection*segProjection);
      TryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine + otherLeg*lineDir,
      segLength, lineDir);
      TryToAddPointToLineCircleCrossing(lineSeg, ellipse, ret, closestPointOnLine - otherLeg*lineDir,
      segLength, lineDir);
      }

      return ret;
      }

      static void TryToAddPointToLineCircleCrossing(LineSegment lineSeg,
      Ellipse ellipse, List<IntersectionInfo> ret, Point point, number segLength, Point lineDir) {
      Point ds = point - lineSeg.start();
      Point de = point - lineSeg.end();
      number t = ds*lineDir;
      if (t < -ApproximateComparer.DistanceEpsilon)
      return;
      t = Math.Max(t, 0);
      if (t > segLength + ApproximateComparer.DistanceEpsilon)
      return;
      t = Math.Min(t, segLength);
      t /= segLength;

      number angle = Point.Angle(ellipse.AxisA, point - ellipse.Center);
      if (ellipse.ParStart - ApproximateComparer.Tolerance <= angle) {
      angle = Math.Max(angle, ellipse.ParStart);
      if (angle <= ellipse.ParEnd + ApproximateComparer.Tolerance) {
      angle = Math.Min(ellipse.ParEnd, angle);
      ret.Add(new IntersectionInfo(t, angle, point, lineSeg, ellipse));
      }
      }
      }

      static IList<IntersectionInfo> GetAllIntersectionsOfLineAndPolyline(LineSegment lineSeg, Polyline poly) {
      var ret = new List<IntersectionInfo>();
      number offset = 0.0;
      number par0, par1;
      Point x;
      PolylinePoint polyPoint = poly.start()Point;
      for (; polyPoint != null && polyPoint.Next != null; polyPoint = polyPoint.Next) {
      if (CrossTwoLineSegs(lineSeg.start(), lineSeg.end(), polyPoint.Point, polyPoint.Next.Point, 0, 1, 0, 1,
      out par0, out par1, out x)) {
      AdjustSolution(lineSeg.start(), lineSeg.end(), polyPoint.Point, polyPoint.Next.Point, ref par0, ref par1,
      ref x);
      if (!OldIntersection(ret, ref x))
      ret.Add(new IntersectionInfo(par0, offset + par1, x, lineSeg, poly));
      }
      offset++;
      }
      if (poly.Closed)
      if (CrossTwoLineSegs(lineSeg.start(), lineSeg.end(), polyPoint.Point, poly.start(), 0, 1, 0, 1, out par0,
      out par1, out x)) {
      AdjustSolution(lineSeg.start(), lineSeg.end(), polyPoint.Point, poly.start(), ref par0, ref par1, ref x);
      if (!OldIntersection(ret, ref x))
      ret.Add(new IntersectionInfo(par0, offset + par1, x, lineSeg, poly));
      }

      return ret;
      }

      static void AdjustSolution(Point aStart, Point aEnd, Point bStart, Point bEnd, ref number par0, ref number par1,
      ref Point x) {
      //adjust the intersection if it is close to the ends of the segs
      if (ApproximateComparer.CloseIntersections(x, aStart)) {
      x = aStart;
      par0 = 0;
      }
      else if (ApproximateComparer.CloseIntersections(x, aEnd)) {
      x = aEnd;
      par0 = 1;
      }

      if (ApproximateComparer.CloseIntersections(x, bStart)) {
      x = bStart;
      par1 = Math.Floor(par1);
      }
      else if (ApproximateComparer.CloseIntersections(x, bEnd)) {
      x = bEnd;
      par1 = Math.Ceiling(par1);
      }
      }

      static IntersectionInfo CurveCurveXWithParallelogramNodesOne(ParallelogramNodeOverICurve n0,
      ParallelogramNodeOverICurve n1) {
      if (!Parallelogram.Intersect(n0.Parallelogram, n1.Parallelogram))
      // Boxes n0.Box and n1.Box do not intersect
      return null;
      var n0Pb = n0 as ParallelogramInternalTreeNode;
      var n1Pb = n1 as ParallelogramInternalTreeNode;
      if (n0Pb != null && n1Pb != null)
      foreach (ParallelogramNodeOverICurve n00 in n0Pb.Children)
      foreach (ParallelogramNodeOverICurve n11 in n1Pb.Children) {
      IntersectionInfo x = CurveCurveXWithParallelogramNodesOne(n00, n11);
      if (x != null) return x;
      }
      else if (n1Pb != null)
      foreach (ParallelogramNodeOverICurve n in n1Pb.Children) {
      IntersectionInfo x = CurveCurveXWithParallelogramNodesOne(n0, n);
      if (x != null) return x;
      }
      else if (n0Pb != null)
      foreach (ParallelogramNodeOverICurve n in n0Pb.Children) {
      IntersectionInfo x = CurveCurveXWithParallelogramNodesOne(n, n1);
      if (x != null) return x;
      }
      else
      return CrossOverIntervalsOne(n0, n1);

      return null;
      }


      static void CurveCurveXWithParallelogramNodes(ParallelogramNodeOverICurve n0, ParallelogramNodeOverICurve n1,
      ref List<IntersectionInfo> intersections) {
      if (!Parallelogram.Intersect(n0.Parallelogram, n1.Parallelogram))
      // Boxes n0.Box and n1.Box do not intersect
      return;
      var n0Pb = n0 as ParallelogramInternalTreeNode;
      var n1Pb = n1 as ParallelogramInternalTreeNode;
      if (n0Pb != null && n1Pb != null)
      foreach (ParallelogramNodeOverICurve n00 in n0Pb.Children)
      foreach (ParallelogramNodeOverICurve n11 in n1Pb.Children)
      CurveCurveXWithParallelogramNodes(n00, n11, ref intersections);
      else if (n1Pb != null)
      foreach (ParallelogramNodeOverICurve n in n1Pb.Children)
      CurveCurveXWithParallelogramNodes(n0, n, ref intersections);
      else if (n0Pb != null)
      foreach (ParallelogramNodeOverICurve n in n0Pb.Children)
      CurveCurveXWithParallelogramNodes(n, n1, ref intersections);
      else intersections = CrossOverIntervals(n0, n1, intersections);
      }

      static IntersectionInfo CrossOverIntervalsOne(ParallelogramNodeOverICurve n0, ParallelogramNodeOverICurve n1) {
      //both are leafs 
      var l0 = n0 as ParallelogramLeaf;
      var l1 = n1 as ParallelogramLeaf;
      number d0 = (l0.High - l0.Low)/2;
      number d1 = (l1.High - l1.Low)/2;

      for (int i = 1; i < 2; i++) {
      number p0 = i*d0 + l0.Low;
      for (int j = 1; j < 2; j++) {
      number p1 = j*d1 + l1.Low;
      number aSol, bSol;
      Point x;
      bool r;
      if (l0.Chord == null && l1.Chord == null)
      r = CrossWithinIntervalsWithGuess(n0.Seg, n1.Seg, l0.Low, l0.High, l1.Low, l1.High,
      p0, p1, out aSol, out bSol, out x);
      else if (l0.Chord != null && l1.Chord == null) {
      r = CrossWithinIntervalsWithGuess(l0.Chord, n1.Seg, 0, 1, l1.Low, l1.High,
      0.5*i,
      p1, out aSol, out bSol, out x);
      if (r)
      aSol = l0.Low + aSol*(l0.High - l0.Low);
      }
      else if (l0.Chord == null) {
      r = CrossWithinIntervalsWithGuess(n0.Seg, l1.Chord,
      l0.Low, l0.High, 0, 1, p0,
      0.5*j, out aSol, out bSol, out x);
      if (r)
      bSol = l1.Low + bSol*(l1.High - l1.Low);
      }
      else //if (l0.Chord != null && l1.Chord != null)
      {
      r = CrossWithinIntervalsWithGuess(l0.Chord, l1.Chord,
      0, 1, 0, 1, 0.5*i,
      0.5*j, out aSol, out bSol, out x);
      if (r) {
      bSol = l1.Low + bSol*(l1.High - l1.Low);
      aSol = l0.Low + aSol*(l0.High - l0.Low);
      }
      }

      if (r)
      return CreateIntersectionOne(l0, l1, aSol, bSol, x);
      }
      }

      return GoDeeperOne(l0, l1);
      }

      static List<IntersectionInfo> CrossOverIntervals(ParallelogramNodeOverICurve n0, ParallelogramNodeOverICurve n1,
      List<IntersectionInfo> intersections) {
      //both are leafs 
      var l0 = n0 as ParallelogramLeaf;
      var l1 = n1 as ParallelogramLeaf;
      number d0 = (l0.High - l0.Low)/2;
      number d1 = (l1.High - l1.Low)/2;
      bool found = false;

      for (int i = 1; i < 2; i++) {
      number p0 = i*d0 + l0.Low;
      for (int j = 1; j < 2; j++) {
      number p1 = j*d1 + l1.Low;


      number aSol, bSol;
      Point x;


      bool r;
      if (l0.Chord == null && l1.Chord == null)
      r = CrossWithinIntervalsWithGuess(n0.Seg, n1.Seg, l0.Low, l0.High, l1.Low, l1.High,
      p0, p1, out aSol, out bSol, out x);
      else if (l0.Chord != null && l1.Chord == null) {
      r = CrossWithinIntervalsWithGuess(l0.Chord, n1.Seg, 0, 1, l1.Low, l1.High,
      0.5*i,
      p1, out aSol, out bSol, out x);
      if (r)
      aSol = l0.Low + aSol*(l0.High - l0.Low);
      }
      else if (l0.Chord == null) {
      //&& l1.Chord != null) 
      r = CrossWithinIntervalsWithGuess(n0.Seg, l1.Chord,
      l0.Low, l0.High, 0, 1, p0,
      0.5*j, out aSol, out bSol, out x);
      if (r)
      bSol = l1.Low + bSol*(l1.High - l1.Low);
      }
      else //if (l0.Chord != null && l1.Chord != null)
      {
      r = CrossWithinIntervalsWithGuess(l0.Chord, l1.Chord,
      0, 1, 0, 1, 0.5*i,
      0.5*j, out aSol, out bSol, out x);
      if (r) {
      bSol = l1.Low + bSol*(l1.High - l1.Low);
      aSol = l0.Low + aSol*(l0.High - l0.Low);
      }
      }

      if (r) {
      AddIntersection(l0, l1, intersections, aSol, bSol, x);
      found = true;
      }
      }
      }

      if (!found)
      GoDeeper(ref intersections, l0, l1);
      return intersections;
      }

      static void AddIntersection(ParallelogramLeaf n0, ParallelogramLeaf n1, List<IntersectionInfo> intersections,
      number aSol, number bSol,
      Point x) {
      //adjust the intersection if it is close to the ends of the segs
      if (ApproximateComparer.CloseIntersections(x, n0.Seg[n0.Low])) {
      x = n0.Seg[n0.Low];
      aSol = n0.Low;
      }
      else if (ApproximateComparer.CloseIntersections(x, n0.Seg[n0.High])) {
      x = n0.Seg[n0.High];
      aSol = n0.High;
      }

      if (ApproximateComparer.CloseIntersections(x, n1.Seg[n1.Low])) {
      x = n1.Seg[n1.Low];
      bSol = n1.Low;
      }
      else if (ApproximateComparer.CloseIntersections(x, n1.Seg[n1.High])) {
      x = n1.Seg[n1.High];
      bSol = n1.High;
      }

      bool oldIntersection = OldIntersection(intersections, ref x);
      if (!oldIntersection) {
      var xx = new IntersectionInfo(aSol, bSol, x, n0.Seg, n1.Seg);
      intersections.Add(xx);
      }

      return;
      }

      // returns true if the intersection exists already
      static bool OldIntersection(List<IntersectionInfo> intersections, ref Point x) {
      bool oldIntersection = false;
      //we don't expect many intersections so it's ok just go through all of them
      foreach (IntersectionInfo ii in intersections)
      if ((x - ii.IntersectionPoint).Length < ApproximateComparer.DistanceEpsilon*100)
      //please no close intersections
      {
      oldIntersection = true;
      break;
      }
      return oldIntersection;
      }

      static IntersectionInfo CreateIntersectionOne(ParallelogramLeaf n0, ParallelogramLeaf n1,
      number aSol, number bSol, Point x) {
      //adjust the intersection if it is close to the ends of the segs
      if (ApproximateComparer.CloseIntersections(x, n0.Seg[n0.Low])) {
      x = n0.Seg[n0.Low];
      aSol = n0.Low;
      }
      else if (ApproximateComparer.CloseIntersections(x, n0.Seg[n0.High])) {
      x = n0.Seg[n0.High];
      aSol = n0.High;
      }

      if (ApproximateComparer.CloseIntersections(x, n1.Seg[n1.Low])) {
      x = n1.Seg[n1.Low];
      bSol = n1.Low;
      }
      else if (ApproximateComparer.CloseIntersections(x, n1.Seg[n1.High])) {
      x = n1.Seg[n1.High];
      bSol = n1.High;
      }

      return new IntersectionInfo(aSol, bSol, x, n0.Seg, n1.Seg);
      }

      static IntersectionInfo LiftIntersectionToCurves(
      ICurve c0, ICurve c1, number aSol,
      number bSol, Point x, ICurve seg0, ICurve seg1) {
      number a = LiftParameterToCurve(c0, aSol - seg0.ParStart, seg0);
      number b = LiftParameterToCurve(c1, bSol - seg1.ParStart, seg1);

      return new IntersectionInfo(a, b, x, c0, c1);
      }

      static IntersectionInfo DropIntersectionToSegs(IntersectionInfo xx) {
      ICurve seg0;
      number par0;

      if (xx.Segment0 is Curve)
      (xx.Segment0 as Curve).GetSegmentAndParameter(xx.Par0, out par0, out seg0);
      else {
      par0 = xx.Par0;
      seg0 = xx.Segment0;
      }

      ICurve seg1;
      number par1;

      if (xx.Segment1 is Curve)
      (xx.Segment1 as Curve).GetSegmentAndParameter(xx.Par1, out par1, out seg1);
      else {
      par1 = xx.Par1;
      seg1 = xx.Segment1;
      }

      return new IntersectionInfo(par0, par1, xx.IntersectionPoint, seg0, seg1);
      }

      internal static IntersectionInfo LiftIntersectionToCurves(ICurve c0, ICurve c1, IntersectionInfo xx) {
      return LiftIntersectionToCurves(c0, c1, xx.Par0, xx.Par1, xx.IntersectionPoint, xx.Segment0, xx.Segment1);
      }

      internal static number LiftParameterToCurve(ICurve curve, number par, ICurve seg) {
      if (curve == seg)
      return par;

      var c = curve as Curve;

      if (c != null) {
      number offset = 0;
      foreach (ICurve s in c.Segments) {
      if (s == seg)
      return par + offset;
      offset += ParamSpan(s);
      }
      }
      var roundedRect = curve as RoundedRect;
      if (roundedRect != null)
      return LiftParameterToCurve(roundedRect.Curve, par, seg);

      throw new InvalidOperationException(); //"bug in LiftParameterToCurve");
      }

      static number ParamSpan(ICurve s) {
      return s.ParEnd - s.ParStart;
      }

      static IntersectionInfo GoDeeperOne(ParallelogramLeaf l0, ParallelogramLeaf l1) {
      number eps = ApproximateComparer.DistanceEpsilon;
      // did not find an intersection
      if (l0.LeafBoxesOffset > eps && l1.LeafBoxesOffset > eps) {
      // going deeper on both with offset l0.LeafBoxesOffset / 2, l1.LeafBoxesOffset / 2
      ParallelogramNodeOverICurve nn0 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l0.Low, l0.High, l0.Seg, l0.LeafBoxesOffset/2);
      ParallelogramNodeOverICurve nn1 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l1.Low, l1.High, l1.Seg, l1.LeafBoxesOffset/2);
      return CurveCurveXWithParallelogramNodesOne(nn0, nn1);
      }
      if (l0.LeafBoxesOffset > eps) {
      // go deeper on the left
      ParallelogramNodeOverICurve nn0 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l0.Low, l0.High, l0.Seg, l0.LeafBoxesOffset/2);
      return CurveCurveXWithParallelogramNodesOne(nn0, l1);
      }
      if (l1.LeafBoxesOffset > eps) {
      // go deeper on the right
      ParallelogramNodeOverICurve nn1 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l1.Low, l1.High, l1.Seg, l1.LeafBoxesOffset/2);
      return CurveCurveXWithParallelogramNodesOne(l0, nn1);
      }
      //just cross LineSegs and adjust the solutions if the segments are not straight lines
      Point l0Low = l0.Seg[l0.Low];
      Point l0High = l0.Seg[l0.High];
      if (!ApproximateComparer.Close(l0Low, l0High)) {
      Point l1Low = l1.Seg[l1.Low];
      Point l1High = l1.Seg[l1.High];
      if (!ApproximateComparer.Close(l1Low, l1High)) {
      LineSegment ls0 = l0.Seg is LineSegment ? l0.Seg as LineSegment : new LineSegment(l0Low, l0High);
      LineSegment ls1 = l1.Seg is LineSegment ? l1.Seg as LineSegment : new LineSegment(l1Low, l1High);

      number asol, bsol;
      Point x;
      bool r = CrossWithinIntervalsWithGuess(ls0, ls1, 0, 1, 0, 1, 0.5, 0.5, out asol, out bsol, out x);
      if (r) {
      AdjustParameters(l0, ls0, l1, ls1, x, ref asol, ref bsol);
      return CreateIntersectionOne(l0, l1, asol, bsol, x);
      }
      }
      }
      return null;
      }

      static void GoDeeper(ref List<IntersectionInfo> intersections, ParallelogramLeaf l0, ParallelogramLeaf l1) {
      number eps = ApproximateComparer.DistanceEpsilon;
      // did not find an intersection
      if (l0.LeafBoxesOffset > eps && l1.LeafBoxesOffset > eps) {
      // going deeper on both with offset l0.LeafBoxesOffset / 2, l1.LeafBoxesOffset / 2
      ParallelogramNodeOverICurve nn0 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l0.Low, l0.High, l0.Seg, l0.LeafBoxesOffset/2);
      ParallelogramNodeOverICurve nn1 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l1.Low, l1.High, l1.Seg, l1.LeafBoxesOffset/2);
      CurveCurveXWithParallelogramNodes(nn0, nn1, ref intersections);
      }
      else if (l0.LeafBoxesOffset > eps) {
      // go deeper on the left
      ParallelogramNodeOverICurve nn0 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l0.Low, l0.High, l0.Seg, l0.LeafBoxesOffset/2);
      CurveCurveXWithParallelogramNodes(nn0, l1, ref intersections);
      }
      else if (l1.LeafBoxesOffset > eps) {
      // go deeper on the right
      ParallelogramNodeOverICurve nn1 = ParallelogramNodeOverICurve.CreateParallelogramNodeForCurveSeg(
      l1.Low, l1.High, l1.Seg, l1.LeafBoxesOffset/2);
      CurveCurveXWithParallelogramNodes(l0, nn1, ref intersections);
      }
      else {
      //just cross LineSegs since the polylogramms are so thin
      Point l0Low = l0.Seg[l0.Low];
      Point l0High = l0.Seg[l0.High];
      if (!ApproximateComparer.Close(l0Low, l0High)) {
      Point l1Low = l1.Seg[l1.Low];
      Point l1High = l1.Seg[l1.High];
      if (!ApproximateComparer.Close(l1Low, l1High)) {
      LineSegment ls0 = l0.Seg is LineSegment ? l0.Seg as LineSegment : new LineSegment(l0Low, l0High);
      LineSegment ls1 = l1.Seg is LineSegment ? l1.Seg as LineSegment : new LineSegment(l1Low, l1High);

      number asol, bsol;
      Point x;
      bool r = CrossWithinIntervalsWithGuess(ls0, ls1, 0, 1, 0, 1, 0.5, 0.5, out asol, out bsol, out x);
      if (r) {
      AdjustParameters(l0, ls0, l1, ls1, x, ref asol, ref bsol);
      AddIntersection(l0, l1, intersections, asol, bsol, x);
      }
      }
      }
      }
      }


      static void AdjustParameters(ParallelogramLeaf l0, LineSegment ls0, ParallelogramLeaf l1, LineSegment ls1,
      Point x, ref number asol, ref number bsol) {
      if (ls0 != l0.Seg && l0.Seg is Polyline == false) //l0.Seg is not a LineSegment and not a polyline
      asol = l0.Seg.ClosestParameter(x); //we need to find the correct parameter
      else
      asol = l0.Low + asol*(l0.High - l0.Low);
      if (ls1 != l1.Seg && l1.Seg is Polyline == false) //l1.Seg is not a LineSegment and not a polyline
      bsol = l1.Seg.ClosestParameter(x); //we need to find the correct parameter
      else
      bsol = l1.Low + bsol*(l1.High - l1.Low);
      }

      static number lineSegThreshold = 0.05;

      // The distance between the start and end point of a curve segment for which we consider the segment as a line segment
      public static number LineSegmentThreshold {
      get { return lineSegThreshold; }
      set { lineSegThreshold = value; }
      }

      // returns the segment correspoinding to t and the segment parameter
      public void GetSegmentAndParameter(number t, out number par, out ICurve segment) {
      number u = ParStart; //u is the sum of param domains
      foreach (ICurve sg in segs) {
      number domLen = sg.ParEnd - sg.ParStart;
      if (t >= u && t <= u + domLen) {
      par = t - u + sg.ParStart;
      segment = sg;
      return;
      }
      u += domLen;
      }
      segment = segs.Last();
      par = segment.ParEnd;
      }

      internal void GetSegmentAndParameter(number t, out number par, out int segIndex) {
      number u = 0; //u is the sum of param domains
      segIndex = 0;
      par = -1;

      for (int i = 0; i < segs.length; i++)
      {
      var sg = segs[i];
      number domLen = sg.ParEnd - sg.ParStart;
      if (t >= u && (t <= u + domLen || (i == segs.length-1 && ApproximateComparer.Compare(t,u+domLen)<=0) ))
      {
      par = t - u + sg.ParStart;
      return;
      }
      segIndex++;
      u += domLen;
      }

      throw new InvalidOperationException(string.Format("Check, args t:{0}, par:{1}, segIndex:{2} and u:{3}", t, par, segIndex, u));
      }


      // Returns the point on the curve corresponding to parameter t
      public Point this[number t] {
      get {
      number par;
      ICurve seg;

      GetSegmentAndParameter(t, out par, out seg);

      return seg[par];
      }
      }

      // first derivative at t
      public Point Derivative(number t) {
      number par;
      ICurve seg;

      GetSegmentAndParameter(t, out par, out seg);
      return seg.Derivative(par);
      }

      // second derivative
      public Point SecondDerivative(number t) {
      number par;
      ICurve seg;

      GetSegmentAndParameter(t, out par, out seg);
      return seg.SecondDerivative(par);
      }

      // third derivative
      public Point ThirdDerivative(number t) {
      number par;
      ICurve seg;

      GetSegmentAndParameter(t, out par, out seg);
      return seg.ThirdDerivative(par);
      }

      // For curves A(s) and B(t), if you have some evidence that 
      //  there is at most one intersection point, and you have some guess for the parameters (s0, t0)...
      // You are trying to bring to (0,0) the vector( F^2 s , F^2 t ).
      //F(s,t) = A(s) - B(t).  To minimize F^2,
      //You get the system of equations to solve for ds and dt: 
      //F*Fs + (F*Fss + Fs*Fs)ds + (F*Fst + Fs*Ft)dt = 0
      //F*Ft + (F*Fst + Fs*Ft)ds + (F*Ftt + Ft*Ft)dt = 0
      // 
      //Where F = F(si,ti), Fs and Ft are the first partials at si, ti, Fxx are the second partials, 
      //    and s(i+1) = si+ds, t(i+1) = ti+dt. 
      //Of course you have to make sure that ds and dt do not take you out of your domain.  This will converge if the curves have 2nd order continuity and your starting parameters are reasonable.  It is not a good method for situations that are not well behaved, but it is really simple.

      internal static bool CrossWithinIntervalsWithGuess(
      ICurve a, ICurve b,
      number amin, number amax,
      number bmin, number bmax,
      number aGuess,
      number bGuess,
      out number aSolution,
      out number bSolution, out Point x) {
      bool r;
      if (a is LineSegment && b is LineSegment)
      if (CrossTwoLineSegs(a.start(), a.end(), b.start(), b.end(), amin, amax, bmin, bmax, out aSolution,
      out bSolution, out x))
      return true;
      //it also handles the case of almost parallel segments
      Point aPoint;
      Point bPoint;
      r = MinDistWithinIntervals(a,
      b,
      amin,
      amax, bmin,
      bmax,
      aGuess, bGuess,
      out aSolution,
      out bSolution, out aPoint, out bPoint);


      x = 0.5*(aPoint + bPoint);
      Point aMinusB = aPoint - bPoint;
      //if side1 is  false tnen the values a and side1 are meaningless
      bool ret = r && aMinusB*aMinusB < ApproximateComparer.DistanceEpsilon*ApproximateComparer.DistanceEpsilon;
      return ret;
      }

      static bool CrossTwoLineSegs(Point aStart, Point aEnd, Point bStart, Point bEnd, number amin, number amax,
      number bmin, number bmax, out number aSolution, out number bSolution, out Point x) {
      Point u = aEnd - aStart;
      Point v = bStart - bEnd;
      Point w = bStart - aStart;
      bool r = LinearSystem2.Solve(u.X, v.X, w.X, u.Y, v.Y, w.Y, out aSolution, out bSolution);
      x = aStart + aSolution*u;

      if (r) {
      if (aSolution < amin - ApproximateComparer.Tolerance)
      return false;

      aSolution = Math.Max(aSolution, amin);

      if (aSolution > amax + ApproximateComparer.Tolerance)
      return false;

      aSolution = Math.Min(aSolution, amax);

      if (bSolution < bmin - ApproximateComparer.Tolerance)
      return false;

      bSolution = Math.Max(bSolution, bmin);

      if (bSolution > bmax + ApproximateComparer.Tolerance)
      return false;

      bSolution = Math.Min(bSolution, bmax);

      //  if(!ApproximateComparer.Close(x,B[bSolution]))
      //  throw new InvalidOperationException();// ("segs");
      return true;
      }

      return false;
      }

      // Decides if the point lies inside, outside or on the curve
      public static PointLocation PointRelativeToCurveLocation(Point point, ICurve curve) {
      System.Diagnostics.Debug.Assert(!Double.IsNaN(point.X) && !Double.IsNaN(point.Y));
      ValidateArg.IsNotNull(curve, "curve");
      if (!curve.BoundingBox.Contains(point))
      return PointLocation.Outside;

      number l = 2*curve.BoundingBox.Diagonal; //l should be big enough for the line to exit outside of the curve

      const number degree = Math.PI/180.0;
      int inside = 0;
      for (int i = 13; i < 360; i += 13) {
      var lineDir = new Point(Math.Cos(i*degree), Math.Sin(i*degree));
      var ls = new LineSegment(point, point + l*lineDir);

      IList<IntersectionInfo> intersections = GetAllIntersections(ls, curve, true);


      //SugiyamaLayoutSettings.Show(ls, curve);
      // CurveSerializer.Serialize("cornerC:\\tmp\\ls",ls);
      // CurveSerializer.Serialize("cornerC:\\tmp\\pol",curve);
      if (AllIntersectionsAreGood(intersections, curve)) {
      foreach (IntersectionInfo xx in intersections)
      if (ApproximateComparer.Close(xx.IntersectionPoint, point))
      return PointLocation.Boundary;
      bool insideThisTime = intersections.length%2 == 1;
      //to be on the safe side we need to get the same result at least twice
      if (insideThisTime)
      inside++;
      else
      inside--;

      if (inside >= 2)
      return PointLocation.Inside;
      if (inside <= -2)
      return PointLocation.Outside;
      }
      }
      //if all intersections are not good then we probably have the point on the boundaryCurve

      return PointLocation.Boundary;
      }


      //    static bool debug;
      static bool AllIntersectionsAreGood(IList<IntersectionInfo> intersections, ICurve polygon) {
      // If this isn't a Curve, try a Polyline.
      //TODO: fix this to avoid the cast
      var polyCurve = polygon as Curve;
      if (null == polyCurve) {
      var polyLine = polygon as Polyline;
      if (null != polyLine)
      polyCurve = polyLine.ToCurve();
      }
      if (null != polyCurve)
      foreach (IntersectionInfo xx in intersections)
      if (!RealCut(DropIntersectionToSegs(xx), polyCurve, false))
      return false;
      return true;
      }


      // Returns true if curves do not touch in the intersection point
      // only when the second curve cuts the first one from the inside</param>
      public static bool RealCutWithClosedCurve(IntersectionInfo xx, Curve polygon, bool onlyFromInsideCuts) {
      ValidateArg.IsNotNull(xx, "xx");
      ValidateArg.IsNotNull(polygon, "polygon");
      ICurve sseg = xx.Segment0;
      ICurve pseg = xx.Segment1;
      number spar = xx.Par0;
      number ppar = xx.Par1;
      Point x = xx.IntersectionPoint;

      //normalised tangent to spline
      Point ts = sseg.Derivative(spar).Normalize();
      Point pn = pseg.Derivative(ppar).Normalize().Rotate(Math.PI/2);

      if (ApproximateComparer.Close(x, pseg.end())) {
      //so pseg enters the spline 
      ICurve exitSeg = null;
      for (int i = 0; i < polygon.Segments.length; i++)
      if (polygon.Segments[i] == pseg) {
      exitSeg = polygon.Segments[(i + 1)%polygon.Segments.length];
      break;
      }

      if (exitSeg == null)
      throw new InvalidOperationException(); //"exitSeg==null");

      Point tsn = ts.Rotate((Math.PI/2));

      bool touch = (tsn*pseg.Derivative(pseg.ParEnd))*(tsn*exitSeg.Derivative(exitSeg.ParStart)) <
      ApproximateComparer.Tolerance;

      return !touch;
      }

      if (ApproximateComparer.Close(x, pseg.start())) {
      //so pseg exits the spline 
      ICurve enterSeg = null;
      for (int i = 0; i < polygon.Segments.length; i++)
      if (polygon.Segments[i] == pseg) {
      enterSeg = polygon.Segments[i > 0 ? (i - 1) : polygon.Segments.length - 1];
      break;
      }

      Point tsn = ts.Rotate((Math.PI/2));
      bool touch = (tsn*pseg.Derivative(pseg.ParStart))*
      (tsn*enterSeg.Derivative(enterSeg.ParEnd)) < ApproximateComparer.Tolerance;

      return !touch;
      }

      number d = ts*pn;
      if (onlyFromInsideCuts)
      return d > ApproximateComparer.DistanceEpsilon;
      return Math.Abs(d) > ApproximateComparer.DistanceEpsilon;
      }

      // 
      public static bool RealCut(IntersectionInfo xx, Curve polyline, bool onlyFromInsideCuts) {
      ValidateArg.IsNotNull(xx, "xx");
      ValidateArg.IsNotNull(polyline, "polyline");
      ICurve sseg = xx.Segment0;
      ICurve pseg = xx.Segment1;
      number spar = xx.Par0;
      number ppar = xx.Par1;
      Point x = xx.IntersectionPoint;


      //normalised tangent to spline
      Point ts = sseg.Derivative(spar).Normalize();
      Point pn = pseg.Derivative(ppar).Normalize().Rotate(Math.PI/2);

      if (ApproximateComparer.Close(x, pseg.end())) {
      //so pseg enters the spline 
      ICurve exitSeg = null;
      for (int i = 0; i < polyline.Segments.length - 1; i++)
      if (polyline.Segments[i] == pseg) {
      exitSeg = polyline.Segments[i + 1];
      break;
      }

      if (exitSeg == null)
      return false; //hit the end of the polyline

      Point tsn = ts.Rotate((Math.PI/2));

      bool touch = (tsn*pseg.Derivative(pseg.ParEnd))*(tsn*exitSeg.Derivative(exitSeg.ParStart)) <
      ApproximateComparer.Tolerance;

      return !touch;
      }

      if (ApproximateComparer.Close(x, pseg.start())) {
      //so pseg exits the spline 
      ICurve enterSeg = null;
      for (int i = polyline.segs.length - 1; i > 0; i--)
      if (polyline.Segments[i] == pseg) {
      enterSeg = polyline.Segments[i - 1];
      break;
      }
      if (enterSeg == null)
      return false;
      Point tsn = ts.Rotate((Math.PI/2));
      bool touch = (tsn*pseg.Derivative(pseg.Parstart()))*
      (tsn*enterSeg.Derivative(enterSeg.ParEnd)) < ApproximateComparer.Tolerance;

      return !touch;
      }

      number d = ts*pn;
      if (onlyFromInsideCuts)
      return d > ApproximateComparer.DistanceEpsilon;
      return Math.Abs(d) > ApproximateComparer.DistanceEpsilon;
      }

      internal static bool MinDistWithinIntervals(
      ICurve a, ICurve b, number aMin, number aMax, number bMin, number bMax,
      number aGuess, number bGuess, out number aSolution, out number bSolution, out Point aPoint, out Point bPoint) {
      var md = new MinDistCurveCurve(a, b, aMin, aMax, bMin, bMax, aGuess, bGuess);
      md.Solve();
      aSolution = md.ASolution;
      aPoint = md.APoint;
      bSolution = md.BSolution;
      bPoint = md.BPoint;

      return md.Status;
      }

      #if DEBUGCURVES
      public override string ToString()
      {
      bool poly = true;
      foreach (ICurve s in segs)
      if (s is LineSeg == false)
      {
      poly = false;
      break;
      }

      string ret;
      if (!poly)
      {
      ret = "{";

      foreach (ICurve seg in Segs)
      {
      ret += seg + ",";
      }


      return ret + "}";
      }
      ret = "{";
      if (segs.length > 0)
      ret += segs[0].start().X.ToString() + "," + segs[0].start().Y.ToString()+" ";
      foreach(LineSeg s in segs)
      ret += s.end().X.ToString() + "," + s.end().Y.ToString() + " ";
      return ret + "}";
      }
      #endif

      // Offsets the curve in the direction of dir
      public ICurve OffsetCurve(number offset, Point dir) {
      return null;
      }

      // The bounding rectangle of the curve
      public Rectangle BoundingBox {
      get {
      if (Segments.length == 0)
      return new Rectangle(0, 0, -1, -1);
      #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=369 there are no structs in js
      Rectangle b = Segments[0].BoundingBox.Clone();
      #else
      Rectangle b = Segments[0].BoundingBox;
      #endif
      for (int i = 1; i < Segments.length; i++)
      b.Add(Segments[i].BoundingBox);

      return b;
      }
      }

      #region ICurve Members

      // clones the curve. 
      public ICurve Clone() {
      var c = new Curve(Segments.length);
      foreach (ICurve seg in Segments)
      c.addSegment(seg.Clone());
      return c;
      }

      #endregion

      #region ICurve Members

      // 
      public number GetParameterAtLength(number length) {
      var parSpan = 0.0;
      foreach (var seg in Segments) {
      var segL = seg.Length;
      if (segL >= length)
      return parSpan+seg.GetParameterAtLength(length);

      length -= segL;
      parSpan += seg.ParEnd - seg.ParStart;
      }
      return ParEnd;
      }

      // returns a parameter t such that the distance between curve[t] and targetPoint is minimal 
      // and t belongs to the closed segment [low,high]
      public number ClosestParameterWithinBounds(Point targetPoint, number low, number high) {
      number par = 0;
      number dist = Double.MaxValue;
      number offset = 0;
      foreach (ICurve seg in Segments) {
      if (offset > high)
      break; //we are out of the [low, high] segment
      number segParamSpan = ParamSpan(seg);
      number segEnd = offset + segParamSpan;
      if (segEnd >= low) {
      //we are in business
      number segLow = Math.Max(seg.ParStart, seg.ParStart + (low - offset));
      number segHigh = Math.Min(seg.ParEnd, seg.ParStart + (high - offset));
      Debug.Assert(segHigh >= segLow);
      number t = seg.ClosestParameterWithinBounds(targetPoint, segLow, segHigh);
      Point d = targetPoint - seg[t];
      number dd = d*d;
      if (dd < dist) {
      par = offset + t - seg.ParStart;
      dist = dd;
      }
      }
      offset += segParamSpan;
      }
      return par;
      }

      // returns a parameter t such that the distance between curve[t] and a is minimal
      public number ClosestParameter(Point targetPoint) {
      number par = 0;
      number dist = Double.MaxValue;
      number offset = 0;
      foreach (ICurve c in Segments) {
      number t = c.ClosestParameter(targetPoint);
      Point d = targetPoint - c[t];
      number dd = d*d;
      if (dd < dist) {
      par = offset + t - c.ParStart;
      dist = dd;
      }
      offset += ParamSpan(c);
      }
      return par;
      }

      #endregion

      #region Curve concatenations

      //adds a line segment to the curve
      public static Curve AddLineSegment(Curve curve, Point pointA, Point pointB) {
      ValidateArg.IsNotNull(curve, "curve");
      return curve.addSegment(new LineSegment(pointA, pointB));
      }


      //static internal void AddLineSegment(Curve c, number x, number y, Point b) {
      //    AddLineSegment(c, new Point(x, y), b);
      //}

      // adds a line segment to the curve
      public static void AddLineSegment(Curve curve, number x0, number y0, number x1, number y1) {
      AddLineSegment(curve, new Point(x0, y0), new Point(x1, y1));
      }

      // adds a line segment to the curve
      public static void ContinueWithLineSegment(Curve c, number x, number y) {
      ValidateArg.IsNotNull(c, "c");
      AddLineSegment(c, c.end(), new Point(x, y));
      }

      // adds a line segment to the curve
      public static void ContinueWithLineSegment(Curve c, Point x) {
      ValidateArg.IsNotNull(c, "c");
      AddLineSegment(c, c.end(), x);
      }

      // 
      public static void CloseCurve(Curve curve) {
      ValidateArg.IsNotNull(curve, "curve");
      ContinueWithLineSegment(curve, curve.start());
      }

      #endregion

      // left derivative at t
      public Point LeftDerivative(number t) {
      ICurve seg = TryToGetLeftSegment(t);
      if (seg != null)
      return seg.Derivative(seg.ParEnd);
      return Derivative(t);
      }

      // right derivative at t
      public Point RightDerivative(number t) {
      ICurve seg = TryToGetRightSegment(t);
      if (seg != null)
      return seg.Derivative(seg.ParStart);
      return Derivative(t);
      }


      ICurve TryToGetLeftSegment(number t) {
      if (Math.Abs(t - ParStart) < ApproximateComparer.Tolerance) {
      if (Start == End)
      return Segments[Segments.length - 1];
      return null;
      }
      foreach (ICurve seg in Segments) {
      t -= ParamSpan(seg);
      if (Math.Abs(t) < ApproximateComparer.Tolerance)
      return seg;
      }
      return null;
      }

      ICurve TryToGetRightSegment(number t) {
      if (Math.Abs(t - ParEnd) < ApproximateComparer.Tolerance) {
      if (Start == End)
      return Segments[0];
      return null;
      }

      foreach (ICurve seg in Segments) {
      if (Math.Abs(t) < ApproximateComparer.Tolerance)
      return seg;

      t -= ParamSpan(seg);
      }
      return null;
      }

      // gets the closest point together with its parameter
      public static number ClosestParameterWithPoint(ICurve curve, Point location, out Point pointOnCurve) {
      ValidateArg.IsNotNull(curve, "curve");
      number t = curve.ClosestParameter(location);
      pointOnCurve = curve[t];
      return t;
      }

      // gets the point on the curve that is closest to the given point
      public static Point ClosestPoint(ICurve curve, Point location) {
      ValidateArg.IsNotNull(curve, "curve");
      return curve[curve.ClosestParameter(location)];
      }

      // Tests whether the first curve is inside the second.
      // We suppose that the curves are convex and they are 
      // not degenerated into a point
      public static bool CurveIsInsideOther(ICurve innerCurve, ICurve outerCurve) {
      ValidateArg.IsNotNull(innerCurve, "innerCurve");
      ValidateArg.IsNotNull(outerCurve, "outerCurve");
      if (!outerCurve.BoundingBox.Contains(innerCurve.BoundingBox)) return false;
      IList<IntersectionInfo> xx = GetAllIntersections(innerCurve, outerCurve, true);
      if (xx.length == 0) return NonIntersectingCurveIsInsideOther(innerCurve, outerCurve);
      if (xx.length == 1) //it has to be a touch
      return innerCurve.start() != xx[0].IntersectionPoint
      ? PointRelativeToCurveLocation(innerCurve.start(), outerCurve) == PointLocation.Inside
      : PointRelativeToCurveLocation(innerCurve[(innerCurve.ParStart + innerCurve.ParEnd)/2],
      outerCurve) == PointLocation.Inside;
      return
      PointsBetweenIntersections(innerCurve, xx).All(
      p => PointRelativeToCurveLocation(p, outerCurve) != PointLocation.Outside);
      }

      // Return points between but not including the intersections.
      internal static IEnumerable<Point> PointsBetweenIntersections(ICurve a, IList<IntersectionInfo> xx) {
      xx.OrderBy(x => x.Par0);
      for (int i = 0; i < xx.length - 1; i++)
      yield return a[(xx[i].Par0 + xx[i + 1].Par0)/2];
      //take care of the last interval
      number start = xx[xx.length - 1].Par0;
      number end = xx[0].Par0;
      number len = a.ParEnd - start + end - a.ParStart;
      number middle = start + len/2;
      if (middle > a.ParEnd)
      middle = a.ParStart + middle - a.ParEnd;
      yield return a[middle];
      }

      static bool NonIntersectingCurveIsInsideOther(ICurve a, ICurve b) {
      ValidateArg.IsNotNull(a, "a");
      ValidateArg.IsNotNull(b, "b");
      // Due to rounding, even curves with 0 intersections may return Boundary.
      for (number par = a.ParStart; par < a.ParEnd; par += 0.5) {
      // continue as long as we have boundary points.
      PointLocation parLoc = PointRelativeToCurveLocation(a[par], b);
      if (PointLocation.Boundary != parLoc) return PointLocation.Inside == parLoc;
      }

      // All points so far were on border so it is not considered inside; test the End.
      return PointLocation.Outside != PointRelativeToCurveLocation(a.end(), b);
      }

      // Tests whether the interiors of two closed convex curves intersect
      public static bool ClosedCurveInteriorsIntersect(ICurve curve1, ICurve curve2) {
      ValidateArg.IsNotNull(curve1, "curve1");
      ValidateArg.IsNotNull(curve2, "curve2");
      if (!curve2.BoundingBox.Intersects(curve1.BoundingBox))
      return false;
      IList<IntersectionInfo> xx = GetAllIntersections(curve1, curve2, true);
      if (xx.length == 0)
      return NonIntersectingCurveIsInsideOther(curve1, curve2) ||
      NonIntersectingCurveIsInsideOther(curve2, curve1);
      if (xx.length == 1) //it is a touch
      return curve1.start() != xx[0].IntersectionPoint
      ? PointRelativeToCurveLocation(curve1.start(), curve2) == PointLocation.Inside
      : PointRelativeToCurveLocation(curve1[(curve1.ParStart + curve1.ParEnd)/2], curve2) ==
      PointLocation.Inside ||
      curve2.start() != xx[0].IntersectionPoint
      ? PointRelativeToCurveLocation(curve2.start(), curve1) == PointLocation.Inside
      : PointRelativeToCurveLocation(curve2[(curve2.ParStart + curve2.ParEnd)/2], curve1) ==
      PointLocation.Inside;
      return
      PointsBetweenIntersections(curve1, xx).Any(
      p => PointRelativeToCurveLocation(p, curve2) == PointLocation.Inside);
      }

      #region ICurve Members

      // 
      public number Curvature(number t) {
      ICurve seg;
      number par;
      GetSegmentAndParameter(t, out par, out seg);
      return seg.Curvature(par);
      }

      // 
      public number CurvatureDerivative(number t) {
      throw new NotImplementedException();
      }

      // 
      public number CurvatureSecondDerivative(number t) {
      throw new NotImplementedException();
      }

      #endregion

      public static bool CurvesIntersect(ICurve curve1, ICurve curve2) {
      return curve1 == curve2 || (CurveCurveIntersectionOne(curve1, curve2, false) != null);
      }

      internal static CubicBezierSegment CreateBezierSeg(number kPrev, number kNext, Site a, Site b, Site c) {
      Point s = kPrev*a.Point + (1 - kPrev)*b.Point;
      Point e = kNext*c.Point + (1 - kNext)*b.Point;
      Point t = (2.0/3.0)*b.Point;
      return new CubicBezierSegment(s, s/3.0 + t, t + e/3.0, e);
      }

      internal static CubicBezierSegment CreateBezierSeg(Point a, Point b, Point perp, int i) {
      Point d = perp*i;
      return new CubicBezierSegment(a, a + d, b + d, b);
      }

      internal static bool FindCorner(Site a, out Site b, out Site c) {
      c = null; // to silence the compiler
      b = a.Next;
      if (b.Next == null)
      return false; //no corner has been found
      c = b.Next;
      return c != null;
      }

      internal static ICurve TrimEdgeSplineWithNodeBoundaries(ICurve sourceBoundary,
      ICurve targetBoundary, ICurve spline,
      bool narrowestInterval) {
      
      var start = spline.ParStart;
      var end = spline.ParEnd;
      if (sourceBoundary != null)
      FindNewStart(spline, ref start, sourceBoundary, narrowestInterval);
      if (targetBoundary != null)
      FindNewEnd(spline, targetBoundary, narrowestInterval, ref end);

      number st = Math.Min(start, end);
      number en = Math.Max(start, end);
      return st < en ? spline.Trim(st, en) : spline;
      }

      static void FindNewEnd(ICurve spline, ICurve targetBoundary, bool narrowestInterval, ref number end) {
      //SugiyamaLayoutSettings.Show(c, spline);
      IList<IntersectionInfo> intersections = GetAllIntersections(spline, targetBoundary, true);
      if (intersections.length == 0) {
      end = spline.ParEnd;
      return;
      }
      if (narrowestInterval) {
      end = spline.ParEnd;
      foreach (IntersectionInfo xx in intersections)
      if (xx.Par0 < end)
      end = xx.Par0;
      }
      else {
      //looking for the last intersection
      end = spline.ParStart;
      foreach (IntersectionInfo xx in intersections)
      if (xx.Par0 > end)
      end = xx.Par0;
      }
      }

      static void FindNewStart(ICurve spline, ref number start, ICurve sourceBoundary, bool narrowestInterval) {
      IList<IntersectionInfo> intersections = GetAllIntersections(spline, sourceBoundary, true);
      if (intersections.length == 0) {
      start = spline.ParStart;
      return;
      }
      if (narrowestInterval) {
      start = spline.ParStart;
      foreach (IntersectionInfo xx in intersections)
      if (xx.Par0 > start)
      start = xx.Par0;
      }
      else {
      start = spline.ParEnd;
      foreach (IntersectionInfo xx in intersections)
      if (xx.Par0 < start)
      start = xx.Par0;
      }
      }

      // 
      public static Polyline PolylineAroundClosedCurve(ICurve curve) {
      Polyline ret;
      var ellipse = curve as Ellipse;
      if (ellipse != null)
      ret = RefineEllipse(ellipse);
      else {
      var poly = curve as Polyline;
      if (poly != null)
      return poly;
      var c = curve as Curve;
      if (c != null && AllSegsAreLines(c)) {
      ret = new Polyline();
      foreach (LineSegment ls in c.Segments)
      ret.AddPoint(ls.start());
      ret.Closed = true;
      if (!ret.IsClockwise())
      ret = (Polyline) ret.Reverse();
      }
      else
      ret = StandardRectBoundary(curve);
      }
      return ret;
      }

      static bool AllSegsAreLines(Curve c) {
      foreach (ICurve s in c.Segments)
      if (!(s is LineSegment))
      return false;
      return true;
      }

      // this code only works for the standard ellipse
      static Polyline RefineEllipse(Ellipse ellipse) {
      Polyline rect = StandardRectBoundary(ellipse);
      var dict = new SortedDictionary<number, Point>();
      number a = Math.PI/4;
      number w = ellipse.BoundingBox.Width;
      number h = ellipse.BoundingBox.Height;
      number l = Math.Sqrt(w*w + h*h);
      for (int i = 0; i < 4; i++) {
      number t = a + i*Math.PI/2; // parameter
      Point p = ellipse[t]; //point on the ellipse
      Point tan = l*(ellipse.Derivative(t).Normalize()); //make it long enough

      var ls = new LineSegment(p - tan, p + tan);
      foreach (IntersectionInfo ix in GetAllIntersections(rect, ls, true))
      dict[ix.Par0] = ix.IntersectionPoint;
      }

      Debug.Assert(dict.length > 0);
      return new Polyline(dict.Values) {Closed = true};
      }

      internal static Polyline StandardRectBoundary(ICurve curve) {
      Rectangle bbox = curve.BoundingBox;
      return bbox.Perimeter();
      }

      // Create a closed Polyline from a rectangle
      public static Polyline PolyFromBox(Rectangle rectangle) {
      var p = new Polyline();
      p.AddPoint(rectangle.LeftTop);
      p.AddPoint(rectangle.RightTop);
      p.AddPoint(rectangle.RightBottom);
      p.AddPoint(rectangle.LeftBottom);
      p.Closed = true;
      return p;
      }

    */
}
