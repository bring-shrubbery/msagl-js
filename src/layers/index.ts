import {networkSimplex} from './network-simplex';
import {GraphLayoutResult, NodeResult} from '../models';
import {Graph} from 'graphlib';

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
function createLayers(g): Graph {
	return networkSimplex(g);
}

function normalizeLayer(graph): NodeResult[] {
	// Sort and extract layer value
	const nodes: string[] = graph.nodes();

	const nodeResult: NodeResult[] = nodes
		.map((nodeId) => {
			const nodeLabel = graph.node(nodeId);
			return {
				id: nodeId,
				layer: nodeLabel.layer,
				order: -1,
				width: nodeLabel.width,
				height: nodeLabel.height,
			};
		})
		.sort((a, b) => a.layer - b.layer);

	// Move layers value to positive if needed
	if (nodeResult && nodeResult.length > 0 && nodeResult[0].layer < 0) {
		const value = nodeResult[0].layer * -1;
		nodeResult.forEach((node) => {
			node.layer = node.layer + value;
			const graphNode = graph.node(node.id);
			graph.setNode(node.id, {...graphNode, layer: node.layer});
		});
	}

	return nodeResult;
}

function balance(nodeResult: NodeResult[]): NodeResult[] {
	/* TODO still work in progress */

	// const nodes: string[] = graphWIthLayers.nodes();

	// const nodesWithEqualWeights = nodes.filter((nodeId) => {
	//   const inEdges: Edge[] = graphWIthLayers.inEdges(nodeId) || [];
	//   const outEdges: Edge[] = graphWIthLayers.outEdges(nodeId) || [];

	//   let inEdgesWeight = 0;
	//   let outEdgesWeight = 0;

	//   inEdges.forEach((edge) => {
	//     const edgeLabel = graphWIthLayers.edge(edge.v, edge.w);
	//     inEdgesWeight += edgeLabel.weight;
	//   });

	//   outEdges.forEach((edge) => {
	//     const edgeLabel = graphWIthLayers.edge(edge.v, edge.w);
	//     outEdgesWeight += edgeLabel.weight;
	//   });

	//   return outEdgesWeight === inEdgesWeight;
	// });

	// console.log(nodesWithEqualWeights);

	return nodeResult;
}

export function calculateLayers(graph: Graph): GraphLayoutResult {
	const graphWithLayers: Graph = createLayers(graph);
	let nodeResult: NodeResult[] = normalizeLayer(graphWithLayers);
	nodeResult = balance(nodeResult);

	const layerAmount = nodeResult.length > 0 ? nodeResult[nodeResult.length - 1].layer + 1 : 0;
	return {
		layerAmount: layerAmount,
		nodeResults: nodeResult,
		graph: graphWithLayers,
	};
}
