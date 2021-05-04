import {Graph} from '../layoutPlatform/structs/graph'
import {DrawingNode, NodeAttr} from './drawingNode'
import {DrawingObject} from './drawingObject'

type GraphVisData = {
  sameRanks: string[][]
}

export class DrawingGraph extends DrawingObject {
  defaultNodeAttr: NodeAttr // it serves as a template for attributes
  graphVisData: GraphVisData = {sameRanks: new Array<string[]>()}
  get graph(): Graph {
    return this.attrCont as Graph
  }

  findNode(id: string): DrawingNode {
    const gr = this.graph
    const n = gr.findNode(id)
    if (n == null) return null
    return DrawingObject.getDrawingObj(n) as DrawingNode
  }
}
