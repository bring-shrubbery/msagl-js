import { networkSimplex } from "./network-simplex";
import { GraphLayout, NodeLayout } from "../models";

/*
 * Assigns a layer to each node in the input graph that respects the "minlen"
 * constraint specified on edges between nodes.
 *
 * This basic structure is derived from Gansner, et al., "A Technique for
 * Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a connected DAG
 *    2. Graph nodes must be objects
 *    3. Graph edges must have "weight" and "minlen" attributes
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have a "layer" attribute based on the results of the
 *       algorithm. layers can start at any index (including negative), we'll
 *       fix them up later.
 */
function layer(g) {
  return networkSimplex(g);
}

function normalizeLayer(graph): NodeLayout[] {
  // Sort and extract layer value
  const nodes: string[] = graph.nodes();

  let nodesLayout: NodeLayout[] = nodes
    .map((nodeId) => {
      const nodeLabel = graph.node(nodeId);
      return {
        id: nodeId,
        layer: nodeLabel.layer,
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

  return nodesLayout;
}

export function calculateLayers(graph): GraphLayout {
  const layerGraph = layer(graph);
  console.log(layerGraph);
  const nodesLayout = normalizeLayer(layerGraph);

  const layerAmount = nodesLayout.length > 0 ? nodesLayout[nodesLayout.length - 1].layer + 1 : 0;
  return {
    layerAmount: layerAmount,
    nodes: nodesLayout,
  };
}
