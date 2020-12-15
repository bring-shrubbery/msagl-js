import { Point } from "./utils/geometry/point";
import {vertex, intersect, parallelogramByCornerSideSide} from "./utils/geometry/parallelogram";

test("point test", () => {
  const a : number = 1; 
  const b : number = 2; 
  const c: number = 3.1; 
  const d: number = 5.9;

  const p1: Point = new Point(a, b);
  const p2: Point = new Point(c, d);

  console.log(p1.length);
  expect(p1.length()).toBe(Math.sqrt(a*a+b*b))

  var resultPoint = p1.add(p2);
  expect(resultPoint.x).toBe(a + c);
  expect(resultPoint.y).toBe(b + d);

  resultPoint = p1.min(p2);
  expect(resultPoint.x).toBe(a - c);
  expect(resultPoint.y).toBe(b - d);

  resultPoint = p1.mult(2);
  expect(resultPoint.x).toBe(a*2);
  expect(resultPoint.y).toBe(b*2); 
  
  let pr0 =  parallelogramByCornerSideSide(new Point(0, 0),new Point(1, 0), new Point(0, 1) );
  expect(pr0.corner.equal(new Point(0,0))).toBe(true); 
  expect(vertex(pr0, 0).equal(pr0.corner)).toBe(true); 
  
  let pr1 =  parallelogramByCornerSideSide(new Point(2, 0),new Point(1, 0), new Point(0, 1) );
  expect(intersect(pr0, pr1)).toBe(false);
  let pr2 =  parallelogramByCornerSideSide(new Point(0, 0),new Point(2, 0), new Point(0, 1) );
  expect(intersect(pr0, pr2)).toBe(true); 
  let pr3 =  parallelogramByCornerSideSide(new Point(0, 0),new Point(2.0-0.00001, 0), new Point(0, 1) );
  expect(intersect(pr1, pr3)).toBe(false); 
  
});

