import {Interval} from '../../core/geometry/Interval'
import {RTree} from '../../core/geometry/RTree/RTree'
import {Point} from '../../math/geometry/point'
import {Size} from '../../math/geometry/rectangle'

export class MstLineSweeper {
  _proximityEdges: Array<[number, number, number, number, number]>

  _nodeSizes: Size[]

  _nodePositions: Point[]

  _forLayers: boolean

  _intervalTree: RTree<number, number>

  _q: BinaryHeapPriorityQueue

  _numberOfOverlaps = 0

  public constructor(
    proximityEdges: List<Tuple<number, number, number, number, number>>,
    nodeSizes: Size[],
    nodePositions: Point[],
    forLayers: boolean,
  ) {
    this._proximityEdges = proximityEdges
    this._nodeSizes = nodeSizes
    this._nodePositions = nodePositions
    this._forLayers = forLayers
    Debug.Assert(nodePositions.Length == nodeSizes.Length)
    this._q = new BinaryHeapPriorityQueue(nodeSizes.Length * 2)
  }

  public Run(): number {
    this.InitQueue()
    this.FindOverlaps()
    return this._numberOfOverlaps
  }

  FindOverlaps() {
    while (this._q.Count > 0) {
      let i: number = this._q.Dequeue()
      if (i < this._nodePositions.Length) {
        this.FindOverlapsWithInterval(i)
        this.AddIntervalToTree(i)
      } else {
        i = i - this._nodePositions.Length
        this.RemoveIntervalFromTree(i)
      }
    }
  }

  RemoveIntervalFromTree(i: number) {
    this._intervalTree.Remove(this.GetInterval(i), i)
  }

  AddIntervalToTree(i: number) {
    const interval = this.GetInterval(i)
    if (this._intervalTree == null) {
      this._intervalTree = new RTree<number, number>()
    }

    this._intervalTree.Add(interval, i)
  }

  FindOverlapsWithInterval(i: number) {
    if (this._intervalTree == null) {
      return
    }

    const interval = this.GetInterval(i)
    for (const j: number in this._intervalTree.GetAllIntersecting(interval)) {
      const tuple = GTreeOverlapRemoval.GetIdealEdgeLength(
        i,
        j,
        this._nodePositions[i],
        this._nodePositions[j],
        this._nodeSizes,
        this._forLayers,
      )
      if (!(tuple.Item3 > 1)) {
        return
      }

      this._proximityEdges.Add(tuple)
      this._numberOfOverlaps++
    }
  }

  GetInterval(i: number): Interval {
    const w = this._nodeSizes[i].Width / 2
    const nodeCenterX = this._nodePositions[i].X
    return new Interval(nodeCenterX - w, nodeCenterX + w)
  }

  InitQueue() {
    for (let i = 0; i < this._nodeSizes.Length; i++) {
      const h = this._nodeSizes[i].Height / 2
      const nodeCenterY = this._nodePositions[i].Y
      this._q.Enqueue(i, nodeCenterY - h)
      //  enqueue the bottom event
      this._q.Enqueue(this._nodeSizes.Length + i, nodeCenterY + h)
      //  enqueue the top event
    }
  }
}
