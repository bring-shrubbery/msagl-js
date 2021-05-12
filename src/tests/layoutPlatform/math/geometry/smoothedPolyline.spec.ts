import {SmoothedPolyline} from './../../../../layoutPlatform/math/geometry/smoothedPolyline'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {Polyline} from '../../../../layoutPlatform/math/geometry/polyline'
import {Point} from '../../../../layoutPlatform/math/geometry/point'

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

  ps[0] = new Point(0, 0)
  sp = SmoothedPolyline.mkFromPoints(ps)
  poly = Polyline.mkFromPoints(ps)
  SvgDebugWriter.dumpICurves('/tmp/sp1.svg', [poly, sp.createCurve()])
})
