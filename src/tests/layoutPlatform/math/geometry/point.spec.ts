import {Point} from './../../../../layoutPlatform/math/geometry/point'
import {PlaneTransformation} from './../../../../layoutPlatform/math/geometry/planeTransformation'
import {
  VertexId,
  Parallelogram,
} from './../../../../layoutPlatform/math/geometry/parallelogram'
import {GeomConstants} from './../../../../layoutPlatform/math/geometry/geomConstants'

xtest('angle test', () => {
  const eps = 0.00001
  for (const ang of [
    0,
    eps,
    2 * Math.PI - eps,
    Math.PI / 2,
    (3 * Math.PI) / 2 + eps,
    (3 * Math.PI) / 2 - eps,
    Math.PI / 3,
  ])
    for (const p of [new Point(0, 1), new Point(0, 1), new Point(20, 30)]) {
      testOnPointAngle(p, ang)
    }
})

function testOnPointAngle(p: Point, ang: number) {
  const tr = PlaneTransformation.rotation(ang)
  const p0 = tr.multiplyPoint(p)
  const ang1 = Point.angle(p, p0)
  const tr1 = PlaneTransformation.rotation(ang1)
  const p1 = tr1.multiplyPoint(p)
  const res = Point.close(p1, p0, GeomConstants.distanceEpsilon)
  if (!res) {
    console.log('p = ')
    console.log(p)
    console.log('ang = ')
    console.log(ang)
    console.log('ang1 = ')
    console.log(ang1)
    console.log('ang1 - ang')
    console.log(ang1 - ang)

    console.log('ang1 - 2*Math.PI  - ang')
    console.log(ang1 - 2 * Math.PI - ang)

    console.log(p)
    console.log(p0)
    console.log(p1)

    console.log('dist=')
    console.log(p0.sub(p1).length)
  }
  expect(res).toBeTruthy()
}

xtest('point test', () => {
  const a = 1
  const b = 2
  const c = 3.1
  const d = 5.9

  const p1: Point = new Point(a, b)
  const p2: Point = new Point(c, d)

  expect(p1.length).toBe(Math.sqrt(a * a + b * b))

  let resultPoint = p1.add(p2)
  expect(resultPoint.x).toBe(a + c)
  expect(resultPoint.y).toBe(b + d)

  resultPoint = p1.sub(p2)
  expect(resultPoint.x).toBe(a - c)
  expect(resultPoint.y).toBe(b - d)

  resultPoint = p1.mul(2)
  expect(resultPoint.x).toBe(a * 2)
  expect(resultPoint.y).toBe(b * 2)
})

xtest('parallelogram intersect test', () => {
  const pr0 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0, 0),
    new Point(1, 0),
    new Point(0, 1),
  )
  expect(pr0.corner.equal(new Point(0, 0))).toBe(true)
  expect(pr0.vertex(0).equal(pr0.corner)).toBe(true)

  const pr1 = Parallelogram.parallelogramByCornerSideSide(
    new Point(2, 0),
    new Point(1, 0),
    new Point(0, 1),
  )
  expect(Parallelogram.intersect(pr0, pr1)).toBe(false)
  const pr2 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0, 0),
    new Point(2, 0),
    new Point(0, 1),
  )
  expect(Parallelogram.intersect(pr0, pr2)).toBe(true)
  const pr3 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0, 0),
    new Point(2.0 - 0.00001, 0),
    new Point(0, 1),
  )
  expect(Parallelogram.intersect(pr1, pr3)).toBe(false)
})

xtest('parallelogram contains test', () => {
  const par = Parallelogram.parallelogramByCornerSideSide(
    new Point(0, 0),
    new Point(1, 0),
    new Point(0, 1),
  )
  const pOut = par.vertex(VertexId.otherCorner).mul(1.1)
  expect(par.contains(pOut)).toBe(false)

  const par0 = Parallelogram.parallelogramByCornerSideSide(
    new Point(1, 0),
    new Point(2, 1),
    new Point(0, 1),
  )
  const pIn = par0
    .vertex(VertexId.otherCorner)
    .add(par0.vertex(VertexId.Corner))
    .div(2)
  expect(par0.contains(pIn)).toBe(true)

  const parTwo = Parallelogram.parallelogramOfTwo(par, par0)
  for (const i of [0, 1, 2, 3]) {
    expect(parTwo.contains(par.vertex(i))).toBe(true)
    expect(parTwo.contains(par0.vertex(i))).toBe(true)
  }
})
xtest('parallelogram seg case', () => {
  const par = Parallelogram.parallelogramByCornerSideSide(
    new Point(0, 0),
    new Point(1, 0),
    new Point(1, GeomConstants.distanceEpsilon),
  )
  const par0 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0.5, 0),
    new Point(2, 1),
    new Point(2, 1),
  )
  const par1 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0.5, 0.1),
    new Point(2, 1),
    new Point(2, 1),
  )
  const par2 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0.5, -0.1),
    new Point(2, 1),
    new Point(2, 1),
  )
  const par3 = Parallelogram.parallelogramByCornerSideSide(
    new Point(0.5, -0.1 - GeomConstants.distanceEpsilon / 2),
    new Point(2, 1),
    new Point(2, 1),
  )
  expect(Parallelogram.intersect(par, par0)).toBe(true)
  expect(Parallelogram.intersect(par, par1)).toBe(false)
  expect(Parallelogram.intersect(par, par2)).toBe(true)
  expect(Parallelogram.intersect(par2, par3)).toBe(true)
})
xtest('distToLineSegment', () => {
  let a = new Point(1, 1)
  const b = new Point(0, 0)
  const c = new Point(2, 0)
  let i = Point.distToLineSegment(a, b, c)
  expect(Point.closeD(i.dist, 1)).toBe(true)
  expect(Point.closeD(i.par, 0.5)).toBe(true)
  a = new Point(-2, -10)
  i = Point.distToLineSegment(a, b, c)
  expect(Point.closeD(i.dist, a.sub(b).length)).toBe(true)
  expect(i.par == 0).toBe(true)
  a = new Point(50, 30)
  i = Point.distToLineSegment(a, b, c)
  expect(Point.closeD(i.dist, a.sub(c).length)).toBe(true)
  expect(i.par == 1).toBe(true)
})
