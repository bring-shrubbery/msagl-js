import {Edge} from 'graphlib'
import {Curve} from '../../math/geometry/curve'
import {ICurve} from '../../math/geometry/icurve'
import {LineSegment} from '../../math/geometry/lineSegment'
import {Point} from '../../math/geometry/point'
import {Rectangle} from '../../math/geometry/rectangle'
import {SmoothedPolyline} from '../../math/geometry/smoothedPolyline'
import {BasicGraph} from '../../structs/BasicGraph'
import {IntPair} from '../../utils/IntPair'
import {GeomGraph} from '../core/GeomGraph'
import {Algorithm} from './../../utils/algorithm'
import {Anchor} from './anchor'
import {Database} from './Database'
import {LayerArrays} from './LayerArrays'
import {PolyIntEdge} from './polyIntEdge'
import {ProperLayeredGraph} from './ProperLayeredGraph'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'
//import { FlatEdgeRouter } from './FlatEdgeRouter'
import {CornerSite} from '../../math/geometry/cornerSite'
import {NodeKind} from './NodeKind'
import {Arrowhead} from '../core/arrowhead'
//  The class responsible for the routing of splines
export class Routing extends Algorithm {
  settings: SugiyamaLayoutSettings

  Database: Database

  IntGraph: BasicGraph<GeomNode, PolyIntEdge>

  LayerArrays: LayerArrays

  OriginalGraph: GeomGraph

  ProperLayeredGraph: ProperLayeredGraph

  constructor(
    settings: SugiyamaLayoutSettings,
    originalGraph: GeomGraph,
    dbP: Database,
    yLayerArrays: LayerArrays,
    properLayeredGraph: ProperLayeredGraph,
    intGraph: BasicGraph<GeomNode, PolyIntEdge>,
  ) {
    super(null) // todo: init with the not null canceltoken
    this.settings = this.settings
    this.OriginalGraph = originalGraph
    this.Database = dbP
    this.ProperLayeredGraph = properLayeredGraph
    this.LayerArrays = yLayerArrays
    this.IntGraph = intGraph
  }

  //  Executes the actual algorithm.
  run() {
    this.CreateSplines()
  }

  //  The method does the main work.
  CreateSplines() {
    this.CreateRegularSplines()
    this.CreateSelfSplines()
    if (this.IntGraph != null) {
      this.RouteFlatEdges()
    }
  }

  RouteFlatEdges() {
    const flatEdgeRouter = new FlatEdgeRouter(this.settings, this)
    flatEdgeRouter.run()
  }

  CreateRegularSplines() {
    for (const intEdgeList of this.Database.RegularMultiedges()) {
      // Here we try to optimize multi-edge routing
      const m = intEdgeList.length
      const optimizeShortEdges: boolean =
        m == 1 && !this.FanAtSourceOrTarget(intEdgeList[0])
      for (let i: number = Math.floor(m / 2); i < m; i++) {
        this.CreateSplineForNonSelfEdge(intEdgeList[i], optimizeShortEdges)
      }

      for (let i = Math.floor(m / 2) - 1; i >= 0; i--) {
        this.CreateSplineForNonSelfEdge(intEdgeList[i], optimizeShortEdges)
      }
    }
  }

  FanAtSourceOrTarget(intEdge: PolyIntEdge): boolean {
    return (
      this.ProperLayeredGraph.OutDegreeIsMoreThanOne(intEdge.source) ||
      this.ProperLayeredGraph.InDegreeIsMoreThanOne(intEdge.target)
    )
  }

  CreateSelfSplines() {
    for (const [k, v] of this.Database.Multiedges.keyValues()) {
      this.ProgressStep()
      const ip: IntPair = k
      if (ip.x == ip.y) {
        const anchor: Anchor = this.Database.Anchors[ip.x]
        let offset: number = anchor.LeftAnchor
        for (const intEdge of v) {
          this.ProgressStep()
          const dx: number =
            this.settings.NodeSeparation + (this.settings.MinNodeWidth + offset)
          const dy: number = anchor.BottomAnchor / 2
          const p0: Point = anchor.Origin
          const p1: Point = p0.add(new Point(0, dy))
          const p2: Point = p0.add(new Point(dx, dy))
          const p3: Point = p0.add(new Point(dx, dy * -1))
          const p4: Point = p0.add(new Point(0, dy * -1))
          let s = CornerSite.mkSiteP(p0)
          const polyline = new SmoothedPolyline(s)
          s = CornerSite.mkSiteSP(s, p1)
          s = CornerSite.mkSiteSP(s, p2)
          s = CornerSite.mkSiteSP(s, p3)
          s = CornerSite.mkSiteSP(s, p4)
          CornerSite.mkSiteSP(s, p0)
          const c: Curve = polyline.createCurve()
          intEdge.curve = c
          intEdge.edge.underlyingPolyline = polyline
          offset = dx
          if (intEdge.edge.label != null) {
            offset += intEdge.edge.label.width
            const center = (intEdge.edge.label.center = new Point(
              c.value((c.parStart + c.parEnd) / 2).x + intEdge.LabelWidth / 2,
              anchor.y,
            ))
            const del = new Point(
              intEdge.Edge.Label.Width / 2,
              intEdge.Edge.Label.Height / 2,
            )
            const box = Rectangle.mkPP(center.add(del), center.sub(del))
            intEdge.Edge.Label.BoundingBox = box
          }

          Arrowhead.trimSplineAndCalculateArrowheadsII(
            intEdge.Edge.EdgeGeometry,
            intEdge.Edge.source.BoundaryCurve,
            intEdge.Edge.target.BoundaryCurve,
            c,
            false,
          )
        }
      }
    }
  }

  CreateSplineForNonSelfEdge(es: PolyIntEdge, optimizeShortEdges: boolean) {
    this.ProgressStep()
    if (es.LayerEdges != null) {
      this.DrawSplineBySmothingThePolyline(es, optimizeShortEdges)
      if (!es.IsVirtualEdge) {
        es.updateEdgeLabelPosition(this.Database.Anchors)
        Arrowhead.trimSplineAndCalculateArrowheadsII(
          es.edge.edgeGeometry,
          es.edge.source.boundaryCurve,
          es.edge.target.boundaryCurve,
          es.curve,
          true,
        )
      }
    }
  }

  DrawSplineBySmothingThePolyline(
    edgePath: PolyIntEdge,
    optimizeShortEdges: boolean,
  ) {
    const smoothedPolyline = new SmoothedPolylineCalculator(
      edgePath,
      this.Database.Anchors,
      this.OriginalGraph,
      this.settings,
      this.LayerArrays,
      this.ProperLayeredGraph,
      this.Database,
    )
    const spline: ICurve = smoothedPolyline.GetSpline(optimizeShortEdges)
    if (edgePath.Reversed) {
      edgePath.Curve = spline.Reverse()
      edgePath.UnderlyingPolyline = smoothedPolyline.Reverse().GetPolyline
    } else {
      edgePath.Curve = spline
      edgePath.UnderlyingPolyline = smoothedPolyline.GetPolyline
    }
  }

  // void UpdateEdgeLabelPosition(LayerEdge[][] list, int i) {
  //     IntEdge e;
  //     int labelNodeIndex;
  //     if (Engine.GetLabelEdgeAndVirtualNode(list, i, out e, out labelNodeIndex)) {
  //         UpdateLabel(e, labelNodeIndex, db.Anchors);
  //     }
  // }
  static UpdateLabel(e: Edge, anchor: Anchor) {
    const labelSide: LineSegment = null
    if (anchor.LabelToTheRightOfAnchorCenter) {
      e.Label.Center = new Point(anchor.X + anchor.RightAnchor / 2, anchor.Y)
      labelSide = new LineSegment(e.LabelBBox.LeftTop, e.LabelBBox.LeftBottom)
    } else if (anchor.LabelToTheLeftOfAnchorCenter) {
      e.Label.Center = new Point(anchor.X - anchor.LeftAnchor / 2, anchor.Y)
      labelSide = new LineSegment(e.LabelBBox.RightTop, e.LabelBBox.RightBottom)
    }

    const segmentInFrontOfLabel: ICurve = Routing.GetSegmentInFrontOfLabel(
      e.Curve,
      e.Label.Center.Y,
    )
    if (segmentInFrontOfLabel == null) {
      return
    }

    if (
      Curve.GetAllIntersections(e.Curve, Curve.PolyFromBox(e.LabelBBox), false)
        .length == 0
    ) {
      const curveClosestPoint: Point
      const labelSideClosest: Point
      if (
        Routing.FindClosestPoints(
          /* out */ curveClosestPoint,
          /* out */ labelSideClosest,
          segmentInFrontOfLabel,
          labelSide,
        )
      ) {
        // shift the label if needed
        Routing.ShiftLabel(
          e,
          /* ref */ curveClosestPoint,
          /* ref */ labelSideClosest,
        )
      } else {
        // assume that the distance is reached at the ends of labelSideClosest
        const u: number = segmentInFrontOfLabel.ClosestParameter(
          labelSide.Start,
        )
        const v: number = segmentInFrontOfLabel.ClosestParameter(labelSide.End)
        if (
          (segmentInFrontOfLabel[u] - labelSide.Start).Length <
          (segmentInFrontOfLabel[v] - labelSide.End).Length
        ) {
          curveClosestPoint = segmentInFrontOfLabel[u]
          labelSideClosest = labelSide.Start
        } else {
          curveClosestPoint = segmentInFrontOfLabel[v]
          labelSideClosest = labelSide.End
        }

        Routing.ShiftLabel(
          e,
          /* ref */ curveClosestPoint,
          /* ref */ labelSideClosest,
        )
      }
    }
  }

  static ShiftLabel(
    e: Edge,
    /* ref */ curveClosestPoint: Point,
    /* ref */ labelSideClosest: Point,
  ) {
    const w: number = e.LineWidth / 2
    const shift: Point = curveClosestPoint - labelSideClosest
    const shiftLength: number = shift.Length
    //    SugiyamaLayoutSettings.Show(e.Curve, shiftLength > 0 ? new LineSegment(curveClosestPoint, labelSideClosest) : null, PolyFromBox(e.LabelBBox));
    if (shiftLength > w) {
      e.Label.Center =
        e.Label.Center + shift / (shiftLength * (shiftLength - w))
    }
  }

  static FindClosestPoints(
    /* out */ curveClosestPoint: Point,
    /* out */ labelSideClosest: Point,
    segmentInFrontOfLabel: ICurve,
    labelSide: LineSegment,
  ): boolean {
    const v: number
    const u: number
    return Curve.MinDistWithinIntervals(
      segmentInFrontOfLabel,
      labelSide,
      segmentInFrontOfLabel.ParStart,
      segmentInFrontOfLabel.ParEnd,
      labelSide.ParStart,
      labelSide.ParEnd,
      (segmentInFrontOfLabel.ParStart + segmentInFrontOfLabel.ParEnd) / 2,
      (labelSide.ParStart + labelSide.ParEnd) / 2,
      /* out */ u,
      /* out */ v,
      /* out */ curveClosestPoint,
      /* out */ labelSideClosest,
    )
  }

  static GetSegmentInFrontOfLabel(edgeCurve: ICurve, labelY: number): ICurve {
    const curve = <Curve>edgeCurve
    if (curve != null) {
      for (const seg: ICurve in curve.Segments) {
        if ((seg.Start.Y - labelY) * (seg.End.Y - labelY) <= 0) {
          return seg
        }
      }
    } else {
      Assert.assert(false)
    }

    // not implemented
    return null
  }

  static GetNodeKind(vertexOffset: number, edgePath: PolyIntEdge): NodeKind {
    return vertexOffset == 0
      ? NodeKind.Top
      : vertexOffset < edgePath.count
      ? NodeKind.Internal
      : NodeKind.Bottom
  }
}
