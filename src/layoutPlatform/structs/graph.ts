import {Queue} from 'queue-typescript'
import {Assert} from '../utils/assert'
import {Edge} from './edge'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'

export class Graph extends Node {
  isEmpty() {
    return this.shallowNodeCount == 0
  }
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
  get shallowNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesShallow
  }
  get deepNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesDeep()
  }

  constructor(id = '__graph__') {
    super(id)
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
  addNode(n: Node): Node {
    Assert.assert(n.parent == null || n.parent == this)
    n.parent = this
    this.nodeCollection.addNode(n)
    return n
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

  // If n has the graph as the parent then return n,
  // otherwise set n = n.parent and repeat.
  // Return null if the node parent is above the graph.
  liftNode(n: Node): Node {
    while (n != null && n.parent != this) {
      n = <Node>n.parent
    }
    return n
  }
}

export function* shallowConnectedComponents(
  graph: Graph,
): IterableIterator<Node[]> {
  const enqueueed = new Set<Node>()
  const queue = new Queue<Node>()
  for (const n of graph.shallowNodes) {
    if (enqueueed.has(n)) continue
    const nodes = new Array<Node>()
    enqueue(n, queue, enqueueed)
    while (queue.length > 0) {
      const s = queue.dequeue()
      nodes.push(s)
      for (const neighbor of neighbors(s)) {
        enqueue(neighbor, queue, enqueueed)
      }
    }
    yield nodes
  }
  function* neighbors(n: Node): IterableIterator<Node> {
    for (const e of n.outEdges) yield e.target
    for (const e of n.inEdges) yield e.source
  }
  function enqueue(n: Node, queue: Queue<Node>, enqueueed: Set<Node>) {
    if (!enqueueed.has(n)) {
      queue.enqueue(n)
      enqueueed.add(n)
    }
  }
}
