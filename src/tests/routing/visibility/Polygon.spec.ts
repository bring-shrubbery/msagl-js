import {Point} from '../../../math/geometry/point'
import {Polyline} from '../../../math/geometry/polyline'
import {Polygon} from '../../../routing/visibility/Polygon'

test('polygon dist', () => {
  const points = [
    new Point(0, 0),
    new Point(1, 1),
    new Point(2, 0),
    new Point(3, 0),
    new Point(3, 3),
    new Point(4, 1),
  ]
  const p = new Polyline()
  p.addPoint(points[0])
  p.addPoint(points[1])
  p.addPoint(points[2])
  p.closed = true
  const q = new Polyline()
  q.addPoint(points[0 + 3])
  q.addPoint(points[1 + 3])
  q.addPoint(points[2 + 3])
  q.closed = true
  const P = new Polygon(p)
  const Q = new Polygon(q)
  const di = Polygon.Distance(P, Q)
  expect(di.dist).toBeGreaterThan(0)
})
