import {Point} from '../../math/geometry/point'
import {closeDistEps} from '../../utils/compare'
import {VisibilityVertex} from '../visibility/VisibilityVertex'
import {ScanSegment} from './ScanSegment'
import {SsstRectilinearPath} from './SsstRectilinearPath'
import {VertexEntry} from './VertexEntry'
import {VisibilityVertexRectilinear} from './VisibilityVertexRectiline'

export class MsmtRectilinearPath {
  private bendPenaltyAsAPercentageOfDistance: number =
    SsstRectilinearPath.DefaultBendPenaltyAsAPercentageOfDistance

  //  Temporary for accumulating target entries.
  private currentPassTargetEntries: VertexEntry[] = new Array(4)

  public constructor(bendPenalty: number) {
    this.bendPenaltyAsAPercentageOfDistance = bendPenalty
  }

  ///  <summary>
  ///  Get the lowest-cost path from one of one or more sources to one of one or more targets, without waypoints.
  ///  </summary>
  ///  <param name="sources">One or more source vertices</param>
  ///  <param name="targets">One or more target vertices</param>
  ///  <returns>A single enumeration of path points.</returns>
  GetPath(
    sources: Array<VisibilityVertex>,
    targets: Array<VisibilityVertex>,
  ): Array<Point> {
    const t = {entry: this.GetPathStage(null, sources, null, targets)}
    return SsstRectilinearPath.RestorePathV(t)
  }

  ///  <summary>
  ///  Route a single stage of a possibly multi-stage (due to waypoints) path.
  ///  </summary>
  ///  <param name="sourceVertexEntries">The VertexEntry array that was in the source vertex if it was the target of a prior stage.</param>
  ///  <param name="sources">The enumeration of source vertices; must be only one if sourceVertexEntries is non-null.</param>
  ///  <param name="targets">The enumeration of target vertex entries; must be only one if targetVertexEntries is non-null.</param>
  ///  <param name="targetVertexEntries">The VertexEntry array that is in the target at the end of the stage.</param>
  private GetPathStage(
    sourceVertexEntries: VertexEntry[],
    sources: Array<VisibilityVertex>,
    targetVertexEntries: VertexEntry[],
    targets: Array<VisibilityVertex>,
  ): VertexEntry {
    const ssstCalculator = new SsstRectilinearPath()
    const t: {bestEntry: VertexEntry; bestCost: number} = {
      bestEntry: null,
      //  This contains the best (lowest) path cost after normalizing origins to the center of the sources
      //  and targets.  This is used to avoid selecting a vertex pair whose path has more bends than another pair of
      //  vertices, but the bend penalty didn't total enough to offset the additional length between the "better" pair.
      //  This also plays the role of an upper bound on the path length; if a path cost is greater than adjustedMinCost
      //  then we stop exploring it, which saves considerable time after low-cost paths have been found.
      bestCost: Number.MAX_VALUE / ScanSegment.OverlappedWeight,
    }
    let bestPathCostRatio: number = Number.POSITIVE_INFINITY
    //  Calculate the bend penalty multiplier.  This is a percentage of the distance between the source and target,
    //  so that we have the same relative importance if we have objects of about size 20 that are about 100 apart
    //  as for objects of about size 200 that are about 1000 apart.
    const sourceCenter: Point = MsmtRectilinearPath.Barycenter(sources)
    const targetCenter: Point = MsmtRectilinearPath.Barycenter(targets)
    const distance = SsstRectilinearPath.ManhattanDistance(
      sourceCenter,
      targetCenter,
    )
    ssstCalculator.BendsImportance = Math.max(
      0.001,
      distance * (this.bendPenaltyAsAPercentageOfDistance * 0.01),
    )
    //  We'll normalize by adding (a proportion of) the distance (only; not bends) from the current endpoints to
    //  their centers. This is similar to routeToCenter, but routing multiple paths like this means we'll always
    //  get at least a tie for the best vertex pair, whereas routeToCenter can introduce extraneous bends
    //  if the sources/targets are not collinear with the center (such as an E-R diagram).
    //  interiorLengthAdjustment is a way to decrease the cost adjustment slightly to allow a bend if it saves moving
    //  a certain proportion of the distance parallel to the object before turning to it.
    const interiorLengthAdjustment = ssstCalculator.LengthImportance
    //  VertexEntries for the current pass of the current stage, if multistage.
    const tempTargetEntries =
      targetVertexEntries != null ? this.currentPassTargetEntries : null
    //  Process closest pairs first, so we can skip longer ones (jump out of SsstRectilinear sooner, often immediately).
    //  This means that we'll be consistent on tiebreaking for equal scores with differing bend counts (the shorter
    //  path will win).  In overlapped graphs the shortest path may have more higher-weight edges.
    const stPairs: Array<[VisibilityVertex, VisibilityVertex]> = []
    for (const s of sources) for (const t of targets) stPairs.push([s, t])
    stPairs.sort(([a, b], [c, d]) => md(a, b) - md(c, d))
    for (const [sv, tv] of stPairs) {
      if (Point.closeDistEps(sv.point, tv.point)) {
        continue
      }
      const sourceCostAdjustment =
        mdP(sv, sourceCenter) * interiorLengthAdjustment
      const targetCostAdjustment =
        mdP(tv, targetCenter) * interiorLengthAdjustment

      let adjustedBestCost = t.bestCost
      if (targetVertexEntries != null) {
        for (let i = 0; i < tempTargetEntries.length; i++) {
          tempTargetEntries[i] = null
        }
        adjustedBestCost = ssstCalculator.MultistageAdjustedCostBound(
          t.bestCost,
        )
      }
      const lastEntry = ssstCalculator.GetPathWithCost(
        sourceVertexEntries,
        <VisibilityVertexRectilinear>sv,
        sourceCostAdjustment,
        tempTargetEntries,
        <VisibilityVertexRectilinear>tv,
        targetCostAdjustment,
        adjustedBestCost,
      )
      if (tempTargetEntries != null) {
        MsmtRectilinearPath.UpdateTargetEntriesForEachDirection(
          targetVertexEntries,
          tempTargetEntries,
          t,
        )
        continue
      }

      // This is the final (or only) stage. Break ties by picking the lowest ratio of cost to ManhattanDistance between the endpoints.
      if (lastEntry == null) {
        continue
      }
      const costRatio = lastEntry.Cost / md(sv, tv)
      if (
        lastEntry.Cost < t.bestCost ||
        (closeDistEps(lastEntry.Cost, t.bestCost) &&
          costRatio < bestPathCostRatio)
      ) {
        t.bestCost = lastEntry.Cost
        t.bestEntry = lastEntry
        bestPathCostRatio = lastEntry.Cost / md(sv, tv)
      }
    }
    return t.bestEntry
    function md(s: VisibilityVertex, t: VisibilityVertex): number {
      return SsstRectilinearPath.ManhattanDistance(s.point, t.point)
    }
    function mdP(s: VisibilityVertex, t: Point): number {
      return SsstRectilinearPath.ManhattanDistance(s.point, t)
    }
  }

  private static UpdateTargetEntriesForEachDirection(
    targetVertexEntries: VertexEntry[],
    tempTargetEntries: VertexEntry[],
    t: {
      bestCost: number
      bestEntry: VertexEntry
    },
  ) {
    for (let ii = 0; ii < tempTargetEntries.length; ii++) {
      const tempEntry = tempTargetEntries[ii]
      if (tempEntry == null) {
        continue
      }

      if (
        targetVertexEntries[ii] == null ||
        tempEntry.Cost < targetVertexEntries[ii].Cost
      ) {
        targetVertexEntries[ii] = tempEntry
        if (tempEntry.Cost < t.bestCost) {
          //  This does not have the ratio tiebreaker because the individual stage path is only used as a success indicator.
          t.bestCost = tempEntry.Cost
          t.bestEntry = tempEntry
        }
      }
    }

    return
  }

  private static Barycenter(vertices: Array<VisibilityVertex>): Point {
    let center = new Point(0, 0)
    for (const vertex of vertices) {
      center = center.add(vertex.point)
    }

    return center.div(vertices.length)
  }
}
