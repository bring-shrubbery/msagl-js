import {SmoothedPolyline} from './../../../math/geometry/smoothedPolyline'
import {SvgDebugWriter} from '../../../math/geometry/svgDebugWriter'
import {Polyline} from '../../../math/geometry/polyline'
import {Point} from '../../../math/geometry/point'

test('smooth test', () => {
  const ps = [
    new Point(0, 100),
    new Point(100, 100),
    new Point(200, 10),
    new Point(300, 0),
  ]

  let sp = SmoothedPolyline.mkFromPoints(ps)
  let poly = Polyline.mkFromPoints(ps)
  SvgDebugWriter.dumpICurves('/tmp/sp.svg', [poly, sp.createCurve()])

  ps[0].y = 0
  sp = SmoothedPolyline.mkFromPoints(ps)
  poly = Polyline.mkFromPoints(ps)
  SvgDebugWriter.dumpICurves('/tmp/sp1.svg', [poly, sp.createCurve()])
})
