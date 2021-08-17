import {Direction} from '../../../../layoutPlatform/math/geometry/direction'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {StaticGraphUtility} from '../../../../layoutPlatform/routing/rectilinear/StaticGraphUtility'
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

test('FindNextVertex', () => {
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
