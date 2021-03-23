import { from } from "linq-to-typescript";
import { mkRTree, RTree } from "../../../../core/geometry/RTree/RTree";
import { Point } from "../../../../math/geometry/point";
import { Rectangle } from "../../../../math/geometry/rectangle";
import { Assert } from "../../../../utils/assert";
import { randomInt } from "../../../../utils/random";

test('RTreeQuery_IncrementalRectangles', () => {
  const RectsCount = 1000;
  const RegionSize = 1000;
  const RectSize = 10;

  const rects = new Array<Rectangle>(RectsCount)
  for (let i = 0; i < RectsCount; ++i) {
    rects[i] = Rectangle.mkOnPoints([new Point(randomInt(RegionSize), randomInt(RegionSize))]);
  }

  // create rTree with just the first rectangle
  const l: [Rectangle, Rectangle][] = [[rects[0], rects[0]]]

  const queryTree = mkRTree<Rectangle>(from(l));

  // add remaining rectangles 10 at a time
  for (let a = 1, b = 10; b < RectsCount; a = b, b += 10) {
    for (let i = a; i < b; ++i) {
      queryTree.Add(rects[i], rects[i]);
    }
    let t = queryTree.GetAllLeaves().toArray()
    expect(t.length).toBe(b) // "did we lose leaves?");
    t = queryTree.GetAllIntersecting(new Rectangle({ left: 0, bottom: 0, right: RegionSize + RectSize, top: RegionSize + RectSize }))
    expect(t.length).toBe(b) // "are all leaves inside the max range?");
    expect(queryTree.GetAllIntersecting(new Rectangle({ left: -2, right: -2, bottom: -1, top: -1 })).length).toBe(0) // "should be no leaves inside this rectangle!");
    const query = Rectangle.mkPP(new Point(randomInt(RegionSize), randomInt(RegionSize)), new Point(randomInt(RegionSize), randomInt(RegionSize)))
    const checkList = (from(rects).take(b).where(r => query.intersects(r))).toArray();

    const checkSet = new Set<string>(checkList.map(r => r.toString()));
    const result = queryTree.GetAllIntersecting(query)
    expect(result.length).toBe(checkList.length) // "result and check are different sizes: seed={0}", seed);
    for (const r of result) {
      expect(query.intersects(r)).toBe(true)//, "rect doesn't intersect query: seed={0}, rect={1}, query={2}", seed, r, query);
      expect(checkSet.has(r.toString())).toBe(true) // "check set does not contain rect
    }
  }
})