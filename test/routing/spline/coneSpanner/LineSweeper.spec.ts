import {Point, Polyline} from '@/src/math/geometry'
import {LineSweeper} from '@/src/routing/spline/coneSpanner/LineSweeper'
import {VisibilityGraph} from '@/src/routing/visibility/VisibilityGraph'
import {PointSet} from '@/src/utils/PointSet'

test('two ports', () => {
  const obstacles: Polyline[] = null
  const direction = new Point(0, 1)
  const vg = new VisibilityGraph()
  const ports = new PointSet()
  ports.add(new Point(0, 0))
  ports.add(new Point(0.1, 10))
  const border: Polyline = null
  LineSweeper.Sweep(obstacles, direction, Math.PI / 6, vg, ports, border)

  expect(Array.from(vg.Edges).length).toBe(1)
})
