import {DebugCurve} from '../../math/geometry/debugCurve'
import {LineSegment} from '../../math/geometry/lineSegment'
import {Point} from '../../math/geometry/point'
import {Cdt} from '../../routing/ConstrainedDelaunayTriangulation/Cdt'
import {CdtEdge} from '../../routing/ConstrainedDelaunayTriangulation/CdtEdge'
import {CdtSite} from '../../routing/ConstrainedDelaunayTriangulation/CdtSite'
import {
  BasicGraphOnEdges,
  mkGraphOnEdgesN,
} from '../../structs/basicGraphOnEdges'
import {IEdge} from '../../structs/iedge'
import {IntPair} from '../../utils/IntPair'
import {IntPairMap} from '../../utils/IntPairMap'

//  Computes the minimum spanning tree on a triangulation or on a set of edges given by a list of tuples
export class MstOnDelaunayTriangulation {
  //  Computes the minimum spanning tree on a set of edges
  GetMstOnTuple(
    proximityEdges: Array<[number, number, number, number]>,
    size: number,
  ): Array<[number, number, number, number]> {
    if (proximityEdges.length == 0) {
      return null
    }

    const intPairs = proximityEdges.map((t) => new IntPair(t[0], t[1]))

    const weighting = new IntPairMap<[number, number, number, number]>(
      intPairs.length,
    )
    for (let i = 0; i < proximityEdges.length; i++) {
      weighting.setPair(intPairs[i], proximityEdges[i])
    }

    const graph = mkGraphOnEdgesN<IntPair>(intPairs, size)

    const mstOnBasicGraph = new MinimumSpanningTreeByPrim(
      graph,
      () => {},
      weighting[<IntPair>intPair].Item5,
      intPairs[0].First,
    )
    const treeEdges: List<[number, number, number, number]> = mstOnBasicGraph
      .GetTreeEdges()
      .Select(() => {}, weighting[<IntPair>e])
      .ToList()
    return treeEdges
  }

  //  Computes the minimum spanning tree on a DT with given weights.
  private static /* internal */ GetMstOnCdt(
    cdt: Cdt,
    weights: Func<CdtEdge, number>,
  ): List<CdtEdge> {
    const siteArray = cdt.PointsToSites.Values.ToArray()
    const siteIndex = new Dictionary<CdtSite, number>()
    for (let i = 0; i < siteArray.Length; i++) {
      siteIndex[siteArray[i]] = i
    }

    const intPairsToCdtEdges: Dictionary<
      IntPair,
      CdtEdge
    > = MstOnDelaunayTriangulation.GetEdges(siteArray, siteIndex)
    const graph = new BasicGraphOnEdges<IEdge>(
      intPairsToCdtEdges.Keys,
      siteArray.Length,
    )
    const mstOnBasicGraph = new MinimumSpanningTreeByPrim(
      graph,
      () => {},
      weights(intPairsToCdtEdges[<IntPair>intPair]),
      0,
    )
    return new List<CdtEdge>(
      mstOnBasicGraph
        .GetTreeEdges()
        .Select(() => {}, intPairsToCdtEdges[<IntPair>e]),
    )
  }

  static GetEdges(
    siteArray: CdtSite[],
    siteIndex: Dictionary<CdtSite, number>,
  ): Dictionary<IntPair, CdtEdge> {
    const d = new Dictionary<IntPair, CdtEdge>()
    for (let i = 0; i < siteArray.Length; i++) {
      const site = siteArray[i]
      const sourceIndex = siteIndex[site]
      for (const e in site.Edges) {
        d[new IntPair(sourceIndex, siteIndex[e.lowerSite])] = e
      }
    }

    return d
  }

  //
  public static Test() {
    const count = 100
    const random = new Random(3)
    const points = new List<Point>()
    for (let i = 0; i < count; i++) {
      points.Add(20 * new Point(random.NextDouble(), random.NextDouble()))
    }

    const cdt = new Cdt(points, null, null)
    cdt.Run()
    const ret = MstOnDelaunayTriangulation.GetMstOnCdt(
      cdt,
      () => {},
      (e.lowerSite.Point - e.upperSite.Point).Length,
    )
    const l = new List<DebugCurve>()
    for (const s in cdt.PointsToSites.Values) {
      for (const e in s.Edges) {
        l.Add(
          new DebugCurve(
            100,
            0.1,
            'black',
            new LineSegment(e.lowerSite.Point, e.upperSite.Point),
          ),
        )
      }
    }

    for (const e in ret) {
      l.Add(
        new DebugCurve(
          100,
          0.12,
          'red',
          new LineSegment(e.lowerSite.Point, e.upperSite.Point),
        ),
      )
    }

    //          LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
  }
}
