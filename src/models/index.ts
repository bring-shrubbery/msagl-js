export interface NodeLayout {
  id: string;
  layer: number;
}

export interface GraphLayout {
  layerAmount: number;
  nodes: NodeLayout[];
}
