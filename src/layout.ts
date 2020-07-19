import { calculateLayers } from "./layers";
import { GraphLayout } from "./models";

export function runLayout(graph) {
  // remove cycles

  // Divide the nodes into layers
  const graphLayout: GraphLayout = calculateLayers(graph);

  // Order

  console.log(graphLayout);
  return graph;
}
