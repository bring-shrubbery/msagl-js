import { BasicGraphOnEdges } from './basicGraphOnEdges'
import { IEdge } from './iedge'

export class BasicGraph<TNode> extends BasicGraphOnEdges {
  nodes: TNode[]
  constructor(edges: IEdge[], numberOfVerts: number) {
    super()
    this.setEdges(edges, numberOfVerts)
  }
}
