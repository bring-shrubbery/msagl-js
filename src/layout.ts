import { calculateLayers } from "./layers";
import { GraphLayout } from "./models";

export function runLayout(graph) {
  //**** remove edge cycles - reverse an edge in order to prevent the cycle ****//

  //**** Divide the nodes into layers ****//
  const graphLayout: GraphLayout = calculateLayers(graph);

  //**** Order ****//

  //**** Restore edge cycles ****//

  console.log(graphLayout);
  return graph;
}
