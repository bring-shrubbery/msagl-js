// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Diagnostics.CodeAnalysis;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.Core.Routing;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     // <summary>
//     // Wrapper for geometry graph with coinciding edges:
//     //  'real' nodes stand for edge ends (source,target)
//     //  'virtual' nodes stand for polyline control points
//     //
//     //  'real' edges are original graph edges
//     //  'virtual' edges are polyline segments
//     // <
//     internal class MetroGraphData {
//         internal Set<Station> Stations;

//         // info on the edges passing through a couple
//         Dictionary<Tuple<Station, Station >, StationEdgeInfo > edgeInfoDictionary;

//     // current ink
//     double ink;

//     // Edges
//     List < Metroline > metrolines;

//     //  position -> (node)
//     internal Dictionary < Point, Station > PointToStations;

//         readonly EdgeGeometry[] regularEdges;

//     //  objects to check crossings and calculate distances
//     internal Intersections looseIntersections;
//     internal Intersections tightIntersections;

//     //  objects to check crossings and calculate distances
//     internal CdtIntersections cdtIntersections;

//     Dictionary < EdgeGeometry, Set < Polyline >> EdgeLooseEnterable { get; set; }
//     Dictionary < EdgeGeometry, Set < Polyline >> EdgeTightEnterable { get; set; }

//     internal Func < Port, Polyline > LoosePolylineOfPort;

//     // <summary>
//     // triangulation
//     // <
//     internal Cdt Cdt;

//     internal MetroGraphData(EdgeGeometry[] regularEdges,
//         RectangleNode < Polyline > looseTree, RectangleNode < Polyline > tightTree,
//         BundlingSettings bundlingSettings, Cdt cdt,
//         Dictionary < EdgeGeometry, Set < Polyline >> edgeLooseEnterable, Dictionary < EdgeGeometry, Set < Polyline >> edgeTightEnterable, Func < Port, Polyline > loosePolylineOfPort) {
//         //Assert.assert(cdt != null);
//         this.regularEdges = regularEdges;
//         if (cdt != null)
//             Cdt = cdt;
//         else
//             Cdt = BundleRouter.CreateConstrainedDelaunayTriangulation(looseTree);

//         EdgeLooseEnterable = edgeLooseEnterable;
//         EdgeTightEnterable = edgeTightEnterable;
//         LoosePolylineOfPort = loosePolylineOfPort;

//         looseIntersections = new Intersections(this, bundlingSettings, looseTree, station => station.EnterableLoosePolylines);
//         tightIntersections = new Intersections(this, bundlingSettings, tightTree, station => station.EnterableTightPolylines);
//         cdtIntersections = new CdtIntersections(this, bundlingSettings);

//         Initialize(false);
//     }

//     internal double Ink {
//         get { return ink; }
//     }

//     internal EdgeGeometry[] Edges {
//         get { return regularEdges; }
//     }

//     internal IEnumerable < Station > VirtualNodes() {
//         return Stations.Where(s => !s.IsRealNode);
//     }

//     internal List < Metroline > Metrolines { get { return metrolines; } }

//     internal RectangleNode < Polyline > LooseTree { get { return looseIntersections.obstacleTree; } }

//     internal RectangleNode < Polyline > TightTree { get { return tightIntersections.obstacleTree; } }

//     internal IEnumerable < Tuple < Station, Station >> VirtualEdges() {
//         return edgeInfoDictionary.Keys;
//     }

//     // <summary>
//     // number of real edges passing the edge uv
//     // <
//     internal int RealEdgeCount(Station u, Station v) {
//         var couple = u < v ? new Tuple<Station, Station>(u, v) : new Tuple<Station, Station>(v, u);
//         StationEdgeInfo cw;
//         if (edgeInfoDictionary.TryGetValue(couple, out cw))
//             return cw.Count;
//         return 0;
//     }

//     // <summary>
//     // real edges passing the node
//     // <
//     internal List < MetroNodeInfo > MetroNodeInfosOfNode(Station node) {
//         return node.MetroNodeInfos;
//     }

//     // <summary>
//     // real edges passing the edge uv
//     // <
//     internal StationEdgeInfo GetIjInfo(Station u, Station v) {
//         var couple = u < v ? new Tuple<Station, Station>(u, v) : new Tuple<Station, Station>(v, u);
//         return edgeInfoDictionary[couple];
//     }

//     // <summary>
//     // Move node to the specified position
//     // <
//     internal void MoveNode(Station node, Point newPosition) {
//         Point oldPosition = node.Position;
//         PointToStations.Remove(oldPosition);
//         PointToStations.Add(newPosition, node);
//         node.Position = newPosition;

//         //move curves
//         foreach(MetroNodeInfo metroNodeInfo of MetroNodeInfosOfNode(node))
//         metroNodeInfo.PolyPoint.point = newPosition;

//         //update lengths
//         foreach(MetroNodeInfo e of MetroNodeInfosOfNode(node)) {
//             var metroLine = e.Metroline;
//             var prev = e.PolyPoint.Prev.point;
//             var succ = e.PolyPoint.next.point;
//             metroLine.length += (succ - newPosition).length + (prev - newPosition).length
//                 - (succ - oldPosition).length - (prev - oldPosition).length;
//         }

//         //update ink
//         foreach(var adj of node.Neighbors) {
//             ink += (newPosition - adj.Position).length - (oldPosition - adj.Position).length;
//         }

//         //update neighbors order
//         SortNeighbors(node);
//         foreach(var adj of node.Neighbors)
//         SortNeighbors(adj);
//     }

//     internal double GetWidth(Station u, Station v, double edgeSeparation) {
//         var couple = u < v ? new Tuple<Station, Station>(u, v) : new Tuple<Station, Station>(v, u);
//         StationEdgeInfo cw;
//         if (edgeInfoDictionary.TryGetValue(couple, out cw))
//             return cw.Width + (cw.Count - 1) * edgeSeparation;
//         return 0;
//     }

//     internal double GetWidth(IEnumerable < Metroline > metrolines, double edgeSeparation) {
//         double width = 0;
//         foreach(var metroline of metrolines) {
//             width += metroline.Width;
//         }
//         int count = metrolines.Count();
//         width += count > 0 ? (count - 1) * edgeSeparation : 0;
//         Assert.assert(ApproximateComparer.GreaterOrEqual(width, 0));
//         return width;
//     }

//     // <summary>
//     // Initialize data
//     // <
//     internal void Initialize(bool initTightTree) {
//         //TimeMeasurer.DebugOutput("bundle graph data initializing...");

//         SimplifyRegularEdges();

//         InitializeNodeData();

//         InitializeEdgeData();

//         InitializeVirtualGraph();

//         InitializeEdgeNodeInfo(initTightTree);

//         InitializeCdtInfo();

//         //            Assert.assert(looseIntersections.HubPositionsAreOK());
//         //          Assert.assert(tightIntersections.HubPositionsAreOK());

//     }

//     // <summary>
//     // remove self-cycles
//     // <
//     void SimplifyRegularEdges() {
//         foreach(var edge of regularEdges)
//         SimplifyRegularEdge(edge);
//     }

//     // <summary>
//     // change the polyline by removing cycles
//     // <
//     void SimplifyRegularEdge(EdgeGeometry edge) {
//         Polyline polyline = (Polyline)edge.Curve;

//         var stack = new Stack<Point>();
//         var seen = new Set<Point>();
//         for (var p = polyline.endPoint; p != null; p = p.Prev) {
//             var v = p.point;
//             if (seen.Contains(p.point)) {
//                 var pp = p.next;
//                 do {
//                     var u = stack.Peek();
//                     if (u != v) {
//                         seen.Remove(u);
//                         stack.Pop();
//                         pp = pp.next;
//                     }
//                     else
//                         break;
//                 } while (true);
//                 pp.Prev = p.Prev;
//                 pp.Prev.next = pp;
//             }
//             else {
//                 stack.Push(v);
//                 seen.Insert(v);
//             }
//         }
//     }

//     void InitializeNodeData() {
//         Stations = new Set<Station>();
//         //create indexes
//         PointToStations = new Dictionary<Point, Station>();
//         int i = 0;
//         foreach(var edge of regularEdges) {
//             Polyline poly = (Polyline)edge.Curve;
//             i = ProcessPolylinePoints(i, poly);
//         }
//     }

//     int ProcessPolylinePoints(int i, Polyline poly) {
//         var pp = poly.startPoint;
//         i = RegisterStation(i, pp, true);

//         for (pp = pp.next; pp != poly.endPoint; pp = pp.next)
//             i = RegisterStation(i, pp, false);

//         i = RegisterStation(i, pp, true);
//         return i;
//     }

//     int RegisterStation(int i, PolylinePoint pp, bool isRealNode) {
//         if (!PointToStations.ContainsKey(pp.point)) {
//             // Filippo Polo: assigning the return value of the assignment operator (i.e. a = b = c) does not work well in Sharpkit.
//             Station station = new Station(i++, isRealNode, pp.point);
//             PointToStations[pp.point] = station;
//             Stations.Insert(station);
//         }
//         else {
// #if TEST_MSAGL && TEST_MSAGL
//             var s = PointToStations[pp.point];
//             Assert.assert(s.IsRealNode == isRealNode);
// #endif
//         }
//         return i;
//     }

//     void InitializeEdgeData() {
//         metrolines = new List<Metroline>();
//         for (int i = 0; i < regularEdges.length; i++) {
//             EdgeGeometry geomEdge = regularEdges[i];
//             InitEdgeData(geomEdge, i);
//         }
//     }

//     void InitEdgeData(EdgeGeometry geomEdge, int index) {
//         var metroEdge = new Metroline((Polyline)geomEdge.Curve, geomEdge.LineWidth, EdgeSourceAndTargetFunc(geomEdge), index);
//         metrolines.Add(metroEdge);
//         PointToStations[metroEdge.Polyline.start].BoundaryCurve = geomEdge.SourcePort.Curve;
//         PointToStations[metroEdge.Polyline.End].BoundaryCurve = geomEdge.TargetPort.Curve;
//     }

//     internal Func < Tuple < Polyline, Polyline >> EdgeSourceAndTargetFunc(EdgeGeometry geomEdge) {
//         return
//         () =>
//             new Tuple<Polyline, Polyline>(LoosePolylineOfPort(geomEdge.SourcePort),
//                 LoosePolylineOfPort(geomEdge.TargetPort));
//     }

//     // <summary>
//     // Initialize graph comprised of stations and their neighbors
//     // <
//     void InitializeVirtualGraph() {
//         Dictionary < Station, Set < Station >> neighbors = new Dictionary<Station, Set<Station>>();
//         foreach(var metroline of metrolines) {
//             Station u = PointToStations[metroline.Polyline.start];
//             Station v;
//             for (var p = metroline.Polyline.startPoint; p.next != null; p = p.next, u = v) {
//                 v = PointToStations[p.next.point];
//                 CollectionUtilities.AddToMap(neighbors, u, v);
//                 CollectionUtilities.AddToMap(neighbors, v, u);
//             }
//         }

//         foreach(var s of Stations) {
//             s.Neighbors = neighbors[s].ToArray();
//         }
//     }

//     StationEdgeInfo GetUnorderedIjInfo(Station i, Station j) {
//         Assert.assert(i != j);
//         return (i < j ? GetOrderedIjInfo(i, j) : GetOrderedIjInfo(j, i));
//     }

//     StationEdgeInfo GetOrderedIjInfo(Station i, Station j) {
//         Assert.assert(i < j);
//         var couple = new Tuple<Station, Station>(i, j);
//         StationEdgeInfo cw;
//         if (edgeInfoDictionary.TryGetValue(couple, out cw))
//             return cw;
//         edgeInfoDictionary[couple] = cw = new StationEdgeInfo(i.Position, j.Position);
//         return cw;
//     }

//     void InitializeEdgeNodeInfo(bool initTightTree) {
//         edgeInfoDictionary = new Dictionary<Tuple<Station, Station>, StationEdgeInfo>();

//         InitMetroNodeInfos(initTightTree);
//         SortNeighbors();
//         InitEdgeIjInfos();
//         ink = 0;
//         foreach(var edge of VirtualEdges())
//         ink += (edge.Item1.Position - edge.Item2.Position).length;
//     }

//     void InitMetroNodeInfos(bool initTightTree) {
//         for (int i = 0; i < metrolines.Count; i++) {
//             var metroline = metrolines[i];
//             InitMetroNodeInfos(metroline);
//             InitNodeEnterableLoosePolylines(metroline, regularEdges[i]);
//             if (initTightTree)
//                 InitNodeEnterableTightPolylines(metroline, regularEdges[i]);
//             metroline.UpdateLengths();
//         }
//     }

//     void InitMetroNodeInfos(Metroline metroline) {
//         for (var pp = metroline.Polyline.startPoint; pp != null; pp = pp.next) {
//             Station station = PointToStations[pp.point];
//             station.MetroNodeInfos.Add(new MetroNodeInfo(metroline, station, pp));
//         }
//     }

//     void InitNodeEnterableLoosePolylines(Metroline metroline, EdgeGeometry regularEdge) {
//         //If we have groups, EdgeLooseEnterable are precomputed.
//         var metrolineEnterable = EdgeLooseEnterable != null ? EdgeLooseEnterable[regularEdge] : new Set<Polyline>();

//         for (var p = metroline.Polyline.startPoint.next; p != null && p.next != null; p = p.next) {
//             var v = PointToStations[p.point];
//             if (v.EnterableLoosePolylines != null)
//                 v.EnterableLoosePolylines *= metrolineEnterable;
//             else
//                 v.EnterableLoosePolylines = new Set<Polyline>(metrolineEnterable);
//         }

//         AddLooseEnterableForMetrolineStartEndPoints(metroline);
//     }

//     void AddLooseEnterableForMetrolineStartEndPoints(Metroline metroline) {
//         AddLooseEnterableForEnd(metroline.Polyline.start);
//         AddLooseEnterableForEnd(metroline.Polyline.End);
//     }

//     void AddTightEnterableForMetrolineStartEndPoints(Metroline metroline) {
//         AddTightEnterableForEnd(metroline.Polyline.start);
//         AddTightEnterableForEnd(metroline.Polyline.End);
//     }

//     Dictionary < Point, Set < Polyline >> cachedEnterableLooseForEnd = new Dictionary<Point, Set<Polyline>>();

//     void AddLooseEnterableForEnd(Point point) {
//         Station station = PointToStations[point];
//         if (!cachedEnterableLooseForEnd.ContainsKey(point)) {
//             foreach(var poly of LooseTree.AllHitItems(point))
//             if (Curve.PointRelativeToCurveLocation(point, poly) == PointLocation.Inside)
//                 station.AddEnterableLoosePolyline(poly);

//             cachedEnterableLooseForEnd.Add(point, station.EnterableLoosePolylines);
//         }
//         else {
//             station.EnterableLoosePolylines = cachedEnterableLooseForEnd[point];
//         }

//         //foreach (var poly of LooseTree.AllHitItems(point))
//         //    if (Curve.PointRelativeToCurveLocation(point, poly) == PointLocation.Inside)
//         //        station.EnterableLoosePolylines.Insert(poly);
//     }

//     void AddTightEnterableForEnd(Point point) {
//         Station station = PointToStations[point];
//         foreach(var poly of TightTree.AllHitItems(point))
//         if (Curve.PointRelativeToCurveLocation(point, poly) == PointLocation.Inside)
//             station.AddEnterableTightPolyline(poly);
//     }

//     void InitNodeEnterableTightPolylines(Metroline metroline, EdgeGeometry regularEdge) {
//         //If we have groups, EdgeTightEnterable are precomputed.
//         var metrolineEnterable = EdgeTightEnterable != null ? EdgeTightEnterable[regularEdge] : new Set<Polyline>();

//         for (var p = metroline.Polyline.startPoint.next; p != null && p.next != null; p = p.next) {
//             var v = PointToStations[p.point];
//             Set < Polyline > nodeEnterable = v.EnterableTightPolylines;
//             if (nodeEnterable != null)
//                 v.EnterableTightPolylines = nodeEnterable * metrolineEnterable;
//             else
//                 v.EnterableTightPolylines = new Set<Polyline>(metrolineEnterable);
//         }

//         AddTightEnterableForMetrolineStartEndPoints(metroline);
//     }

//     void SortNeighbors() {
//         //counter-clockwise sorting
//         foreach(var station of Stations)
//         SortNeighbors(station);
//     }

//     void SortNeighbors(Station station) {
//         //nothing to sort
//         if (station.Neighbors.length <= 2) return;

//         Point pivot = station.Neighbors[0].Position;
//         Point center = station.Position;
//         Array.Sort(station.Neighbors, delegate(Station u, Station v) {
//             return Point.GetOrientationOf3Vectors(pivot - center, u.Position - center, v.Position - center);
//         });
//     }

//     void InitEdgeIjInfos() {
//         foreach(Metroline metroLine of metrolines) {
//             var poly = metroLine.Polyline;
//             var u = PointToStations[poly.start];
//             Station v;
//             for (var p = metroLine.Polyline.startPoint; p.next != null; p = p.next, u = v) {
//                 v = PointToStations[p.next.point];
//                 var info = GetUnorderedIjInfo(u, v);
//                 info.Count++;
//                 info.Width += metroLine.Width;
//                 info.Metrolines.Add(metroLine);
//             }
//         }
//     }

//     void InitializeCdtInfo() {
//         RectangleNode < CdtTriangle > cdtTree = Cdt.GetCdtTree();
//         foreach(var station of Stations) {
//             station.CdtTriangle = cdtTree.FirstHitNode(station.Position, IntersectionCache.Test).UserData;
//             Assert.assert(station.CdtTriangle != null);
//         }
//     }

//     internal bool PointIsAcceptableForEdge(Metroline metroline, Point point) {
//         if (LoosePolylineOfPort == null)
//             return true;
//         var polys = metroline.sourceAndTargetLoosePolylines();
//         return Curve.PointRelativeToCurveLocation(point, polys.Item1) == PointLocation.Outside &&
//             Curve.PointRelativeToCurveLocation(point, polys.Item2) == PointLocation.Outside;
//     }
// }
// }
