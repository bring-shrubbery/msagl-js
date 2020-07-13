import { layer } from "./layers";

function calculateLayers(graph) {
  layer(graph);

  // Sort and extract layer value
  const nodes: string[] = graph.nodes();
  let result = nodes
    .map((nodeId) => {
      const nodeLabel = graph.node(nodeId);
      return {
        id: nodeId,
        layer: nodeLabel.rank,
      };
    })
    .sort((a, b) => a.layer - b.layer);

  // Move layers value to positive if needed
  if (result && result.length > 0 && result[0].layer < 0) {
    const value = result[0].layer * -1;
    result.forEach((node) => {
      node.layer = node.layer + value;
    });
  }

  return result;
}

export function runLayout(graph) {
  // Step 1 - Divide the nodes into layers
  let result = calculateLayers(graph);

  console.log(result);
  return graph;
}
