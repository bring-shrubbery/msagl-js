import {Graph} from '../structs/graph'
import {DrawingObject} from './drawingObject'

type GraphVisData = {
  sameRanks: string[][]
}

export class DrawingGraph extends DrawingObject {
  graphVisData: GraphVisData = {sameRanks: new Array<string[]>()}
  get graph(): Graph {
    return this.attrCont as Graph
  }
}
