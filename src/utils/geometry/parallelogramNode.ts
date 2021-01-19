import {ICurve} from './icurve';
import {Point} from './point';
import {LineSegment} from './lineSegment';
import {Parallelogram} from './parallelogram';
import {GeomConstants} from './geomConstants';
import {Assert} from './../assert';
import {LinearSystem2} from './linearSystem';
import {SvgDebugWriter} from './svgDebugWriter';
import {allVerticesOfParall} from './parallelogram';
import {Polyline} from './polyline';
import {DebugCurve} from './debugCurve';
import {CurveFactory} from './curveFactory';
// Serves to hold a Parallelogram and a ICurve,
// and is used in curve intersections routines.
// The node can be a top of the hierarchy if its sons are non-nulls.
// The sons are either both nulls or both non-nulls

export type PN = {
  parallelogram: Parallelogram;
  seg: ICurve;
  leafBoxesOffset: number;
  node: PNInternal | PNLeaf;
};

export function createPNLeaf(start: number, end: number, box: Parallelogram, seg: ICurve, eps: number): PN {
  return {
    parallelogram: box,
    seg: seg,
    leafBoxesOffset: eps,
    node: {
      low: start,
      high: end,
      chord: null, // create a cord only the segment and the chord are within intersectionEpsilon
    },
  };
}

export type PNLeaf = {
  low: number;
  high: number;
  chord: LineSegment | null;
};

export type PNInternal = {
  children: PN[];
};

export class ParallelogramNode {
  static distToSegm(p: Point, s: Point, e: Point): number {
    const l = e.minus(s);
    if (l.length() < GeomConstants.intersectionEpsilon) return p.minus(s.add(e).div(2)).length();
    let perp = new Point(-l.y, l.x);
    perp = perp.mult(1 / perp.length());
    return Math.abs(p.minus(s).dot(perp));
  }

  static createParallelogramOnSubSeg(start: number, end: number, seg: ICurve): Parallelogram | undefined {
    const a = seg.derivative(start);
    const b = seg.derivative(end);
    // a and b are directions of the sides
    const s = seg.value(start);
    const e = seg.value(end);
    // s + m*a + n*b = e - gives the system
    const sol = LinearSystem2.solve(a.x, b.x, e.x - s.x, a.y, b.y, e.y - s.y);
    if (sol == undefined) return;

    if (sol.x < 0 || sol.y > 0) {
      return;
    }
    Assert.assert(Point.closeDistEps(s.add(a.mult(sol.x)).add(b.mult(sol.y)), e), 'r should be close to e');

    const sideA = a.mult(sol.x);
    if (sideA.length() < GeomConstants.intersectionEpsilon) {
      return;
    }
    const sideB = b.mult(sol.y);
    if (sideB.length() < GeomConstants.intersectionEpsilon) {
      return;
    }
    const ret = Parallelogram.parallelogramByCornerSideSide(s, sideA, sideB);
    if (!ret.contains(seg.value((start + end) / 2))) return;
    return ret;
  }

  static createParallelogramNodeForCurveSeg(start: number, end: number, seg: ICurve, eps: number): PN {
    const closedSeg = start == seg.parStart() && end == seg.parEnd() && Point.close(seg.start(), seg.end(), GeomConstants.distanceEpsilon);
    if (closedSeg) return ParallelogramNode.createNodeWithSegmentSplit(start, end, seg, eps);

    const s = seg.value(start);
    const e = seg.value(end);
    const w = e.minus(s);
    const middle = seg.value((start + end) / 2);

    if (
      ParallelogramNode.distToSegm(middle, s, e) <= GeomConstants.intersectionEpsilon &&
      w.dot(w) < GeomConstants.lineSegmentThreshold * GeomConstants.lineSegmentThreshold &&
      end - start < GeomConstants.lineSegmentThreshold
    ) {
      const ls = LineSegment.mkLinePP(s, e);
      const pn: PN = ls.pNodeOverICurve();
      pn.seg = seg;
      const leaf = pn.node as PNLeaf;
      leaf.low = start;
      leaf.high = end;
      leaf.chord = ls;
      return pn;
    }

    if (ParallelogramNode.WithinEpsilon(seg, start, end, eps)) {
      const box = ParallelogramNode.createParallelogramOnSubSeg(start, end, seg);
      if (box != undefined) return createPNLeaf(start, end, box, seg, eps);
    }
    return ParallelogramNode.createNodeWithSegmentSplit(start, end, seg, eps);
  }

  static WithinEpsilon(seg: ICurve, start: number, end: number, eps: number) {
    const n = 3; //hack !!!! but maybe can be proven for Bezier curves and other regular curves
    const d = (end - start) / n;
    const s = seg.value(start);
    const e = seg.value(end);

    const d0 = ParallelogramNode.distToSegm(seg.value(start + d), s, e);
    if (d0 > eps) return false;

    const d1 = ParallelogramNode.distToSegm(seg.value(start + d * (n - 1)), s, e);

    return d1 <= eps;
  }

  static createParallelogramNodeForCurveSegDefaultOffset(seg: ICurve) {
    return ParallelogramNode.createParallelogramNodeForCurveSeg(seg.parStart(), seg.parEnd(), seg, GeomConstants.defaultLeafBoxesOffset);
  }

  static createNodeWithSegmentSplit(start: number, end: number, ell: ICurve, eps: number) {
    const pBNode: PN = {
      parallelogram: null,
      seg: ell,
      leafBoxesOffset: 1,
      node: {children: []},
    };

    const intNode: PNInternal = pBNode.node as PNInternal;

    intNode.children.push(ParallelogramNode.createParallelogramNodeForCurveSeg(start, 0.5 * (start + end), ell, eps));
    intNode.children.push(ParallelogramNode.createParallelogramNodeForCurveSeg(0.5 * (start + end), end, ell, eps));

    pBNode.parallelogram = Parallelogram.parallelogramOfTwo(intNode.children[0].parallelogram, intNode.children[1].parallelogram);
    return pBNode;
  }
}
