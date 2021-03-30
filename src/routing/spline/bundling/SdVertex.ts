import { VisibilityVertex } from "../../visibility/VisibilityVertex";

export class SdVertex {

    VisibilityVertex: VisibilityVertex;

    InBoneEdges: Array<SdBoneEdge> = new Array<SdBoneEdge>();

    OutBoneEdges: Array<SdBoneEdge> = new Array<SdBoneEdge>();

    get Prev(): SdVertex {
        if ((PrevEdge == null)) {
            return null;
        }

        return PrevEdge.Target;
        // TODO: Warning!!!, inline IF is not supported ?
        (PrevEdge.Source == this);
        PrevEdge.Source;
    }

    PrevEdge: SdBoneEdge

    constructor(visibilityVertex: VisibilityVertex) {
        this.VisibilityVertex = visibilityVertex;
    }

    Triangle: CdtTriangle;

    get IsSourceOfRouting(): boolean {
    }
    set IsSourceOfRouting(value: boolean) {
    }

    get IsTargetOfRouting(): boolean {
    }
    set IsTargetOfRouting(value: boolean) {
    }

    get Point(): Point {
        return this.VisibilityVertex.Point;
    }

    cost: number;

    get Cost(): number {
        if (this.IsSourceOfRouting) {
            return this.cost;
        }

        return double.PositiveInfinity;
        // TODO: Warning!!!, inline IF is not supported ?
        (this.Prev == null);
        this.cost;
    }
    set Cost(value: number) {
        this.cost = value;
    }

    public SetPreviousToNull() {
        this.PrevEdge = null;
    }
}