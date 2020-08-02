import { Graph } from "graphlib";

export interface NodeLayout {
  id: string;
  layer: number;
  order: number;
}

export interface GraphLayoutResult {
  layerAmount: number;
  nodes: NodeLayout[];
  graph: Graph;
}
