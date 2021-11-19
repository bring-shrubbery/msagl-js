import {Rectangle} from '../../src'
import {CurveFactory, Point, Polyline} from '../../src/math/geometry'
import {InteractiveObstacleCalculator} from '../../src/routing/interactiveObstacleCalculator'
import {Shape} from '../../src/routing/shape'
import {ShapeObstacleCalculator} from '../../src/routing/ShapeObstacleCalculator'
import {TightLooseCouple} from '../../src/routing/TightLooseCouple'
import {SvgDebugWriter} from '../utils/svgDebugWriter'
test('initialTightPolyline', () => {
  const shape = new Shape(
    CurveFactory.mkRectangleWithRoundedCorners(20, 20, 5, 5),
  )
  const shObstCalc = new ShapeObstacleCalculator(
    shape,
    2,
    4,
    new Map<Shape, TightLooseCouple>(),
  )
  const tightPolyline = shObstCalc.InitialTightPolyline(shape)
  SvgDebugWriter.dumpICurves('/tmp/initialTight.svg', [
    shape.boundaryCurve,
    tightPolyline,
  ])
})
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
