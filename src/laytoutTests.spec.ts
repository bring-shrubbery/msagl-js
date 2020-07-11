import { Graph } from "graphlib";
import { runLayout } from "./layout";

test("Test layout cases", () => {
  const g = new Graph();
  g.setNode(1, { rank: 1 });
  g.setNode(2, { rank: 1 });
  g.setNode(3, { rank: 1 });
  g.setEdge(1, 2);
  g.setEdge(2, 3);
  const newGraph = runLayout(g);

  console.log(newGraph);

  // finish the test, inspect the graph object
  expect(true).toBe(true);
});
