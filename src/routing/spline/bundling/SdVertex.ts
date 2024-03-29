﻿/*
import {VisibilityVertex} from '../../visibility/VisibilityVertex'

export class SdVertex {
  VisibilityVertex: VisibilityVertex

  InBoneEdges: Array<SdBoneEdge> = new Array<SdBoneEdge>()

  OutBoneEdges: Array<SdBoneEdge> = new Array<SdBoneEdge>()

  get Prev(): SdVertex {
    if (PrevEdge == null) {
      return null
    }
    return PrevEdge.Source == this ? PrevEdge.Target : PrevEdge.Source
  }

  PrevEdge: SdBoneEdge

  constructor(visibilityVertex: VisibilityVertex) {
    this.VisibilityVertex = visibilityVertex
  }

  Triangle: CdtTriangle

  IsSourceOfRouting: boolean
  IsTargetOfRouting: boolean

  get Point(): Point {
    return this.VisibilityVertex.point
  }

  cost: number

  get Cost(): number {
    if (this.IsSourceOfRouting) {
      return this.cost
    }
    return Prev == null ? Number.POSITIVE_INFINITY : cost
  }
  set Cost(value: number) {
    this.cost = value
  }

  public SetPreviousToNull() {
    this.PrevEdge = null
  }
}
*/
