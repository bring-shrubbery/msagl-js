import {Edge} from './edge'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'

export class Graph extends Node {
  isCollapsed = false
  get nodes(): IterableIterator<Node> {
    return this.nodeCollection.nodes
  }
  constructor() {
    super('graph')
  }
  static mkGraph(id: string): Graph {
    const g = new Graph()
    g.id = id
    return g
  }
  get Edges() {
    return this.nodeCollection.edges
  }
  isConsistent(): boolean {
    return this.nodeCollection.isConsistent()
  }
  nodeIsConsistent(n: Node): boolean {
    return this.nodeCollection.nodeIsConsistent(n)
  }
  removeNode(n: Node): void {
    this.nodeCollection.removeNode(n)
  }
  addNode(n: Node) {
    this.nodeCollection.addNode(n)
  }
  addEdge(n: Edge) {
    this.nodeCollection.addEdge(n)
  }
  nodeCollection: NodeCollection = new NodeCollection()
  get nodeCount() {
    return this.nodeCollection.nodeCount
  }
  get edgeCount() {
    return this.nodeCollection.edgeCount
  }
}
