import {Edge} from './edge'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'

export class Graph extends Node {
  setEdge(sourceId: string, targetId: string): Edge {
    const s = this.nodeCollection.find(sourceId)
    if (s == null) return
    const t = this.nodeCollection.find(targetId)
    if (t == null) return
    const e = new Edge(s, t, this)
    this.addEdge(e)
    return e
  }
  isCollapsed = false
  get shallowNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesShallow
  }
  get deepNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesDeep()
  }

  constructor(parent: Graph) {
    super('graph', parent)
  }
  static mkGraph(id: string, parent: Graph): Graph {
    const g = new Graph(parent)
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
  get shallowNodeCount() {
    return this.nodeCollection.nodeShallowCount
  }

  get nodeCountDeep() {
    return this.nodeCollection.nodeDeepCount
  }

  get edgeCount() {
    return this.nodeCollection.edgeCount
  }
}
