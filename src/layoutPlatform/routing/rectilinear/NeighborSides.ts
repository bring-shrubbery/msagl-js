import {Direction} from '../../math/geometry/direction'
import {RBNode} from '../../structs/RBTree/rbNode'
import {BasicObstacleSide} from './BasicObstacleSide'
import {StaticGraphUtility} from './StaticGraphUtility'

export class NeighborSides {
  ///  <summary>
  ///  The HighObstacleSide of the low neighbor.
  ///  </summary>
  LowNeighbor: RBNode<BasicObstacleSide>

  ///  <summary>
  ///  Dereferences the node if non-null to return the side Item.
  ///  </summary>
  get LowNeighborSide(): BasicObstacleSide {
    return this.LowNeighbor == null ? null : this.LowNeighbor.item
  }

  ///  <summary>
  ///  A LowObstacleSide that we pass through in the low direction into open space.
  ///  </summary>
  LowOverlapEnd: RBNode<BasicObstacleSide>

  ///  <summary>
  ///  A group that we pass through toward the low neighbor.  Avoids reflections going through group boundaries.
  ///  </summary>
  GroupSideInterveningBeforeLowNeighbor: BasicObstacleSide

  ///  <summary>
  ///  The LowObstacleSide of the high neighbor.
  ///  </summary>
  HighNeighbor: RBNode<BasicObstacleSide>

  ///  <summary>
  ///  Dereferences the node if non-null to return the side Item.
  ///  </summary>
  HighNeighborSide(): BasicObstacleSide {
    return this.HighNeighbor == null ? null : this.HighNeighbor.item
  }

  ///  <summary>
  ///  A HighObstacleSide that we pass through in the high direction into open space.
  ///  </summary>
  HighOverlapEnd: RBNode<BasicObstacleSide>

  ///  <summary>
  ///  A group that we pass through toward the high neighbor.  Avoids reflections going through group boundaries.
  ///  </summary>
  GroupSideInterveningBeforeHighNeighbor: BasicObstacleSide

  Clear() {
    this.LowNeighbor = null
    this.LowOverlapEnd = null
    this.GroupSideInterveningBeforeLowNeighbor = null
    this.HighNeighbor = null
    this.HighOverlapEnd = null
    this.GroupSideInterveningBeforeHighNeighbor = null
  }

  SetSides(
    dir: Direction,
    neighborNode: RBNode<BasicObstacleSide>,
    overlapEndNode: RBNode<BasicObstacleSide>,
    interveningGroupSide: BasicObstacleSide,
  ) {
    if (StaticGraphUtility.IsAscending(dir)) {
      this.HighNeighbor = neighborNode
      this.HighOverlapEnd = overlapEndNode
      this.GroupSideInterveningBeforeHighNeighbor = interveningGroupSide
      return
    }

    this.LowNeighbor = neighborNode
    this.LowOverlapEnd = overlapEndNode
    this.GroupSideInterveningBeforeLowNeighbor = interveningGroupSide
  }
}
