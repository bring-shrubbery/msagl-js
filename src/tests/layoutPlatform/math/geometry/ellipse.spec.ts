// import {ICurve} from '../../layoutPlatform/math/geometry/icurve';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {DebugCurve} from '../../../../layoutPlatform/math/geometry/debugCurve'
import {Curve} from '../../../../layoutPlatform/math/geometry/curve'
import {CurveFactory} from '../../../../layoutPlatform/math/geometry/curveFactory'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Ellipse} from '../../../../layoutPlatform/math/geometry/ellipse'
import {GeomConstants} from '../../../../layoutPlatform/math/geometry/geomConstants'
test('ellipse value test', () => {
  const a = new Point(100, 0)
  const b = new Point(0, 200)
  const cen = new Point(-100, 0)
  const ell = Ellipse.mkEllipsePPP(a, b, cen)
  const t = 0.3
  expect(
    Point.close(
      ell.value(t),
      a.mul(Math.cos(t)).add(b.mul(Math.sin(t))),
      GeomConstants.distanceEpsilon,
    ),
  ).toBeTruthy
})

test('intersect quarters', () => {
  const rr = new Ellipse(
    0,
    Math.PI / 2,
    new Point(100, 0),
    new Point(0, 100),
    new Point(0, 0),
  )
  const rc = rr.clone()
  rc.translate(new Point(-3, 3))
  const xx = Curve.getAllIntersections(rr, rc, true)
  expect(xx.length == 1).toBeTruthy()
  expect(
    Point.close(
      rr.value(xx[0].par0),
      xx[0].x,
      GeomConstants.intersectionEpsilon,
    ),
  ).toBe(true)
})
