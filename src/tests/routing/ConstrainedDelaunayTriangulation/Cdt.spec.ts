import {Point} from '../../../math/geometry/point'
import {Cdt} from '../../../routing/ConstrainedDelaunayTriangulation/Cdt'
import {CdtSite} from '../../../routing/ConstrainedDelaunayTriangulation/CdtSite'
import {InCircle} from '../../../routing/ConstrainedDelaunayTriangulation/CdtSweeper'
import {CdtTriangle} from '../../../routing/ConstrainedDelaunayTriangulation/CdtTriangle'

test('cdt inCircle ', () => {
  let a = new CdtSite(new Point(0, 0))
  let b = new CdtSite(new Point(2, 0))
  let c = new CdtSite(new Point(1, 2))
  let s = new CdtSite(new Point(1, 1))
  expect(InCircle(s, a, b, c)).toBe(true)
  MoveSites(a, b, c, s)
  expect(InCircle(s, a, b, c)).toBe(true)
  RotateSites(a, b, c, s)
  expect(InCircle(s, a, b, c)).toBe(true)
  a = new CdtSite(new Point(0, 0))
  b = new CdtSite(new Point(2, 0))
  c = new CdtSite(new Point(1, 2))
  s = new CdtSite(new Point(1, -1))
  expect(!InCircle(s, a, b, c)).toBe(true)
  MoveSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  RotateSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  a = new CdtSite(new Point(0, 0))
  b = new CdtSite(new Point(1, 0))
  c = new CdtSite(new Point(5, 5))
  s = new CdtSite(new Point(3, 1))
  expect(InCircle(s, a, b, c)).toBe(true)
  MoveSites(a, b, c, s)
  expect(InCircle(s, a, b, c)).toBe(true)
  RotateSites(a, b, c, s)
  expect(InCircle(s, a, b, c)).toBe(true)
  expect(InCircle(s, c, a, b)).toBe(true)
  a = new CdtSite(new Point(0, 0))
  b = new CdtSite(new Point(1, 0))
  c = new CdtSite(new Point(5, 5))
  s = new CdtSite(new Point(4, 1))
  expect(!InCircle(s, a, b, c)).toBe(true)
  MoveSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  RotateSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  a = new CdtSite(new Point(0, 0))
  b = new CdtSite(new Point(1, 0))
  c = new CdtSite(new Point(5, 5))
  s = new CdtSite(new Point(3, 0.5))
  expect(!InCircle(s, a, b, c)).toBe(true)
  MoveSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  RotateSites(a, b, c, s)
  expect(!InCircle(s, a, b, c)).toBe(true)
  expect(!InCircle(s, c, a, b)).toBe(true)
})

function RotateSites(a: CdtSite, b: CdtSite, c: CdtSite, s: CdtSite) {
  const angle = Math.PI / 3
  a.point = a.point.rotate(angle)
  b.point = b.point.rotate(angle)
  c.point = c.point.rotate(angle)
  s.point = s.point.rotate(angle)
}

function MoveSites(a: CdtSite, b: CdtSite, c: CdtSite, s: CdtSite) {
  const del = new Point(20, -30)
  a.point = a.point.add(del)
  b.point = b.point.add(del)
  c.point = c.point.add(del)
  s.point = s.point.add(del)
}

test('TriangleCreationTest', () => {
  const a = new CdtSite(new Point(0, 0))
  const b = new CdtSite(new Point(2, 0))
  const c = new CdtSite(new Point(1, 2))
  const tri = CdtTriangle.mkSSSD(a, b, c, Cdt.GetOrCreateEdge)
  let e = tri.TriEdges.getItem(0)
  expect(e.upperSite == a).toBe(true)
  expect(e.lowerSite == b).toBe(true)
  expect(e.CcwTriangle == tri && e.CwTriangle == null).toBe(true)

  e = tri.TriEdges.getItem(1)
  expect(e.upperSite == c).toBe(true)
  expect(e.lowerSite == b).toBe(true)
  expect(e.CwTriangle == tri && e.CcwTriangle == null).toBe(true)

  e = tri.TriEdges.getItem(2)
  expect(e.upperSite == c).toBe(true)
  expect(e.lowerSite == a).toBe(true)
  expect(e.CcwTriangle == tri && e.CwTriangle == null).toBe(true)

  const tri0 = CdtTriangle.mkSED(
    new CdtSite(new Point(2, 2)),
    tri.TriEdges.getItem(1),
    Cdt.GetOrCreateEdge,
  )
  expect(tri0.TriEdges.getItem(0) == tri.TriEdges.getItem(1)).toBe(true)
  expect(
    tri.TriEdges.getItem(1).CcwTriangle != null &&
      tri.TriEdges.getItem(1).CwTriangle != null,
  ).toBe(true)
})
