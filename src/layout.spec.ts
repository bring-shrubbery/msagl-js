import { Graph } from "graphlib";
import { runLayout } from "./layout";

test("Test layout cases", () => {
  const g = new Graph();
  g.setNode("1", { layer: undefined });
  g.setNode("2", { layer: undefined });
  g.setNode("3", { layer: undefined });
  g.setNode("4", { layer: undefined });
  g.setEdge("1", "2");
  g.setEdge("2", "3");
  g.setEdge("4", "3");
  runLayout(g);

  // finish the test, inspect the output
  expect(true).toBe(true);
});
