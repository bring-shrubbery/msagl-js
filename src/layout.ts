import { calculateLayers } from "./layers";
import { GraphLayoutResult } from "./models";
import { removeCycles } from "./cycles";
import { Graph } from "graphlib";
import { calculateOrder } from "./order";

export function runLayout(graph) {
  //**** remove edge cycles - reverse an edge in order to prevent the cycle ****//
  const noCyclesGraph: Graph = removeCycles(graph);

  //**** Divide the nodes into layers ****//
  let graphLayoutResult: GraphLayoutResult = calculateLayers(noCyclesGraph);

  //**** Order ****//
  graphLayoutResult = calculateOrder(graphLayoutResult); 

  //**** Node position points ****//

  //**** Edge points ****//

  //**** Restore edge cycles ****//

  console.log(graphLayoutResult);
  return graph;
}
