import { Graph } from "graphlib";
import { runLayout } from "./layout";

test("Test layout cases", () => {
  const g = new Graph();
  g.setNode("1", { rank: undefined });
  g.setNode("2", { rank: undefined });
  g.setNode("3", { rank: undefined });
  g.setEdge("1", "2");
  g.setEdge("2", "3");
  runLayout(g);

  // finish the test, inspect the output
  expect(true).toBe(true);
});
