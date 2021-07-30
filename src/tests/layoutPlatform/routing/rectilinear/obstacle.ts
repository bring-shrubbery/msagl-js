class Obstacle {
  private static /* internal */ /* const */ FirstSentinelOrdinal = 1

  private static /* internal */ /* const */ FirstNonSentinelOrdinal = 10

  ///  <summary>
  ///  Only public to make the compiler happy about the "where TPoly : new" constraint.
  ///  Will be populated by caller.
  ///  </summary>
  public constructor(shape: Shape, makeRect: boolean, padding: number) {
    if (makeRect) {
      const paddedBox = shape.BoundingBox.Clone()
      paddedBox.Pad(padding)
      this.PaddedPolyline = Curve.PolyFromBox(paddedBox)
    } else {
      this.PaddedPolyline = InteractiveObstacleCalculator.PaddedPolylineBoundaryOfNode(
        shape.BoundaryCurve,
        padding,
      )
      //  This throws if the polyline is nonconvex.
      VisibilityGraph.CheckThatPolylineIsConvex(this.PaddedPolyline)
    }

    RoundVertices(this.PaddedPolyline)
    this.IsRectangle = this.IsPolylineRectangle()
    if (!this.IsRectangle) {
      this.ConvertToRectangleIfClose()
    }

    InputShape = shape
    Ports = new Set<Port>(InputShape.Ports)
  }
}
