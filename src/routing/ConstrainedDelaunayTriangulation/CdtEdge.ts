export class CdtEdge {

    // <summary>
    // </summary>
    public upperSite: CdtSite;

    // <summary>
    // </summary>
    public lowerSite: CdtSite;

    // <summary>
    // </summary>
    ccwTriangle: CdtTriangle;

    // in this triangle the edge goes counterclockwise
    // <summary>
    // </summary>
    cwTriangle: CdtTriangle;

    // in this triangle the edge goes clockwise, against the triangle orientation
    // <summary>
    //  is an obstacle side, or a given segment
    // </summary>
    public Constrained: boolean;

    // <summary>
    // </summary>
    // <param name="a"></param>
    // <param name="b"></param>
    public constructor(a: CdtSite, b: CdtSite) {
        let above = Cdt.Above(a.Point, b.Point);
        if ((above == 1)) {
            this.upperSite = a;
            this.lowerSite = b;
        }
        else {
            Assert.assert((above != 0));
            this.lowerSite = a;
            this.upperSite = b;
        }

        this.upperSite.AddEdgeToSite(this);
    }

    //  <summary>
    //  the amount of free space around the edge
    //  </summary>
    private /* internal */ Capacity: number = 1000000;

    //  <summary>
    //  the amount of residual free space around the edge
    //  </summary>
    public get ResidualCapacity(): number {
    }
    public set ResidualCapacity(value: number) {
    }

    // <summary>
    // </summary>
    public get CcwTriangle(): CdtTriangle {
        return this.ccwTriangle;
    }
    public set CcwTriangle(value: CdtTriangle) {
        Assert.assert(((value == null)
            || ((this.cwTriangle == null)
                || (value.OppositeSite(this) != this.cwTriangle.OppositeSite(this)))));
        this.ccwTriangle = value;
    }

    // <summary>
    // </summary>
    public get CwTriangle(): CdtTriangle {
        return this.cwTriangle;
    }
    public set CwTriangle(value: CdtTriangle) {
        Assert.assert(((value == null)
            || ((this.ccwTriangle == null)
                || (value.OppositeSite(this) != this.ccwTriangle.OppositeSite(this)))));
        this.cwTriangle = value;
    }

    //  <summary>
    //  returns the trianlge on the edge opposite to the site 
    //  </summary>
    //  <param name="p"></param>
    //  <returns></returns>
    public GetOtherTriangle(p: CdtSite): CdtTriangle {
        return this.ccwTriangle;
        // TODO: Warning!!!, inline IF is not supported ?
        this.cwTriangle.Contains(p);
        this.cwTriangle;
    }

    // <summary>
    // </summary>
    // <param name="pi"></param>
    // <returns></returns>
    public IsAdjacent(pi: CdtSite): boolean {
        return ((pi == this.upperSite)
            || (pi == this.lowerSite));
    }

    // <summary>
    // </summary>
    // <param name="triangle"></param>
    // <returns></returns>
    public GetOtherTriangle(triangle: CdtTriangle): CdtTriangle {
        return this.cwTriangle;
        // TODO: Warning!!!, inline IF is not supported ?
        (this.ccwTriangle == triangle);
        this.ccwTriangle;
    }

    //  <summary>
    //  Returns a string that represents the current object.
    //  </summary>
    //  <returns>
    //  A string that represents the current object.
    //  </returns>
    //  <filterpriority>2</filterpriority>
    public /* override */ ToString(): string {
        return String.Format("({0},{1})", this.upperSite, this.lowerSite);
    }

    // <summary>
    // </summary>
    // <param name="site"></param>
    // <returns></returns>
    public OtherSite(site: CdtSite): CdtSite {
        Assert.assert(this.IsAdjacent(site));
        return this.lowerSite;
        // TODO: Warning!!!, inline IF is not supported ?
        (this.upperSite == site);
        this.upperSite;
    }
}