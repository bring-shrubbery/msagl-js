import { Graph } from "graphlib";

export interface NodeResult {
  id: string;
  layer?: number;
  order?: number;
  centerPoint?: Point;
  width: number,
  height: number
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

export interface Segment {
  start: number;
  end: number;
}

export class Curve {
  start: number;
  end: number;

  public getPoint(num: number): Point {
    return {
      x: 0,
      y: 0
    }
  }
}
