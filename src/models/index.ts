import { Graph } from "graphlib";

export interface NodeResult {
  id: string;
  layer?: number;
  order?: number;
  centerPoint?: Point;
}

export interface GraphLayoutResult {
  layerAmount: number;
  nodeResults: NodeResult[];
  graph: Graph;
}

export interface Point {
  x: number;
  y: number;
}
