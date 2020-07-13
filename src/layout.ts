import { layer } from "./layers";
import { NodeLayout, GraphLayout } from "./models";

function calculateLayers(graph): GraphLayout {
  layer(graph);

  // Sort and extract layer value
  const nodes: string[] = graph.nodes();
  let nodesLayout: NodeLayout[] = nodes
    .map((nodeId) => {
      const nodeLabel = graph.node(nodeId);
      return {
        id: nodeId,
        layer: nodeLabel.rank,
      };
    })
    .sort((a, b) => a.layer - b.layer);

  // Move layers value to positive if needed
  if (nodesLayout && nodesLayout.length > 0 && nodesLayout[0].layer < 0) {
    const value = nodesLayout[0].layer * -1;
    nodesLayout.forEach((node) => {
      node.layer = node.layer + value;
    });
  }

  const layerAmount = nodesLayout.length > 0 ? nodesLayout[nodesLayout.length - 1].layer + 1 : 0;
  return {
    layerAmount: layerAmount,
    nodes: nodesLayout,
  };
}

export function runLayout(graph) {
  // Step 1 - Divide the nodes into layers
  const graphLayout = calculateLayers(graph);

  console.log(graphLayout);
  return graph;
}
