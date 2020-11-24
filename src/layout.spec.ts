import { Graph } from "graphlib";
import { runLayout } from "./layout";
import { Point } from "./models";
import { addPoints } from "./utils";

xtest("Test layout cases", () => {
  const g = new Graph({ multigraph: true });
  g.setNode("1", { layer: undefined, width: 30, height: 30 });
  g.setNode("2", { layer: undefined, width: 30, height: 30 });
  g.setNode("3", { layer: undefined, width: 30, height: 30 });
  g.setNode("4", { layer: undefined, width: 30, height: 30 });
  g.setEdge("1", "2", { reversed: false });
  g.setEdge("2", "3", { reversed: false });
  g.setEdge("4", "3", { reversed: false });
  g.setEdge("3", "1", { reversed: false });

  runLayout(g);

  // finish the test, inspect the output
  expect(true).toBe(true);
});

test("add point test", () => {
  const a : number = 1; const b : number = 2; const c: number = 3.1; const d: number = 5.9;
  const p1: Point = {
    x: a,
    y: b
  };

  const p2: Point = {
    x: c,
    y: d
  };

  const resultPoint = addPoints(p1, p2);
  expect(resultPoint.x).toBe(a + c);
  expect(resultPoint.y).toBe(b + d);
});
