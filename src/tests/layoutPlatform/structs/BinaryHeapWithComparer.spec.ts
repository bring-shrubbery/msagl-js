import {LineSegment} from '../../../layoutPlatform/math/geometry/lineSegment'
import {Point} from '../../../layoutPlatform/math/geometry/point'
import {BinaryHeapWithComparer} from '../../../layoutPlatform/structs/BinaryHeapWithComparer'

test('lines', () => {
  const short = LineSegment.mkPP(new Point(0, 0), new Point(1, 0))
  const medium = LineSegment.mkPP(new Point(0, 0), new Point(2, 0))
  const long = LineSegment.mkPP(new Point(0, 0), new Point(6, 0))
  const bh = new BinaryHeapWithComparer<LineSegment>(
    (a, b) => a.length - b.length,
  )
  bh.Enqueue(long)
  bh.Enqueue(short)
  bh.Enqueue(medium)
  bh.Enqueue(medium)
  let t = bh.Dequeue()
  expect(t).toBe(short)
  t = bh.Dequeue()
  expect(t).toBe(medium)
  t = bh.Dequeue()
  expect(t).toBe(medium)
  t = bh.Dequeue()
  expect(t).toBe(long)
})
