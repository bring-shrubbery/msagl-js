import { calculateLayers } from "./layers";
import { GraphLayout } from "./models";
import { removeCycles } from "./cycles";

export function runLayout(graph) {
  //**** remove edge cycles - reverse an edge in order to prevent the cycle ****//
  const noCyclesGraph = removeCycles(graph);

  //**** Divide the nodes into layers ****//
  const graphLayout: GraphLayout = calculateLayers(noCyclesGraph);

  //**** Order ****//

  //**** Node position points ****//

  //**** Edge points ****//

  //**** Restore edge cycles ****//

  console.log(graphLayout);
  return graph;
}
