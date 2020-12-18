import {Point} from './utils/geometry/point';
import {VertexId, vertex, intersect, parallelogramByCornerSideSide, parallelogramOfTwo} from './utils/geometry/parallelogram';

test('point test', () => {
	const a = 1;
	const b = 2;
	const c = 3.1;
	const d = 5.9;

	const p1: Point = new Point(a, b);
	const p2: Point = new Point(c, d);

	console.log(p1.length());
	expect(p1.length()).toBe(Math.sqrt(a * a + b * b));

	let resultPoint = p1.add(p2);
	expect(resultPoint.x).toBe(a + c);
	expect(resultPoint.y).toBe(b + d);

	resultPoint = p1.minus(p2);
	expect(resultPoint.x).toBe(a - c);
	expect(resultPoint.y).toBe(b - d);

	resultPoint = p1.mult(2);
	expect(resultPoint.x).toBe(a * 2);
	expect(resultPoint.y).toBe(b * 2);
});

test('parallelogram intersect test', () => {
	const pr0 = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(0, 1));
	expect(pr0.corner.equal(new Point(0, 0))).toBe(true);
	expect(vertex(pr0, 0).equal(pr0.corner)).toBe(true);

	const pr1 = parallelogramByCornerSideSide(new Point(2, 0), new Point(1, 0), new Point(0, 1));
	expect(intersect(pr0, pr1)).toBe(false);
	const pr2 = parallelogramByCornerSideSide(new Point(0, 0), new Point(2, 0), new Point(0, 1));
	expect(intersect(pr0, pr2)).toBe(true);
	const pr3 = parallelogramByCornerSideSide(new Point(0, 0), new Point(2.0 - 0.00001, 0), new Point(0, 1));
	expect(intersect(pr1, pr3)).toBe(false);
});

test('parallelogram contains test', () => {
	const par = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(0, 1));
	const pOut = vertex(par, VertexId.otherCorner).mult(1.1);
	expect(par.contains(pOut)).toBe(false);

	const par0 = parallelogramByCornerSideSide(new Point(1, 0), new Point(2, 1), new Point(0, 1));
	const pIn = vertex(par0, VertexId.otherCorner).add(vertex(par0, VertexId.Corner)).div(2);
	expect(par0.contains(pIn)).toBe(true);

	const parTwo = parallelogramOfTwo(par, par0);
	for (const i of [0, 1, 2, 3]) {
		expect(parTwo.contains(vertex(par, i))).toBe(true);
		expect(parTwo.contains(vertex(par0, i))).toBe(true);
	}
});
test('parallelogram seg case', () => {
	const par = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(1, Point.distanceEpsilon));
	const par0 = parallelogramByCornerSideSide(new Point(0.5, 0), new Point(2, 1), new Point(2, 1));
	const par1 = parallelogramByCornerSideSide(new Point(0.5, 0.1), new Point(2, 1), new Point(2, 1));
	const par2 = parallelogramByCornerSideSide(new Point(0.5, -0.1), new Point(2, 1), new Point(2, 1));
	const par3 = parallelogramByCornerSideSide(new Point(0.5, -0.1 - Point.distanceEpsilon / 2), new Point(2, 1), new Point(2, 1));
	expect(intersect(par, par0)).toBe(true);
	expect(intersect(par, par1)).toBe(false);
	expect(intersect(par, par2)).toBe(true);
	expect(intersect(par2, par3)).toBe(true);
});
