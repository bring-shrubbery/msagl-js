import {GraphLayoutResult} from '../models';
import {Graph} from 'graphlib';
import _ = require('lodash');

function assignOrder(g: Graph, layering) {
	_.forEach(layering, function (layer) {
		_.forEach(layer, function (v, i) {
			g.node(v).order = i;
		});
	});
}

function initOrder(g) {
	const visited = {};
	const simpleNodes = _.filter(g.nodes(), function (v) {
		return !g.children(v).length;
	});
	const maxRank = _.max(
		_.map(simpleNodes, function (v) {
			return g.node(v).layer;
		}),
	);
	const layers = _.map(_.range(maxRank + 1), function () {
		return [];
	});

	function dfs(v) {
		if (_.has(visited, v)) return;
		visited[v] = true;
		const node = g.node(v);
		layers[node.layer].push(v);
		_.forEach(g.successors(v), dfs);
	}

	const orderedVs = _.sortBy(simpleNodes, function (v) {
		return g.node(v).rank;
	});
	_.forEach(orderedVs, dfs);

	return layers;
}

export function calculateOrder(graphLayoutResult: GraphLayoutResult): GraphLayoutResult {
	const layering = initOrder(graphLayoutResult.graph);
	assignOrder(graphLayoutResult.graph, layering);

	graphLayoutResult.nodeResults.forEach((node) => {
		const graphNode = graphLayoutResult.graph.node(node.id);
		node.order = graphNode.order;
	});

	return graphLayoutResult;
}
