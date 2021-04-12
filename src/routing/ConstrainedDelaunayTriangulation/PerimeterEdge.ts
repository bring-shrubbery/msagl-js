import {Assert} from '../../utils/assert'
import {CdtEdge} from './CdtEdge'
import {CdtSite} from './CdtSite'

export class PerimeterEdge {
  Start: CdtSite

  End: CdtSite

  Prev: PerimeterEdge

  Next: PerimeterEdge

  Edge: CdtEdge

  constructor(edge: CdtEdge) {
    Assert.assert(edge.CcwTriangle == null || edge.CwTriangle == null)
    this.Edge = edge
  }
}
