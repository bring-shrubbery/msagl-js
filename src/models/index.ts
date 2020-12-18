import {Graph} from 'graphlib';
import {Point} from '../utils/geometry/point';
export interface NodeResult {
	id: string;
	layer?: number;
	order?: number;
	centerPoint?: Point;
	width: number;
	height: number;
}

export interface GraphLayoutResult {
	layerAmount: number;
	nodeResults: NodeResult[];
	graph: Graph;
}
