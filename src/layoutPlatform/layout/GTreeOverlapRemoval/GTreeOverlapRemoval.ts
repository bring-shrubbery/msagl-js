import { CurveFactory } from "../../math/geometry/curveFactory"
import { DebugCurve } from "../../math/geometry/debugCurve"
import { LineSegment } from "../../math/geometry/lineSegment"
import { Point } from "../../math/geometry/point"
import { Size, Rectangle } from "../../math/geometry/rectangle"
import { Cdt } from "../../routing/ConstrainedDelaunayTriangulation/Cdt"
import { CdtSite } from "../../routing/ConstrainedDelaunayTriangulation/CdtSite"
import { Edge } from "../../structs/edge"
import { GeomNode } from "../core/geomNode"
import { MstLineSweeper } from "./MstLineSweeper"
import { MstOnDelaunayTriangulation } from "./MstOnDelaunayTriangulation"
import { OverlapRemovalSettings } from "./OverlapRemovalSettings"

//  Overlap Removal using Minimum Spanning Tree on the delaunay triangulation. The edge weight corresponds to the amount of overlap between two nodes.
class GTreeOverlapRemoval {
_settings:OverlapRemovalSettings
  
  _overlapForLayers: boolean;

  lastRunNumberIterations: number;

  _nodes: GeomNode[];

  //  Settings to be used for the overlap removal, not all of them are used.
  public constructor(settings: OverlapRemovalSettings, nodes: GeomNode[]) {
    this._settings = settings;
    this._nodes = nodes;
  }

  
  //  Removes the overlap by using the default settings.
  public static RemoveOverlaps(nodes: GeomNode[], nodeSeparation: number) {
    const settings = new OverlapRemovalSettings()
    settings.      RandomizeAllPointsOnStart = true
     settings. NodeSeparation = nodeSeparation
    let mst = new GTreeOverlapRemoval(settings, nodes);
    mst.RemoveOverlaps();
  }

  //  Removes the overlaps for the given graph.
  public RemoveOverlaps() {
    if (this._nodes.length < 3) {
      this.RemoveOverlapsOnTinyGraph();
      return;
    }
    const nodePositions:Point[] = []
    const nodeSizes:Size[] = []
    const t = { nodePositions: nodePositions, nodeSizes: nodeSizes}
    InitNodePositionsAndBoxes(this._settings, this._nodes, t)
    
    this.lastRunNumberIterations = 0;
    while (this.OneIteration(nodePositions, nodeSizes, false)) {
      this.lastRunNumberIterations++;
    }

    while (this.OneIteration(nodePositions, nodeSizes, true)) {
      this.lastRunNumberIterations++;
    }

    for (let i: number = 0; i < this._nodes.length; i++) {
      this._nodes[i].center = nodePositions[i];
    }

  }

  RemoveOverlapsOnTinyGraph() {
    if ((this._nodes.length == 1)) {
      return;
    }

    if ((this._nodes.length == 2)) {
      const a = this._nodes[0];
      const b = this._nodes[1]
      if (Point.closeDistEps(a.center, b.center)) {
        b.center = b.center.add(new Point(0.001, 0))
      }

      const idealDist = this.GetIdealDistanceBetweenTwoNodes(a, b);
      const o = Point.middle(a.center, b.center)
      let dir = a.center.sub(b.center)
      let dist = dir.length;
      dir = dir.mul(0.5* (idealDist / dist))
      a.center = o.add(dir);
      b.center = o.sub(dir);
    }
  }

  GetIdealDistanceBetweenTwoNodes(a: GeomNode, b: GeomNode): number {
        #if(SHARPKIT)
    let abox = a.boundingBox.clone();
    let bbox = b.boundingBox.clone();
        #else
    let abox = a.boundingBox;
    let bbox = b.boundingBox;
        #endif
    abox.pad((_settings.NodeSeparation / 2));
    bbox.pad((_settings.NodeSeparation / 2));
    let ac = abox.center;
    let bc = bbox.center;
    let ab = (ac - bc);
    let dx: number = Math.abs(ab.X);
    let dy: number = Math.abs(ab.Y);
    let wx: number = ((abox.width / 2)
      + (bbox.width / 2));
    let wy: number = ((abox.height / 2)
      + (bbox.height / 2));
    const let machineAcc: number = 1E-16;
    let t: number;
    if ((dx
      < (machineAcc * wx))) {
      t = (wy / dy);
    }
    else if ((dy
      < (machineAcc * wy))) {
      t = (wx / dx);
    }
    else {
      t = Math.min((wx / dx), (wy / dy));
    }

    return (t * ab.Length);
  }

  static AvgEdgeLength(nodes: GeomNode[]): number {
    let i: number = 0;
    let avgEdgeLength: number = 0;
    for (let edge: Edge in nodes.SelectMany(() => { }, n.OutEdges)) {
      let sPoint: Point = edge.Source.Center;
      let tPoint: Point = edge.Target.Center;
      let euclid: number = (sPoint - tPoint).Length;
      avgEdgeLength = (avgEdgeLength + euclid);
      i++;
    }

    if ((i == 0)) {
      return 1;
    }

    i;
    return avgEdgeLength;
  }

  //  Does one iterations in which a miniminum spanning tree is 
  //  determined on the delaunay triangulation and finally the tree is exanded to resolve the overlaps.
  OneIteration(nodePositions: Point[], nodeSizes: Size[], scanlinePhase: boolean): boolean {
        #if(SHARPKIT)
    let ts = new Array(nodePositions.length);
    for (let i: number = 0; (i < nodePositions.length); i++) {
      ts[i] = Tuple.Create(nodePositions[i], (<Object>(i)));
    }

    let cdt = new Cdt(ts);
        #else
    let cdt = new Cdt(() => { }, Tuple.Create(p, (<Object>(index))));
        #endif
    cdt.run();
    let siteIndex = new Dictionary<CdtSite, number>();
    for (let i: number = 0; (i < nodePositions.length); i++) {
      siteIndex[cdt.PointsToSites[nodePositions[i]]] = i;
    }

    let numCrossings: number = 0;
    let proximityEdges: List<Tuple<number, number, number, number, number>> = new List<Tuple<number, number, number, number, number>>();
    for (let site in cdt.PointsToSites.values) {
      for (let edge in site.Edges) {
        let point1: Point = edge.upperSite.Point;
        let point2: Point = edge.lowerSite.Point;
        let nodeId1 = siteIndex[edge.upperSite];
        let nodeId2 = siteIndex[edge.lowerSite];
        Debug.Assert(ApproximateComparer.Close(point1, nodePositions[nodeId1]));
        Debug.Assert(ApproximateComparer.Close(point2, nodePositions[nodeId2]));
        let tuple = GTreeOverlapRemoval.GetIdealEdgeLength(nodeId1, nodeId2, point1, point2, nodeSizes, this._overlapForLayers);
        proximityEdges.Add(tuple);
        if ((tuple.Item3 > 1)) {
          numCrossings++;
        }

      }

    }

    if (((numCrossings == 0)
      || scanlinePhase)) {
      let additionalCrossings: number = this.FindProximityEdgesWithSweepLine(proximityEdges, nodeSizes, nodePositions);
      if (((numCrossings == 0)
        && (additionalCrossings == 0))) {
        //                     if(nodeSizes.Length>100)
        //                     ShowAndMoveBoxesRemoveLater(null, proximityEdges, nodeSizes, nodePositions, -1);
        return false;
      }

      if (((numCrossings == 0)
        && !scanlinePhase)) {
        return false;
      }

    }

    let treeEdges = MstOnDelaunayTriangulation.GetMstOnTuple(proximityEdges, nodePositions.length);
    let rootId: number = treeEdges.First().Item1;
    GTreeOverlapRemoval.MoveNodePositions(treeEdges, nodePositions, rootId);
    return true;
  }

  FindProximityEdgesWithSweepLine(proximityEdges: List<Tuple<number, number, number, number, number>>, nodeSizes: Size[], nodePositions: Point[]): number {
    let mstLineSweeper: MstLineSweeper = new MstLineSweeper(proximityEdges, nodeSizes, nodePositions, this._overlapForLayers);
    return mstLineSweeper.Run();
  }

  //  Returns a tuple representing an edge with: nodeId1, nodeId2, t(overlapFactor), ideal distance, edge weight.
  private /* internal */ static GetIdealEdgeLength(nodeId1: number, nodeId2: number, point1: Point, point2: Point, nodeSizes: Size[], forLayers: boolean): Tuple<number, number, number, number, number> {
    let t: number;
    let idealDist: number = GTreeOverlapRemoval.GetIdealEdgeLength(nodeId1, nodeId2, point1, point2, nodeSizes, /* out */t);
    let length: number = (point1 - point2).Length;
    let box2: Rectangle;
    let box1: Rectangle;
    if (forLayers) {
      let maxId: number = Math.max(nodeId1, nodeId2);
      box1 = new Rectangle(nodeSizes[maxId], point1);
      box2 = new Rectangle(nodeSizes[maxId], point2);
    }
    else {
      box1 = new Rectangle(nodeSizes[nodeId1], point1);
      box2 = new Rectangle(nodeSizes[nodeId2], point2);
    }

    let distBox = GTreeOverlapRemoval.GetDistanceRects(box1, box2);
    let weight: number;
    if ((t > 1)) {
      weight = ((idealDist - length)
        * -1);
    }
    else {
      weight = distBox;
    }

    let smallId: number = nodeId1;
    let bigId: number = nodeId2;
    if ((nodeId1 > nodeId2)) {
      smallId = nodeId2;
      bigId = nodeId1;
    }

    return Tuple.Create(smallId, bigId, t, idealDist, weight);
  }

  //  Returns the ideal edge length, such that the overlap is removed.
  static GetIdealEdgeLength(nodeId1: number, nodeId2: number, point1: Point, point2: Point, nodeBoxes: Size[], /* out */tRes: number): number {
    if ((nodeBoxes == null)) {
      throw new ArgumentNullException("nodeBoxes");
    }

    const let expandMax: number = 1.5;
    const let expandMin: number = 1;
    // todo: replace machineAcc with global epsilon method in MSAGL
    const let machineAcc: number = 1E-16;
    let dist: number = (point1 - point2).Length;
    let dx: number = Math.abs((point1.x - point2.x));
    let dy: number = Math.abs((point1.y - point2.y));
    let wx: number = ((nodeBoxes[nodeId1].width / 2)
      + (nodeBoxes[nodeId2].width / 2));
    let wy: number = ((nodeBoxes[nodeId1].height / 2)
      + (nodeBoxes[nodeId2].height / 2));
    let t: number;
    if ((dx
      < (machineAcc * wx))) {
      t = (wy / dy);
    }
    else if ((dy
      < (machineAcc * wy))) {
      t = (wx / dx);
    }
    else {
      t = Math.min((wx / dx), (wy / dy));
    }

    if ((t > 1)) {
      t = Math.max(t, 1.001);
    }

    //  must be done, otherwise the convergence is very slow
    t = Math.min(expandMax, t);
    t = Math.max(expandMin, t);
    tRes = t;
    return (t * dist);
  }

  //  Returns the distance between two given rectangles or zero if they intersect.
  static GetDistanceRects(a: Rectangle, b: Rectangle): number {
    if (a.intersects(b)) {
      return 0;
    }

    let dy: number = 0;
    let dx: number = 0;
    if ((a.right < b.left)) {
      dx = (a.left - b.right);
    }
    else if ((b.right < a.left)) {
      dx = (a.left - b.right);
    }

    if ((a.top < b.bottom)) {
      dy = (b.bottom - a.top);
    }
    else if ((b.top < a.bottom)) {
      dy = (a.bottom - b.top);
    }

    let euclid: number = Math.sqrt(((dx * dx)
      + (dy * dy)));
    return euclid;
  }

  //  Shows the current state of the algorithm for debug purposes.
  ShowAndMoveBoxesRemoveLater(treeEdges: List<Tuple<number, number, number, number, number>>, proximityEdges: List<Tuple<number, number, number, number, number>>, nodeSizes: Size[], nodePos: Point[], rootId: number) {
    let l = new List<DebugCurve>();
    for (let tuple in proximityEdges) {
      l.Add(new DebugCurve(100, 0.5, "black", new LineSegment(nodePos[tuple.Item1], nodePos[tuple.Item2])));
    }

    // just for debug
    let nodeBoxes = new Array(nodeSizes.length);
    for (let i: number = 0; (i < nodePos.length); i++) {
      nodeBoxes[i] = new Rectangle(nodeSizes[i], nodePos[i]);
    }

    l.AddRange(nodeBoxes.Select(() => { }, new DebugCurve(100, 0.3, "green", b.Perimeter())));
    if ((treeEdges != null)) {
      l.AddRange(treeEdges.Select(() => { }, new DebugCurve(200, GTreeOverlapRemoval.GetEdgeWidth(e), "red", new LineSegment(nodePos[e.Item1], nodePos[e.Item2]))));
    }

    if ((rootId >= 0)) {
      l.Add(new DebugCurve(100, 10, "blue", CurveFactory.CreateOctagon(30, 30, nodePos[rootId])));
    }

    LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
  }

  static GetEdgeWidth(edge: Tuple<number, number, number, number, number>): number {
    if ((edge.Item3 > 1)) {
      return 6;
    }

    return 2;
  }

  //  Lets the tree grow according to the ideal distances.
  static MoveNodePositions(treeEdges: List<Tuple<number, number, number, number, number>>, nodePositions: Point[], rootNodeId: number) {
    let posOld = (<Point[]>(nodePositions.Clone()));
    let visited = new Set<number>();
    visited.Insert(rootNodeId);
    for (let i: number = 0; (i < treeEdges.Count); i++) {
      let tupleEdge = treeEdges[i];
      if (visited.Contains(tupleEdge.Item1)) {
        GTreeOverlapRemoval.MoveUpperSite(tupleEdge, nodePositions, posOld, visited);
      }
      else {
        Debug.Assert(visited.Contains(tupleEdge.Item2));
        GTreeOverlapRemoval.MoveLowerSite(tupleEdge, nodePositions, posOld, visited);
      }

    }

  }

  static MoveUpperSite(edge: Tuple<number, number, number, number, number>, posNew: Point[], oldPos: Point[], visited: Set<number>) {
    let idealLen: number = edge.Item4;
    let dir = (oldPos[edge.Item2] - oldPos[edge.Item1]);
    let len = dir.Length;
    dir = (dir
      * ((idealLen / len)
        + 0.01));
    let standingNode: number = edge.Item1;
    let movedNode: number = edge.Item2;
    posNew[movedNode] = (posNew[standingNode] + dir);
    visited.Insert(movedNode);
  }

  static MoveLowerSite(edge: Tuple<number, number, number, number, number>, posNew: Point[], oldPos: Point[], visited: Set<number>) {
    let idealLen: number = edge.Item4;
    let dir = ((oldPos[edge.Item2] * -1)
      + oldPos[edge.Item1]);
    let len = dir.Length;
    dir = (dir
      * ((idealLen / len)
        + 0.01));
    let standingNode = edge.Item2;
    let movedNode = edge.Item1;
    posNew[movedNode] = (posNew[standingNode] + dir);
    visited.Insert(movedNode);
  }

  IOverlapRemoval.Settings.((settings: OverlapRemovalSettings) {
    _settings = settings;
  }

    //  
    public GetLastRunIterations(): number {
  return this.lastRunNumberIterations;
}
    
    public static RemoveOverlapsForLayers(nodes: GeomNode[], sizesOnLayers: Size[]) {
  let settings = [][
    RandomizeAllPointsOnStart = true];
  let mst = new GTreeOverlapRemoval(settings, nodes, sizesOnLayers);
  mst.RemoveOverlaps();
}


     function  InitNodePositionsAndBoxes(overlapRemovalSettings: OverlapRemovalSettings, nodes: GeomNode[], 
        t :{nodePositions: Point[], nodeSizes: Size[]}) {
        t.nodePositions = nodes.map((v) =>  v.center)
        t.nodeSizes = nodes.map(n => {
            const s = n.boundingBox.size
            s.width += overlapRemovalSettings.NodeSeparation // this pad with both sides by overlapRemovalSettings.NodeSeparation/2
            return s
        })
    }