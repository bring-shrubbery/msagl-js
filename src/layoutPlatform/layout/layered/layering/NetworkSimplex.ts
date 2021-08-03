import {String} from 'typescript-string-operations'
import {LayerCalculator} from './layerCalculator'
import {LongestPathLayering} from './longestPathLayering'
import {
  BasicGraphOnEdges,
  mkGraphOnEdgesN,
} from '../../../structs/basicGraphOnEdges'
import {CancelToken} from '../../../utils/cancelToken'
import {from} from 'linq-to-typescript'
import {Assert} from '../../../utils/assert'
import {NetworkEdge} from './networkEdge'
import {Stack} from 'stack-typescript'
import {randomInt} from '../../../utils/random'
import {PolyIntEdge} from '../polyIntEdge'
import {GeomConstants} from '../../../math/geometry/geomConstants'

function CreateGraphWithIEEdges(
  bg: BasicGraphOnEdges<PolyIntEdge>,
): BasicGraphOnEdges<NetworkEdge> {
  const ieEdges = new Array<NetworkEdge>()

  for (const e of bg.edges) ieEdges.push(new NetworkEdge(e))

  return mkGraphOnEdgesN(ieEdges, bg.nodeCount)
}

type VertexInfo = {
  inTree: boolean
  lim: number
  low: number
  parent: NetworkEdge
}

class StackStruct {
  v: number
  outEnum: NetworkEdge[]
  i: number // points to outEnum
  inEnum: NetworkEdge[]
  j: number // points to inEnum
  constructor(
    v: number,
    outEnum: NetworkEdge[],
    i: number, // points to outEnum
    inEnum: NetworkEdge[],
    j: number, // points to inEnum
  ) {
    this.v = v
    this.outEnum = outEnum
    this.i = i
    this.inEnum = inEnum
    this.j = j
  }
}

// The implementation follows "A technique for Drawing Directed Graphs", Gansner, Koutsofios, North, Vo.
export class NetworkSimplex implements LayerCalculator {
  // fields
  layers: number[] = null
  graph: BasicGraphOnEdges<NetworkEdge>
  networkCancelToken: CancelToken
  treeVertices: number[] = []
  vertices: VertexInfo[] = []
  leaves: number[] = []

  get weight(): number {
    return from(this.graph.edges)
      .select((e) => e.weight * (this.layers[e.source] - this.layers[e.target]))
      .sum()
  }
  get nodeCount() {
    return this.vertices.length
  }

  setLow(v: number, l: number): void {
    this.vertices[v].low = l
  }

  setLim(v: number, l: number): void {
    this.vertices[v].lim = l
  }

  setParent(v: number, e: NetworkEdge): void {
    this.vertices[v].parent = e
  }

  constructor(graph: BasicGraphOnEdges<PolyIntEdge>, cancelToken: CancelToken) {
    this.graph = CreateGraphWithIEEdges(graph)

    this.networkCancelToken = cancelToken
    for (let i = 0; i < this.graph.nodeCount; i++) {
      this.vertices.push({
        inTree: false,
        lim: -1,
        low: -1,
        parent: null,
      })
    }
  }

  GetLayers() {
    if (this.layers == null) this.run()

    return this.layers
  }

  shiftLayerToZero() {
    const minLayer = Math.min(...this.layers)
    for (let i = 0; i < this.layers.length; i++) this.layers[i] -= minLayer
  }

  addVertexToTree(v: number) {
    this.vertices[v].inTree = true
  }

  vertexInTree(v: number): boolean {
    return this.vertices[v].inTree
  }

  lim(v: number): number {
    return this.vertices[v].lim
  }

  low(v: number): number {
    return this.vertices[v].low
  }

  parent(v: number): NetworkEdge {
    return this.vertices[v].parent
  }

  // The function feasibleTree constructs an initial feasible spanning tree.
  feasibleTree() {
    this.initLayers()

    while (this.tightTree() < this.nodeCount) {
      const e: NetworkEdge = this.getNonTreeEdgeIncidentToTheTreeWithMinimalAmountOfSlack()
      if (e == null) break //all edges are tree edges
      let slack = this.slack(e)
      Assert.assert(slack != 0, 'the tree should be tight')

      if (this.vertexInTree(e.source)) slack = -slack

      //shift the tree rigidly up or down and make e tight
      // since the slack is minimal the layering remains feasible
      for (const i of this.treeVertices) this.layers[i] += slack
    }

    this.initCutValues()
  }

  // A treeEdge, belonging to the tree, divides the vertices to source and target components
  // If v belongs to the source component we return 1
  // otherwise we return 0
  vertexSourceTargetVal(v: number, treeEdge: NetworkEdge) {
    Assert.assert(treeEdge.inTree)
    const s = treeEdge.source
    const t = treeEdge.target
    if (this.lim(s) > this.lim(t))
      if (this.lim(v) <= this.lim(t) && this.low(t) <= this.lim(v))
        //s belongs to the tree root component
        return 0
      else return 1
    //t belongs to the tree root component
    else if (this.lim(v) <= this.lim(s) && this.low(s) <= this.lim(v)) return 1
    else return 0
  }

  // a convenient wrapper of IncEdges incident to v
  incidentEdges(v: number): IterableIterator<NetworkEdge> {
    return this.graph.incidentEdges(v)
  }

  allLowCutsHaveBeenDone(v: number) {
    for (const ie of this.incidentEdges(v))
      if (ie.inTree && ie.cut == NetworkEdge.infinity && ie != this.parent(v))
        return false
    return true
  }

  // treeEdge, belonging to the tree, divides the vertices to source and target components
  // e does not belong to the tree . If e goes from the source component to target component
  // then the return value is 1,
  // if e goes from the target component ot the source then the return value is -1
  // otherwise return zero

  edgeSourceTargetVal(e: NetworkEdge, treeEdge: NetworkEdge): number {
    // if (e.inTree || treeEdge.inTree == false)
    // throw new Exception("wrong params for EdgeSOurceTargetVal");

    return (
      this.vertexSourceTargetVal(e.source, treeEdge) -
      this.vertexSourceTargetVal(e.target, treeEdge)
    )
  }

  // initCutValues computes the cut values of the tree edges.
  // For each tree edge, this is computed by marking the nodes as belonging to the source or
  // target component, and then performing the sum of the signed weights of all
  // edges whose source and target are in different components, the sign being negative for those edges
  // going from the source to the target component.
  // To reduce this cost, we note that the cut values can be computed using information local to an edge
  // if the search is ordered from the leaves of the feasible tree inward. It is trivial to compute the
  // cut value of a tree edge with one of its endpoints a leaf in the tree,
  // since either the source or the target component consists of a single node.
  // Now, assuming the cut values are known for all the edges incident on a given
  // node except one, the cut value of the remaining edge is the sum of the known cut
  // values plus a term dependent only on the edges incident to the given node.
  initCutValues() {
    this.initLimLowAndParent()

    //going up from the leaves following parents
    let front = new Stack<number>()
    for (const i of this.leaves) front.push(i)
    let newFront = new Stack<number>()
    while (front.length > 0) {
      while (front.length > 0) {
        const w = front.pop()
        const cutEdge = this.parent(w)
        if (cutEdge == null) continue
        let cut = 0
        for (const e of this.incidentEdges(w)) {
          if (e.inTree == false) {
            const e0Val = this.edgeSourceTargetVal(e, cutEdge)
            if (e0Val != 0) cut += e0Val * e.weight
          } //e0 is a tree edge
          else {
            if (e == cutEdge) cut += e.weight
            else {
              const impact =
                cutEdge.source == e.target || cutEdge.target == e.source
                  ? 1
                  : -1
              const edgeContribution = this.edgeContribution(e, w)
              cut += edgeContribution * impact
            }
          }
        }

        cutEdge.cut = cut
        const v = cutEdge.source == w ? cutEdge.target : cutEdge.source
        if (this.allLowCutsHaveBeenDone(v)) newFront.push(v)
      }
      //swap new front and front
      const t = front
      front = newFront
      newFront = t
    }
  }

  // e is a tree edge for which the cut has been calculted already.
  // EdgeContribution gives an amount that edge e brings to the cut of parent(w).
  // The contribution is the cut value minus the weight of e. Let S be the component of e source.
  // We should also substruct W(ie) for every ie going from S to w and add W(ie) going from w to S.
  // These numbers appear in e.cut but with opposite signs.

  edgeContribution(e: NetworkEdge, w: number): number {
    let ret = e.cut - e.weight
    for (const ie of this.incidentEdges(w)) {
      if (ie.inTree == false) {
        const sign = this.edgeSourceTargetVal(ie, e)
        if (sign == -1) ret += ie.weight
        else if (sign == 1) ret -= ie.weight
      }
    }
    return ret
  }

  // A quote:
  // Another valuable optimization, similar to a technique described in [Ch],
  // is to perform a postorder traversal of the tree, starting from some fixed
  // root node vroot, and labeling each node v with its postorder
  // traversal number lim(v), the least number low(v) of any descendant in the search,
  // and the edge parent(v) by which the node was reached (see figure 2-5).
  // This provides an inexpensive way to test whether a node lies in the
  // source or target component of a tree edge, and thus whether a non-tree edge
  // crosses between the two components. For example, if e = (u,v) is a
  // tree edge and vroot is in the source component of the edge (i.e., lim(u) less lim(v)),
  // then a node w is in the target component of e if and only if low(u) is less or equal than lim(w)
  // is less or equal than lim(u). These numbers can also be used to update the tree efficiently
  // during the network simplex iterations. If f = (w,x) is the entering edge, the
  // only edges whose cut values must be adjusted are those in the path
  // connecting w and x in the tree. This path is determined by following
  // the parent edges back from w and x until the least common ancestor is reached,
  // i.e., the first node l such that low(l) is less or equal lim(w) than ,
  // lim(x) is less or equal than lim(l).
  // Of course, these postorder parameters must also be adjusted when
  // exchanging tree edges, but only for nodes below l.
  initLimLowAndParent() {
    this.initLowLimParentAndLeavesOnSubtree(1, 0)
  }
  // initializes lim and low in the subtree

  initLowLimParentAndLeavesOnSubtree(curLim: number, v: number) {
    const stack = new Stack<StackStruct>()
    let outEnum = this.graph.outEdges[v]
    let i = -1
    let inEnum = this.graph.inEdges[v]
    let j = -1
    stack.push(new StackStruct(v, outEnum, i, inEnum, j)) //vroot is 0 here
    this.vertices[v].low = curLim

    while (stack.length > 0) {
      const ss = stack.pop()
      v = ss.v
      outEnum = ss.outEnum
      i = ss.i
      inEnum = ss.inEnum
      j = ss.j
      //for sure we will have a descendant with the lowest number curLim since curLim may only grow
      //from the current value

      let done: boolean
      do {
        done = true
        while (++i < outEnum.length) {
          const e = outEnum[i]
          if (!e.inTree || this.vertices[e.target].low > 0) continue
          stack.push(new StackStruct(v, outEnum, i, inEnum, j))
          v = e.target
          this.setParent(v, e)
          this.setLow(v, curLim)
          outEnum = this.graph.outEdges[v]
          i = -1
          inEnum = this.graph.inEdges[v]
          j = -1
        }
        while (++j < inEnum.length) {
          const e = inEnum[j]
          if (!e.inTree || this.vertices[e.source].low > 0) {
            continue
          }
          stack.push(new StackStruct(v, outEnum, i, inEnum, j))
          v = e.source
          this.setLow(v, curLim)
          this.setParent(v, e)
          outEnum = this.graph.outEdges[v]
          i = -1
          inEnum = this.graph.inEdges[v]
          j = -1
          done = false
          break
        }
      } while (!done)

      //finally done with v
      this.setLim(v, curLim++)
      if (this.lim(v) == this.low(v)) this.leaves.push(v)
    }
  }

  // here we update values lim and low for the subtree with the root l

  updateLimLowLeavesAndParentsUnderNode(l: number) {
    //first we zero all low values in the subtree since they are an indication when positive that
    //the node has been processed
    //We are updating leaves also
    const llow = this.vertices[l].low
    const llim = this.vertices[l].lim

    this.leaves = []

    for (let i = 0; i < this.nodeCount; i++) {
      if (llow <= this.vertices[i].lim && this.vertices[i].lim <= llim)
        this.setLow(i, 0)
      else if (this.low(i) == this.lim(i)) this.leaves.push(i)
    }

    this.initLowLimParentAndLeavesOnSubtree(llow, l)
  }

  slack(e: NetworkEdge): number {
    const ret = this.layers[e.source] - this.layers[e.target] - e.separation
    Assert.assert(
      ret >= -GeomConstants.tolerance,
      'separation is not satisfied',
    )
    return ret
  }

  // one of the returned edge vertices does not belong to the tree but another does
  getNonTreeEdgeIncidentToTheTreeWithMinimalAmountOfSlack(): NetworkEdge {
    let eret = null
    let minSlack = NetworkEdge.infinity

    for (const v of this.treeVertices) {
      for (const e of this.graph.outEdges[v]) {
        if (this.vertexInTree(e.source) && this.vertexInTree(e.target)) continue
        const slack = this.slack(e)
        if (slack < minSlack) {
          eret = e
          minSlack = slack
          if (slack == 1) return e
        }
      }

      for (const e of this.graph.inEdges[v]) {
        if (this.vertexInTree(e.source) && this.vertexInTree(e.target)) continue
        const slack = this.slack(e)
        if (slack < minSlack) {
          eret = e
          minSlack = slack
          if (slack == 1) return e
        }
      }
    }
    return eret
  }

  // The function TightTree finds a maximal tree of tight edges containing
  // some fixed node and returns the number of nodes in the tree.
  // Note that such a maximal tree is just a spanning tree for the subgraph
  // induced by all nodes reachable from the fixed node in the underlying
  // undirected graph using only tight edges. In particular, all such trees have the same number of nodes.
  // The function also builds the tree. It returns the number of verices in the tight tree
  tightTree(): number {
    this.treeVertices = []
    for (const ie of this.graph.edges) ie.inTree = false

    for (let i = 1; i < this.nodeCount; i++) this.vertices[i].inTree = false

    //the vertex 0 is a fixed node
    this.vertices[0].inTree = true
    this.treeVertices.push(0)
    const q = new Stack<number>()
    q.push(0)
    while (q.length > 0) {
      const v = q.pop()

      for (const e of this.graph.outEdges[v]) {
        if (this.vertexInTree(e.target)) continue

        if (this.layers[e.source] - this.layers[e.target] == e.separation) {
          q.push(e.target)
          this.addVertexToTree(e.target)
          this.treeVertices.push(e.target)
          e.inTree = true
        }
      }

      for (const e of this.graph.inEdges[v]) {
        if (this.vertexInTree(e.source)) continue

        if (this.layers[e.source] - this.layers[e.target] == e.separation) {
          q.push(e.source)
          this.addVertexToTree(e.source)
          this.treeVertices.push(e.source)
          e.inTree = true
        }
      }
    }
    return this.treeVertices.length
  }

  // leaveEnterEdge finds a non-tree edge to replace e.
  // This is done by breaking the tree, by removing e, into
  // the source and the target componentx.
  // All edges going from the source component to the
  // target are considered for the replacement, and an edge with the minimum
  // slack being chosen. This maintains feasibility.
  leaveEnterEdge(): {leaving: NetworkEdge; entering: NetworkEdge} {
    let leavingEdge: NetworkEdge
    let enteringEdge: NetworkEdge
    let minCut = 0
    for (const e of this.graph.edges) {
      if (e.inTree) {
        if (e.cut < minCut) {
          minCut = e.cut
          leavingEdge = e
        }
      }
    }

    if (leavingEdge == null) return null

    //now we are looking for a non-tree edge with a minimal slack belonging to TS
    let continuation = false
    let minSlack = NetworkEdge.infinity
    for (const f of this.graph.edges) {
      const slack = this.slack(f)
      if (
        f.inTree == false &&
        this.edgeSourceTargetVal(f, leavingEdge) == -1 &&
        (slack < minSlack ||
          (slack == minSlack && (continuation = randomInt(2) == 1)))
      ) {
        minSlack = slack
        enteringEdge = f
        if (minSlack == 0 && !continuation) break
        continuation = false
      }
    }

    if (enteringEdge == null) {
      throw new Error()
    }
    return {leaving: leavingEdge, entering: enteringEdge}
  }

  // If f = (w,x) is the entering edge, the
  // only edges whose cut values must be adjusted are those in the path
  // connecting w and x in the tree, excluding e. This path is determined by
  // following the parent edges back from w and x until the least common ancestor is
  // reached, i.e., the first node l such that low(l) less or equal lim(w) ,lim(x) less or equal lim(l).
  // Of course, these postorder parameters must also be adjusted when
  // exchanging tree edges, but only for nodes below l.
  // e - exiting edge, f - entering edge
  exchange(e: NetworkEdge, f: NetworkEdge) {
    const l = this.commonPredecessorOfSourceAndTargetOfF(f)
    this.createPathForCutUpdates(e, f, l)
    this.updateLimLowLeavesAndParentsUnderNode(l)

    this.updateCuts(e)

    this.updateLayersUnderNode(l)
  }

  updateLayersUnderNode(l: number) {
    //update the layers under l
    const front = new Stack<number>()
    front.push(l)

    //set layers to infinity under l
    for (let i = 0; i < this.nodeCount; i++)
      if (this.low(l) <= this.lim(i) && this.lim(i) <= this.lim(l) && i != l)
        this.layers[i] = NetworkEdge.infinity

    while (front.length > 0) {
      const u = front.pop()
      for (const oe of this.graph.outEdges[u]) {
        if (oe.inTree && this.layers[oe.target] == NetworkEdge.infinity) {
          this.layers[oe.target] = this.layers[u] - oe.separation
          front.push(oe.target)
        }
      }
      for (const ie of this.graph.inEdges[u]) {
        if (ie.inTree && this.layers[ie.source] == NetworkEdge.infinity) {
          this.layers[ie.source] = this.layers[u] + ie.separation
          front.push(ie.source)
        }
      }
    }
  }

  updateCuts(e: NetworkEdge): void {
    //going up from the leaves of the branch following parents
    let front = new Stack<number>()
    let newFront = new Stack<number>()

    //We start cut updates from the vertices of e. It will work only if in the new tree
    // the  parents of the vertices of e are end edges on the path connecting the two vertices.
    //Let  e be (w,x) and let f be (u,v). Let T be the tree containing e but no f,
    //and T0 be the tree without with e but containg f. Let us consider the path with no edge repetitions from u to v in T.
    //It has to contain e since there is a path from u to v in T containing e, because v lies in the component of w in T
    //and u lies in the component of x in T, if there is a path without e then we have a cycle in T.
    // Now if we romove e from this path and add f to it we get a path without edge repetitions connecting w to x.
    // The edge adjacent in this path to w is parent(w) in T0, and the edge of the path adjacent to x is
    //parent(x) in T0. If it is not true then we can get a cycle by constructing another path from w to x going up through the
    //parents to the common ancessor of w and x.

    front.push(e.source)
    front.push(e.target)

    while (front.length > 0) {
      while (front.length > 0) {
        const w = front.pop()

        const cutEdge = this.parent(w) //have to find the cut of cutEdge

        if (cutEdge == null) continue

        if (cutEdge.cut != NetworkEdge.infinity) continue //the value of this cut has not been changed
        let cut = 0
        for (const ce of this.incidentEdges(w)) {
          if (ce.inTree == false) {
            cut += this.edgeSourceTargetVal(ce, cutEdge) * ce.weight
          } //e0 is a tree edge
          else {
            if (ce == cutEdge) cut += ce.weight
            else {
              const impact =
                cutEdge.source == ce.target || cutEdge.target == ce.source
                  ? 1
                  : -1
              const edgeContribution = this.edgeContribution(ce, w)
              cut += edgeContribution * impact
            }
          }
        }

        cutEdge.cut = cut
        const u = cutEdge.source == w ? cutEdge.target : cutEdge.source
        if (this.allLowCutsHaveBeenDone(u)) newFront.push(u)
      }
      //swap newFrontAndFront
      const t = front
      front = newFront
      newFront = t
    }
  }

  createPathForCutUpdates(e: NetworkEdge, f: NetworkEdge, l: number) {
    //we mark the path by setting the cut value to infinity

    let v = f.target
    while (v != l) {
      const p = this.parent(v)
      p.cut = NetworkEdge.infinity
      v = p.source == v ? p.target : p.source
    }

    f.cut = NetworkEdge.infinity //have to do it because f will be in the path between end points of e in the new tree

    //remove e from the tree and put f inside of it
    e.inTree = false
    f.inTree = true
  }

  commonPredecessorOfSourceAndTargetOfF(f: NetworkEdge): number {
    //find the common predecessor of f.source and f.target
    let fMin: number, fmax: number
    if (this.lim(f.source) < this.lim(f.target)) {
      fMin = this.lim(f.source)
      fmax = this.lim(f.target)
    } else {
      fMin = this.lim(f.target)
      fmax = this.lim(f.source)
    }
    //it is the best to walk up from the highest of nodes f
    //but we don't know the depths
    //so just start walking up from the source
    let l = f.source

    while ((this.low(l) <= fMin && fmax <= this.lim(l)) == false) {
      const p = this.parent(l)
      p.cut = NetworkEdge.infinity
      l = p.source == l ? p.target : p.source
    }
    return l
  }

  checkCutValues() {
    for (const e of this.graph.edges) {
      if (e.inTree) {
        let cut = 0
        for (const f of this.graph.edges) {
          cut += this.edgeSourceTargetVal(f, e) * f.weight
        }
        if (e.cut != cut)
          console.log(
            String.Format(
              'cuts are wrong for {0}; should be {1} but is {2}',
              e,
              cut,
              e.cut,
            ),
          )
      }
    }
  }

  initLayers(): number[] {
    const lp = new LongestPathLayering(this.graph)
    return (this.layers = lp.GetLayers())
  }

  run() {
    if (this.graph.edges.length == 0 && this.graph.nodeCount == 0) {
      this.layers = []
    } else {
      this.feasibleTree()

      let leaveEnter: {leaving: NetworkEdge; entering: NetworkEdge}
      while ((leaveEnter = this.leaveEnterEdge()) != null) {
        this.exchange(leaveEnter.leaving, leaveEnter.entering)
      }

      this.shiftLayerToZero()
    }
  }
}
