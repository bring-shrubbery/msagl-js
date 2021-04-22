import {LineSegment} from '../../../math/geometry/lineSegment'
import {Ellipse} from '../../../math/geometry/ellipse'
import {Point} from './../../../math/geometry/point'
import {Curve} from './../../../math/geometry/curve'
import {PlaneTransformation} from './../../../math/geometry/planeTransformation'
import {CurveFactory} from './../../../math/geometry/curveFactory'
import {BezierSeg} from './../../../math/geometry/bezierSeg'
import {ICurve} from './../../../math/geometry/icurve'
import {Rectangle} from './../../../math/geometry/rectangle'

function intersectOnDiameter(a: Point, b: Point) {
  const ls = LineSegment.mkPP(a, b)
  const circ = Ellipse.mkCircle(b.sub(a).length / 2, Point.middle(a, b))
  let xx = Curve.getAllIntersections(ls, circ, false)
  expect(xx.length == 2).toBeTruthy()
  expect(
    Point.closeD(xx[0].x.sub(xx[1].x).length, b.sub(a).length),
  ).toBeTruthy()
  for (const x of xx) {
    expect(
      Point.closeDistEps(x.x, a) || Point.closeDistEps(x.x, b),
    ).toBeTruthy()
  }
  const rad = ls.length / 2
  ls.translate(new Point(0, rad))
  xx = Curve.getAllIntersections(ls, circ, false)
  expect(xx.length > 0 && xx.length <= 2).toBeTruthy()
}

function bbIsOk(s: ICurve) {
  const bbox = s.boundingBox.clone()
  const n = 20
  const del = Curve.paramSpan(s) / n
  const rect = Rectangle.mkEmpty()
  for (let i = 0; i < n; i++) {
    const v = s.value(Math.min(s.parStart + i * del, s.parEnd))
    expect(bbox.contains(v)).toBe(true)
    rect.add(v)
  }
  expect(bbox.contains(rect.leftBottom)).toBe(true)
  expect(bbox.contains(rect.rightTop)).toBe(true)
  rect.pad(rect.diagonal / 10)
  expect(rect.contains(bbox.leftBottom)).toBe(true)
  expect(rect.contains(bbox.rightTop)).toBe(true)
}

test('box translate behavior', () => {
  const ell = new Ellipse(
    Math.PI / 3,
    Math.PI / 2,
    new Point(100, 0),
    new Point(0, 100),
    new Point(0, 0),
  )
  const b = [
    new Point(0, 100),
    new Point(100, 100),
    new Point(200, 10),
    new Point(300, 0),
  ]
  const bezSeg = new BezierSeg(b[0], b[1], b[2], b[3])
  const ls = LineSegment.mkPP(b[0], b[1])
  const rr: Curve = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    52,
    7,
    7,
    new Point(0, 0),
  )
  const t = [ell, bezSeg, ls, rr]
  for (const s of t) {
    bbIsOk(s)
    s.translate(new Point(10, 32))
    bbIsOk(s)
  }
})

function intersectTwoRoundedRects(rr: Curve, rr0: Curve, i: number): void {
  const xx = Curve.getAllIntersections(rr, rr0, true)
  // const xxD = xx.map((x) =>
  //   DebugCurve.mkDebugCurveWCI(0.5, 'Red', CurveFactory.mkCircle(3, x.x)),
  // )
  // xxD.push(DebugCurve.mkDebugCurveI(rr))
  // xxD.push(DebugCurve.mkDebugCurveI(rr0))
  // const svgW = new SvgDebugWriter('/tmp/rr' + i + '.svg')
  // svgW.writeDebugCurves(xxD)
  // svgW.close()
  expect(xx.length % 2).toBe(0)
}

test('intersect rounded rect rotated', () => {
  const rr: Curve = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    52,
    5,
    7,
    new Point(0, 0),
  )
  const center = rr.boundingBox.center
  for (let i = 1; i <= 90; i++) {
    const rc = CurveFactory.rotateCurveAroundCenterByDegree(
      rr.clone(),
      center,
      i,
    )
    intersectTwoRoundedRects(rr, rc as Curve, i)
  }
})

test('curve intersect line circle', () => {
  const a = new Point(1, 0)
  const b = new Point(2, 0)
  intersectOnDiameter(a, b)
  const degree = Math.PI / 180
  for (let i = 0; i < 90; i++) {
    const angle = i * degree
    const m = PlaneTransformation.rotation(angle)
    const ac = m.multiplyPoint(a)
    const bc = m.multiplyPoint(b)
    intersectOnDiameter(ac, bc)
  }
})

test('bezier rounded rect intersections', () => {
  const rr: Curve = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    52,
    7,
    7,
    new Point(0, 0),
  )
  const center = rr.boundingBox.center
  const outsidePoint = center.add(
    new Point(rr.boundingBox.width, rr.boundingBox.height),
  )
  const dir = outsidePoint.sub(center)
  const perp = dir.div(3).rotate90Cw()
  const bezSeg = BezierSeg.mkBezier([
    center,
    Point.convSum(1 / 3, center, outsidePoint).add(perp),
    Point.convSum(2 / 3, center, outsidePoint).sub(perp),
    outsidePoint,
  ])
  for (let i = 1; i <= 190; i++) {
    const rc = CurveFactory.rotateCurveAroundCenterByDegree(
      bezSeg.clone(),
      center,
      i,
    )
    const xx = Curve.getAllIntersections(rr, rc, true)
    expect(xx.length > 0 && xx.length % 2 != 0).toBe(true)
  }
}, 10)

test('bezier bezier rect intersections', () => {
  const a = new Point(0, 0)
  const b = new Point(122, 100)
  const dir = b.sub(a)
  const perp = dir.div(3).rotate90Cw()
  const bezSeg = BezierSeg.mkBezier([
    a,
    Point.convSum(1 / 3, a, b).add(perp),
    Point.convSum(2 / 3, a, b).sub(perp),
    b,
  ])
  for (let i = 1; i < 90; i++) {
    const rc = CurveFactory.rotateCurveAroundCenterByDegree(
      bezSeg.clone(),
      bezSeg.boundingBox.center,
      i,
    )
    const xx = Curve.getAllIntersections(bezSeg, rc, true)
    expect(xx.length > 0).toBe(true)
  }
  // exp(false);
})
