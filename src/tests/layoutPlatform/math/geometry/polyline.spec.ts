import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'
import {Point} from './../../../../layoutPlatform/math/geometry/point'
import {Polyline} from './../../../../layoutPlatform/math/geometry/polyline'
import {Curve} from './../../../../layoutPlatform/math/geometry/curve'
import {PlaneTransformation} from './../../../../layoutPlatform/math/geometry/planeTransformation'
import {DebugCurve} from './../../../../layoutPlatform/math/geometry/debugCurve'
import {CurveFactory} from './../../../../layoutPlatform/math/geometry/curveFactory'
test('polyline test iterator', () => {
  const poly = new Polyline()
  const ps = [
    new Point(0, 0),
    new Point(10, 20),
    new Point(20, 0),
    new Point(30, 10),
  ]
  for (const p of ps) {
    poly.addPoint(p)
  }
  let i = 0
  for (const pp of poly.polylinePoints()) {
    expect(pp.point.equal(ps[i++])).toBe(true) // the points are added at the start of the polyline
  }
})
test('polyline test skip', () => {
  const poly = new Polyline()
  const ps = [
    new Point(0, 0),
    new Point(10, 20),
    new Point(20, 0),
    new Point(30, 10),
  ]
  for (const p of ps) {
    poly.addPoint(p)
  }
  const skip = 2
  let i = skip
  for (const pp of poly.skip(skip)) {
    expect(pp.point.equal(ps[i++])).toBe(true) // the points are added at the start of the polyline, skipping first two
  }
})

test('polyline test intersection one', () => {
  const poly = new Polyline()
  const ps = [
    new Point(0, 0),
    new Point(10, 20),
    new Point(20, 0),
    new Point(30, 10),
  ]
  for (const p of ps) {
    poly.addPoint(p)
  }
  const ls = LineSegment.mkPP(new Point(10, 0), new Point(10, 40))
  const x = Curve.intersectionOne(ls, poly, true)
  expect(x != undefined).toBe(true)
})

test('polyline test all intersection', () => {
  const poly = new Polyline()
  const ps = [
    new Point(0, 0),
    new Point(10, 20),
    new Point(20, 0),
    new Point(30, 10),
  ]
  for (const p of ps) {
    poly.addPoint(p)
  }
  let ls = LineSegment.mkPP(new Point(10, 0), new Point(10, 40))
  let xx = Curve.getAllIntersections(ls, poly, true)
  expect(xx.length == 1).toBe(true)
  ls = LineSegment.mkPP(new Point(0, 5), new Point(40, 6))
  xx = Curve.getAllIntersections(ls, poly, true)
  expect(xx.length == 3).toBe(true)
  for (const i of xx) {
    expect(i.x.y > 5 && i.x.y < 6).toBeTruthy()
    expect(i.x.x > 0 && i.x.x < 30).toBeTruthy()
  }
})

test('polyline test all intersection with polyline', () => {
  const poly = new Polyline()
  const points = [
    new Point(0, 0),
    new Point(10, 20),
    new Point(20, 0),
    new Point(30, 10),
  ]
  for (const p of points) {
    poly.addPoint(p)
  }

  const trans = new PlaneTransformation(1, 0, 0, 0, -1, 5)
  const polyFlipped = poly.transform(trans)
  expect(polyFlipped.end.x == poly.end.x).toBeTruthy()
  expect(polyFlipped.end.y == 5 - poly.end.y).toBeTruthy()
  const xx = Curve.getAllIntersections(poly, polyFlipped, false)
  const dc = [
    DebugCurve.mkDebugCurveTWCI(90, 0.1, 'Black', poly),
    DebugCurve.mkDebugCurveTWCI(90, 0.1, 'Green', polyFlipped),
  ]
  for (const inters of xx) {
    dc.push(
      DebugCurve.mkDebugCurveCI('Red', CurveFactory.mkCircle(0.05, inters.x)),
    )
  }
  expect(xx.length == 3).toBe(true)
})
