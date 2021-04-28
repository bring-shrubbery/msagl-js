import {LineSegment} from '../../../math/geometry/lineSegment'
import {Point} from '../../../math/geometry/point'
import {Polyline} from '../../../math/geometry/polyline'
import {Polygon} from '../../../routing/visibility/Polygon'
test('more polygon dist', () => {
  const pls = GetPolylines()
  const point = new Point(373, 274)
  const ls = LineSegment.mkPP(point, new Point(314, 303))
  const pl5 = Polyline.mkFromPoints([ls.start, ls.end])
  //LayoutAlgorithmSettings.Show(pl0);
  let dist = Polygon.Distance(new Polygon(pl5), new Polygon(pls[0]))
  dist = Polygon.Distance(new Polygon(pl5), new Polygon(pls[1]))
  dist = Polygon.Distance(new Polygon(pl5), new Polygon(pls[2]))
  dist = Polygon.Distance(new Polygon(pl5), new Polygon(pls[3]))
})
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
  expect(di.dist).toBe(1)
})

function GetPolylines(): Polyline[] {
  const p0 = [223, 255, 172, 272, 129, 195, 174, 120, 217, 135, 282, 205]
  const p1 = [381, 194, 334, 196, 311, 181, 316, 128, 390, 156]
  const p2 = [559, 323, 491, 338, 428, 303, 451, 167, 560, 187]
  const p3 = [384, 453, 332, 401, 364, 365, 403, 400]
  const pl0 = Polyline.mkFromPoints(PointsFromData(p0))
  const pl1 = Polyline.mkFromPoints(PointsFromData(p1))
  const pl2 = Polyline.mkFromPoints(PointsFromData(p2))
  const pl3 = Polyline.mkFromPoints(PointsFromData(p3))
  return [pl0, pl1, pl2, pl3]
}

function PointsFromData(coords: number[]): Point[] {
  const r: Point[] = []
  for (let i = 0; i < coords.length - 1; i += 2) {
    r.push(new Point(coords[i], coords[i + 1]))
  }
  return r
}
