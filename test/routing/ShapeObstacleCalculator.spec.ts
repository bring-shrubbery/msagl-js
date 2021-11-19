import {CurveFactory, Point} from '../../src'
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
  expect(Array.from(tightPolyline.points()).length).toBe(4)
  SvgDebugWriter.dumpICurves('/tmp/initialTight.svg', [
    shape.boundaryCurve,
    tightPolyline,
  ])
})

test('calculate', () => {
  const shape = new Shape(
    CurveFactory.mkRectangleWithRoundedCorners(20, 20, 5, 5),
  )
  const shObstCalc = new ShapeObstacleCalculator(
    shape,
    2,
    4,
    new Map<Shape, TightLooseCouple>(),
  )
  shObstCalc.Calculate()
  expect(!shObstCalc.tightHierarchy).toBe(true)
})

test('calculate with two children', () => {
  const root = new Shape(
    CurveFactory.mkRectangleWithRoundedCorners(20, 20, 5, 5),
  )
  root.UserData = 'root'
  const ch0 = new Shape(
    CurveFactory.mkRectangleWithRoundedCorners(5, 5, 1, 1, new Point(-10, -10)),
  )
  ch0.UserData = 'ch0'
  const ch1 = new Shape(
    CurveFactory.mkRectangleWithRoundedCorners(5, 5, 1, 1, new Point(10, 10)),
  )
  ch0.UserData = 'ch1'
  root.AddChild(ch0)
  root.AddChild(ch1)
  const shObstCalc = new ShapeObstacleCalculator(
    root,
    2,
    4,
    new Map<Shape, TightLooseCouple>(),
  )
  shObstCalc.Calculate()
  const tightPolylines = Array.from(shObstCalc.tightHierarchy.GetAllLeaves())
  expect(tightPolylines.length == 2).toBe(true)
})
