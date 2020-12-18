import {calculateLayers} from './layers';
import {GraphLayoutResult} from './models';
import {removeCycles} from './cycles';
import {Graph} from 'graphlib';
import {calculateOrder} from './order';
import {setNodeCoordinates} from './nodePosition';
import {setEdges} from './edgePosition';

export function runLayout(graph: Graph) {
	// coordinates of nodes

	//**** remove edge cycles - reverse an edge in order to prevent the cycle ****//
	const noCyclesGraph: Graph = removeCycles(graph);

	//**** Divide the nodes into layers ****//
	let graphLayoutResult: GraphLayoutResult = calculateLayers(noCyclesGraph);

	//**** Order ****//
	graphLayoutResult = calculateOrder(graphLayoutResult);

	//**** Node position points ****//
	graphLayoutResult = setNodeCoordinates(graphLayoutResult);

	//**** Edge points ****//
	graphLayoutResult = setEdges(graphLayoutResult);

	//**** Restore edge cycles ****//

	console.log(graphLayoutResult);
	return graph;
}
