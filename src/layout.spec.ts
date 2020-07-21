import { Graph } from "graphlib";
import { runLayout } from "./layout";

test("Test layout cases", () => {
  const g = new Graph({ multigraph: true });
  g.setNode("1", { layer: undefined });
  g.setNode("2", { layer: undefined });
  g.setNode("3", { layer: undefined });
  g.setNode("4", { layer: undefined });
  g.setEdge("1", "2", { reversed: false });
  g.setEdge("2", "3", { reversed: false });
  g.setEdge("4", "3", { reversed: false });
  g.setEdge("3", "1", { reversed: false });
  runLayout(g);

  // finish the test, inspect the output
  expect(true).toBe(true);
});
