import {Point} from '../../../layoutPlatform/math/geometry/point'
import {Polyline} from '../../../layoutPlatform/math/geometry/polyline'
import {Rectangle} from '../../../layoutPlatform/math/geometry/rectangle'
import {SvgDebugWriter} from '../../../layoutPlatform/math/geometry/svgDebugWriter'
import {InteractiveObstacleCalculator} from '../../../layoutPlatform/routing/interactiveObstacleCalculator'

test('padded rectangle', () => {
  const rect = Rectangle.mkPP(new Point(0, 0), new Point(100, 50))
  const poly = rect.perimeter()
  expect(poly instanceof Polyline).toBe(true)
  const paddedPoly = InteractiveObstacleCalculator.CreatePaddedPolyline(
    poly,
    10,
  )
  SvgDebugWriter.dumpICurves('/tmp/paddedRect.svg', [poly, paddedPoly])
})

test('padded triangle', () => {
  const poly = Polyline.mkFromPoints([
    new Point(0, 0),
    new Point(10, 100),
    new Point(20, 0),
  ])
  poly.closed = true

  expect(poly instanceof Polyline).toBe(true)
  const paddedPoly = InteractiveObstacleCalculator.CreatePaddedPolyline(
    poly,
    10,
  )
  SvgDebugWriter.dumpICurves('/tmp/paddedTri.svg', [poly, paddedPoly])
})
