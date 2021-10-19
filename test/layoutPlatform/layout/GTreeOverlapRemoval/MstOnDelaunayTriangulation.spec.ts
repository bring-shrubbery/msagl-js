import {from} from 'linq-to-typescript'
import {Point} from '../../../../src'
import {MstOnDelaunayTriangulation} from '../../../../src/layout/GTreeOverlapRemoval/MstOnDelaunayTriangulation'
import {LineSegment} from '../../../../src/math/geometry'
import {DebugCurve} from '../../../../src/math/geometry/debugCurve'
import {Cdt} from '../../../../src/routing/ConstrainedDelaunayTriangulation/Cdt'
import {CdtSweeper} from '../../../../src/routing/ConstrainedDelaunayTriangulation/CdtSweeper'
import {random} from '../../../../src/utils/random'
import {SvgDebugWriter} from '../../../utils/svgDebugWriter'

test('gtree on CDT', () => {
  const count = 100
  const points = []
  for (let i = 0; i < count; i++) {
    points.push(new Point(random(), random()).mul(20))
  }

  const cdt = new Cdt(points, null, null)
  cdt.run()
  const redCurves = []
  for (const s of cdt.PointsToSites.values()) {
    for (const e of s.Edges) {
      if (e.upperSite.point.y < 0 || e.lowerSite.point.y < 0) {
        redCurves.push(LineSegment.mkPP(e.lowerSite.point, e.upperSite.point))
      }
    }
  }
  CdtSweeper.ShowCdt(
    [...cdt.GetTriangles()],
    null,
    from(redCurves),
    null,
    '/tmp/mdsCdt.svg',
  )
  const ret = MstOnDelaunayTriangulation.GetMstOnCdt(
    cdt,
    (e) => e.lowerSite.point.sub(e.upperSite.point).length,
  )
  const l = []
  for (const s of cdt.PointsToSites.values()) {
    for (const e of s.Edges) {
      l.push(
        DebugCurve.mkDebugCurveTWCI(
          50,
          0.1,
          'black',
          LineSegment.mkPP(e.lowerSite.point, e.upperSite.point),
        ),
      )
    }
  }

  for (const e of ret) {
    l.push(
      DebugCurve.mkDebugCurveTWCI(
        100,
        0.2,
        'red',
        LineSegment.mkPP(e.lowerSite.point, e.upperSite.point),
      ),
    )
  }

  SvgDebugWriter.dumpDebugCurves('/tmp/mst.svg', l)
  //          LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
})
