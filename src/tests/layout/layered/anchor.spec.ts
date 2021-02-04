import { GeomNode } from './../../../layout/core/geomNode'
import { Anchor } from './../../../layout/layered/anchor'
import { CurveFactory } from './../../../math/geometry/curveFactory'
import { SvgDebugWriter } from './../../../math/geometry/svgDebugWriter'
import { Point } from './../../../math/geometry/point'
import { Node } from './../../../structs/node'
test('anchor poly', () => {
  const boundary = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    50,
    10,
    30,
    new Point(12, 12),
  )
  const n = GeomNode.mkNode(boundary, new Node())
  const w = n.width / 2
  const h = n.height / 2
  const anchor = Anchor.mkAnchor(w, w, h, h, n, 0)
  const poly = anchor.polygonalBoundary
  expect(poly == null).toBe(false)
  SvgDebugWriter.dumpICurves('/tmp/anchorBound.svg', [poly, n.boundaryCurve])

})

test('anchor poly padded', () => {
  const boundary = CurveFactory.mkRectangleWithRoundedCorners(
    100,
    50,
    10,
    30,
    new Point(12, 12),
  )
  const n = GeomNode.mkNode(boundary, new Node())
  const w = n.width / 2
  const h = n.height / 2
  const anchor = Anchor.mkAnchor(w, w, h, h, n, 0)
  anchor.padding = 2
  const poly = anchor.polygonalBoundary
  expect(poly == null).toBe(false)
  SvgDebugWriter.dumpICurves('/tmp/anchorBoundPadded.svg', [poly, n.boundaryCurve])

})
