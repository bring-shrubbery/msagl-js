import {Graph} from '../layoutPlatform/structs/graph'
import {DrawingNode} from './drawingNode'
import {DrawingObject} from './drawingObject'

type GraphVisData = {
  sameRanks: string[][]
}

export class DrawingGraph extends DrawingObject {
  findNode(id: string): import('./drawingNode').DrawingNode {
    const gr = this.graph
    const n = gr.findNode(id)
    if (n.id == id) {
      return DrawingObject.getDrawingObj(n) as DrawingNode
    }
    return null
  }

  graphVisData: GraphVisData = {sameRanks: new Array<string[]>()}
  get graph(): Graph {
    return this.attrCont as Graph
  }
}
