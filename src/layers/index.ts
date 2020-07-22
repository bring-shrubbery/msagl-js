import { networkSimplex } from "./network-simplex";
import { GraphLayout, NodeLayout } from "../models";
import { Graph, Edge } from "graphlib";

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
function layer(g): Graph {
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

function balance(nodesLayout: NodeLayout[], graphWIthLayers: Graph): NodeLayout[] {
  const nodes: string[] = graphWIthLayers.nodes();

  const nodesWithEqualWeights = nodes.filter((nodeId) => {
    const inEdges: Edge[] = graphWIthLayers.inEdges(nodeId) || [];
    const outEdges: Edge[] = graphWIthLayers.outEdges(nodeId) || [];

    let inEdgesWeight = 0;
    let outEdgesWeight = 0;

    inEdges.forEach((edge) => {
      const edgeLabel = graphWIthLayers.edge(edge.v, edge.w);
      inEdgesWeight += edgeLabel.weight;
    });

    outEdges.forEach((edge) => {
      const edgeLabel = graphWIthLayers.edge(edge.v, edge.w);
      outEdgesWeight += edgeLabel.weight;
    });

    return outEdgesWeight === inEdgesWeight;
  });

  console.log(nodesWithEqualWeights);

  return nodesLayout;
}

export function calculateLayers(graph): GraphLayout {
  const graphWithLayers: Graph = layer(graph);
  console.log(graphWithLayers);
  let nodesLayout: NodeLayout[] = normalizeLayer(graphWithLayers);
  nodesLayout = balance(nodesLayout, graphWithLayers);

  const layerAmount = nodesLayout.length > 0 ? nodesLayout[nodesLayout.length - 1].layer + 1 : 0;
  return {
    layerAmount: layerAmount,
    nodes: nodesLayout,
  };
}
