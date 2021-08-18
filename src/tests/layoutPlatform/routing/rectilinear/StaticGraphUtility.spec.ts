import {Direction} from '../../../../layoutPlatform/math/geometry/direction'
import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {Polyline} from '../../../../layoutPlatform/math/geometry/polyline'
import {StaticGraphUtility} from '../../../../layoutPlatform/routing/rectilinear/StaticGraphUtility'
import {LeftObstacleSide} from '../../../../layoutPlatform/routing/spline/coneSpanner/LeftObstacleSide'
import {VisibilityEdge} from '../../../../layoutPlatform/routing/visibility/VisibilityEdge'
import {VisibilityGraph} from '../../../../layoutPlatform/routing/visibility/VisibilityGraph'
import {VisibilityVertex} from '../../../../layoutPlatform/routing/visibility/VisibilityVertex'

test('EdgeDirectionVE', () => {
  const ve = new VisibilityEdge(
    new VisibilityVertex(new Point(0, 0)),
    new VisibilityVertex(new Point(1, 0)),
  )
  expect(StaticGraphUtility.EdgeDirectionVE(ve)).toBe(Direction.East)
})

test('GetVertex', () => {
  const a = new VisibilityVertex(new Point(0, 0))
  const b = new VisibilityVertex(new Point(-1, 0))
  const ve = new VisibilityEdge(a, b)

  expect(StaticGraphUtility.GetEdgeEnd(ve, Direction.East)).toBe(a)
})

test('FindAdjacentVertex', () => {
  const a = new VisibilityVertex(new Point(0, 0))
  const b = new VisibilityVertex(new Point(-1, 0))
  const c = new VisibilityVertex(new Point(0, -1))
  const ab = new VisibilityEdge(a, b)
  const ca = new VisibilityEdge(c, a)
  VisibilityGraph.AddEdge(ab)
  VisibilityGraph.AddEdge(ca)
  expect(StaticGraphUtility.FindAdjacentVertex(a, Direction.South)).toBe(c)
  expect(StaticGraphUtility.FindAdjacentVertex(a, Direction.West)).toBe(b)
  expect(StaticGraphUtility.FindAdjacentVertex(a, Direction.North)).toBe(null)
  expect(StaticGraphUtility.FindAdjacentVertex(b, Direction.East)).toBe(a)
})

test('FindAdjacentEdge', () => {
  const a = new VisibilityVertex(new Point(0, 0))
  const b = new VisibilityVertex(new Point(-1, 0))
  const c = new VisibilityVertex(new Point(0, -1))
  const ab = new VisibilityEdge(a, b)
  const ca = new VisibilityEdge(c, a)
  VisibilityGraph.AddEdge(ab)
  VisibilityGraph.AddEdge(ca)
  expect(StaticGraphUtility.FindAdjacentEdge(a, Direction.South)).toBe(null)
  expect(StaticGraphUtility.FindAdjacentEdge(c, Direction.North)).toBe(ca)
  expect(StaticGraphUtility.FindAdjacentEdge(a, Direction.West)).toBe(ab)
  expect(StaticGraphUtility.FindAdjacentEdge(b, Direction.West)).toBe(ab)
})
test('PointIsOnSegmentPPP', () => {
  const a = new Point(0, 0)
  const b = new Point(1, 0)
  const c = new Point(0.5, 0)
  expect(StaticGraphUtility.PointIsOnSegmentPPP(a, b, c)).toBe(true)
})

test('FindBendPointBetween', () => {
  const a = new Point(0, 0)
  const b = new Point(1, 1)

  expect(
    StaticGraphUtility.FindBendPointBetween(a, b, Direction.East).equal(
      new Point(0, 1),
    ),
  ).toBe(true)
  expect(
    StaticGraphUtility.FindBendPointBetween(a, b, Direction.North).equal(
      new Point(1, 0),
    ),
  ).toBe(true)
})
test('SegmentIntersectionPPP', () => {
  const a = new Point(0, 0)
  const b = new Point(0, 2)
  const c = new Point(1, 1)
  const d = new Point(2, 0)
  expect(
    StaticGraphUtility.SegmentIntersectionPPP(a, b, c).equal(new Point(0, 1)),
  ).toBe(true)
  expect(
    StaticGraphUtility.SegmentIntersectionPPP(b, a, c).equal(new Point(0, 1)),
  ).toBe(true)
  expect(
    StaticGraphUtility.SegmentIntersectionPPP(a, d, c).equal(new Point(1, 0)),
  ).toBe(true)
})

test('SegmentIntersectionSP', () => {
  const poly = Polyline.mkFromPoints([
    new Point(0, 0),
    new Point(2, 0),
    new Point(1, 1),
  ])
  const seg = new LeftObstacleSide(poly.startPoint)
  const c = new Point(1, 1)
  expect(
    StaticGraphUtility.SegmentIntersectionSP(seg, c).equal(new Point(1, 0)),
  ).toBe(true)
})
test('SegmentIntersectionSSOutPoint', () => {
  const poly = Polyline.mkFromPoints([
    new Point(0, 0),
    new Point(2, 0),
    new Point(1, 1),
  ])
  const poly0 = Polyline.mkFromPoints([
    new Point(1, -1),
    new Point(1, 2),
    new Point(1, 1),
  ])
  const seg = new LeftObstacleSide(poly.startPoint)
  const seg0 = new LeftObstacleSide(poly0.startPoint)

  expect(
    StaticGraphUtility.SegmentsIntersection(seg, seg0).equal(new Point(1, 0)),
  ).toBe(true)
})

test('PointIsOnSegment', () => {
  const poly = Polyline.mkFromPoints([
    new Point(0, 0),
    new Point(2, 0),
    new Point(1, 1),
  ])

  const seg = new LeftObstacleSide(poly.startPoint)

  expect(StaticGraphUtility.PointIsOnSegmentSP(seg, new Point(1, 0))).toBe(true)
  expect(StaticGraphUtility.PointIsOnSegmentSP(seg, new Point(1, 1))).toBe(
    false,
  )
})

test('SegmentIntersectionLLOutPoint', () => {
  const l0 = LineSegment.mkPP(new Point(0, 0), new Point(2, 0))
  const l1 = LineSegment.mkPP(new Point(0, -1), new Point(0, 1))

  expect(StaticGraphUtility.SegmentsIntersectLL(l0, l1)).toBe(true)
})
test('EdgeDirectionVE', () => {
  const g = new VisibilityGraph()
  const a = new Point(0, 0)
  const b = new Point(1, 0)
  const c = new Point(5, 0)
  g.AddVertexP(a)
  g.AddVertexP(b)
  g.AddVertexP(c)
  const ab = g.AddEdge(a, b)
  expect(StaticGraphUtility.EdgeDirectionVE(ab)).toBe(Direction.East)
})
