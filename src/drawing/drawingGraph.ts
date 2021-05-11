import {Graph} from '../layoutPlatform/structs/graph'
import {DrawingNode} from './drawingNode'
import {DrawingObject} from './drawingObject'

type GraphVisData = {
  sameRanks: string[][]
  minRanks: string[]
  maxRanks: string[]
  sourceRanks: string[]
  sinkRanks: string[]
}

export class DrawingGraph extends DrawingObject {
  defaultNode: DrawingNode // this node does not belong to the graph,
  // but serves as a template for the attributes (like filledColor, style, etc.)
  graphVisData: GraphVisData = {
    sameRanks: new Array<string[]>(),
    minRanks: new Array<string>(),
    maxRanks: new Array<string>(),
    sourceRanks: new Array<string>(),
    sinkRanks: new Array<string>(),
  }
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
