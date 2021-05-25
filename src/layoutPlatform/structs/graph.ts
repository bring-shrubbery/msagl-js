import {Edge} from './edge'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'

export class Graph extends Node {
  setEdge(sourceId: string, targetId: string): Edge {
    const s = this.nodeCollection.find(sourceId)
    if (s == null) return
    const t = this.nodeCollection.find(targetId)
    if (t == null) return
    const e = new Edge(s, t)
    this.addEdge(e)
    return e
  }
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
  findNode(id: string): Node {
    return this.nodeCollection.find(id)
  }
  get edges() {
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
