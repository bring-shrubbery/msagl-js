import {Direction} from '../../../../layoutPlatform/math/geometry/direction'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {StaticGraphUtility} from '../../../../layoutPlatform/routing/rectilinear/StaticGraphUtility'
import {VisibilityGraph} from '../../../../layoutPlatform/routing/visibility/VisibilityGraph'

test('PointIsOnSegmentPPP', () => {
  const a = new Point(0, 0)
  const b = new Point(1, 0)
  const c = new Point(0.5, 0)
  expect(StaticGraphUtility.PointIsOnSegmentPPP(a, b, c)).toBe(true)
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
