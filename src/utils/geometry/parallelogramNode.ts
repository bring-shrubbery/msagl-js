﻿import {ICurve} from './icurve';
import {LineSegment} from './lineSegment';
import {Parallelogram} from './parallelogram';
// Serves to hold a Parallelogram and a ICurve,
// and is used in curve intersections routines.
// The node can be a top of the hierarchy if its sons are non-nulls.
// The sons are either both nulls or both non-nulls

export type PN = {
	parallelogram: Parallelogram;
	seg: ICurve;
	leafBoxesOffset: number;
	node: PNInternal | PNLeaf | PNBinary;
};
type PNBinary = {
	leftSon: PN;
	rightSon: PN;
};

type PNLeaf = {
	low: number;
	high: number;
	chord: LineSegment;
};

type PNInternal = {
	children: [PN];
};
// export class ParallelogramNode {
//     seg: ICurve | null;
//     // The segment bounded by the parallelogram
//     internal ICurve Seg {
//     get {
//         return seg;
//     }
//     set {
//         seg = value;
//     }
// }

// number leafBoxesOffset = DefaultLeafBoxesOffset;

//         static internal number DefaultLeafBoxesOffset = 0.5;
// // The leafs of this node are as tight as the offset
// // <value></value>
// internal number LeafBoxesOffset {
//     get {
//         return leafBoxesOffset;
//     }
// }

// internal ParallelogramNodeOverICurve(ICurve s, number leafBoxesOffset) {
//     seg = s;
//     this.leafBoxesOffset = leafBoxesOffset;
// }

// //
//         static public ParallelogramNodeOverICurve CreateParallelogramNodeForCurveSegment(ICurve segment) {
//     ValidateArg.IsNotNull(segment, "segment");
//     return CreateParallelogramNodeForCurveSeg(segment.ParStart, segment.ParEnd, segment, DefaultLeafBoxesOffset);
// }

//         static bool WithinEpsilon(ICurve seg, number start, number end, number eps) {
//     if (seg is LineSegment)
//     return true;

//     int n = 3; //hack !!!! but maybe can be proven for Bezier curves and other regular curves
//     number d = (end - start) / n;
//     Point s = seg[start];
//     Point e = seg[end];

//     number d0 = DistToSegm(seg[start + d], s, e);
//     number d1 = DistToSegm(seg[start + d * (n - 1)], s, e);
//     //number d1d1 = seg.d1(start) * seg.d1(end);

//     return d0 < eps
//         &&
//         d1 < eps;// && d1d1 > 0;

// }

// internal static number DistToSegm(Point p, Point s, Point e) {

//     Point l = e - s;
//     if (l.Length < ApproximateComparer.IntersectionEpsilon)
//         return (p - (0.5f * (s + e))).Length;
//     Point perp = new Point(-l.Y, l.X);
//     perp = perp * (1.0f / perp.Length);
//     return Math.Abs((p - s) * perp);

// }

// // Creates a bounding parallelogram on a curve segment
// // We suppose here that the segment is convex or concave from start to end,
// // that is the region bounded by the straight segment seg[start], seg[end] and the curve seg is convex
// internal static bool CreateParallelogramOnSubSeg(number start, number end, ICurve seg, ref Parallelogram box,
//     Point startPoint, Point endPoint) {

//     if (seg is CubicBezierSegment)
//     return CreateParallelogramOnSubSegOnBezierSeg(start, end, seg, ref box);

//     Point tan1 = seg.Derivative(start);

//     Point tan2 = seg.Derivative(end);
//     Point tan2Perp = Point.P(-tan2.Y, tan2.X);

//     Point p = endPoint - startPoint;

//     number numerator = p * tan2Perp;
//     number denumerator = (tan1 * tan2Perp);
//     number x;// = (p * tan2Perp) / (tan1 * tan2Perp);
//     if (Math.Abs(numerator) < ApproximateComparer.DistanceEpsilon)
//         x = 0;
//     else if (Math.Abs(denumerator) < ApproximateComparer.DistanceEpsilon) {
//         //it is degenerated; adjacent sides are parallel, but
//         //since p * tan2Perp is big it does not contain e
//         return false;
//     } else x = numerator / denumerator;

//     tan1 *= x;

//     box = new Parallelogram(startPoint, tan1, endPoint - startPoint - tan1);
// #if DEBUGCURVES
//     if (!box.Contains(seg[end])) {

//         throw new InvalidOperationException();//"the box does not contain the end of the segment");
//     }
// #endif

//     number delta = (end - start) / 64;
//     for (int i = 1; i < 64; i++) {
//         if (!box.Contains(seg[start + delta * i]))
//             return false;
//     }
//     return true;

// }
// delegate Point B(int i);
// internal static bool CreateParallelogramOnSubSegOnBezierSeg(number start, number end, ICurve seg, ref Parallelogram box) {

//     CubicBezierSegment trimSeg = seg.Trim(start, end) as CubicBezierSegment;

//     B b = trimSeg.B;
//     Point a = b(1) - b(0);

//     box = new Parallelogram(b(0), a, b(3) - b(0));

//     if (box.Contains(b(2)))
//         return true;

//     box = new Parallelogram(b(3), b(2) - b(3), b(0) - b(3));

//     if (box.Contains(b(1)))
//         return true;

//     return false;
// }

// internal static ParallelogramNodeOverICurve CreateParallelogramNodeForCurveSeg(number start, number end, ICurve seg, number eps) {

//     bool closedSeg = (start == seg.ParStart && end == seg.ParEnd && ApproximateComparer.Close(seg.Start, seg.End));
//     if (closedSeg)
//         return CreateNodeWithSegmentSplit(start, end, seg, eps);

//     Point s = seg[start];
//     Point e = seg[end];
//     Point w = e - s;
//     Point middle = seg[(start + end) / 2];
//     if (
//         DistToSegm(middle, s, e) <= ApproximateComparer.IntersectionEpsilon
//         && w * w < Curve.LineSegmentThreshold * Curve.LineSegmentThreshold
//         && end - start < Curve.LineSegmentThreshold) {
//         var ls = new LineSegment(s, e);
//         var leaf = ls.ParallelogramNodeOverICurve as ParallelogramLeaf;
//         leaf.Low = start;
//         leaf.High = end;
//         leaf.Seg = seg;
//         leaf.Chord = ls;
//         return leaf;
//     }

//     bool we = WithinEpsilon(seg, start, end, eps);
//     Parallelogram box = new Parallelogram();

//     if (we && CreateParallelogramOnSubSeg(start, end, seg, ref box, s, e))
//         return new ParallelogramLeaf(start, end, box, seg, eps);

//     return CreateNodeWithSegmentSplit(start, end, seg, eps);

// }

//          static ParallelogramNodeOverICurve CreateNodeWithSegmentSplit(number start, number end, ICurve seg, number eps) {
//     ParallelogramInternalTreeNode pBNode = new ParallelogramInternalTreeNode(seg, eps);
//     pBNode.AddChild(CreateParallelogramNodeForCurveSeg(start, 0.5 * (start + end), seg, eps));
//     pBNode.AddChild(CreateParallelogramNodeForCurveSeg(0.5 * (start + end), end, seg, eps));
//     List < Parallelogram > boxes = new List<Parallelogram>();
//     boxes.Add(pBNode.Children[0].Parallelogram);
//     boxes.Add(pBNode.Children[1].Parallelogram);
//     pBNode.Parallelogram = Parallelogram.GetParallelogramOfAGroup(boxes);
//     return pBNode;

// }
// }
