﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.Core.Routing;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;
// using Microsoft.Msagl.Routing.Visibility;
// using Microsoft.Msagl.DebugHelpers;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//   internal class SdShortestPath {
//     internal VisibilityGraph VisibilityGraph { get; set; }
//   internal Func < EdgeGeometry, Array < Shape >> MakeTransparentShapesOfEdgeGeometry { get; set; }
//   internal BundlingSettings BundlingSettings { get; set; }
//   internal EdgeGeometry[] EdgeGeometries { get; set; }
//   internal RectangleNode < Polyline > ObstacleHierarchy { get; set; }

//   SdVertex[] vertexArray;
//   internal Cdt Cdt { get; set; }
//   Set < CdtEdge > Gates { get; set; }

//         readonly Map < EdgeGeometry, Array < SdBoneEdge >> EdgesToRoutes = new Map<EdgeGeometry, Array<SdBoneEdge>>();
//         readonly Map < EdgeGeometry, SdVertex > EdgesToRouteSources = new Map<EdgeGeometry, SdVertex>();

//   EdgeGeometry CurrentEdgeGeometry;
//   Map < VisibilityVertex, SdVertex > VisibilityVerticesToSdVerts;
//   double LengthCoefficient;
//   GenericBinaryHeapPriorityQueue < SdVertex > Queue;
//   double LowestCostToTarget;
//   SdVertex ClosestTargetVertex;
//   double capacityOverlowPenaltyMultiplier;
//   Polyline sourceLoosePoly;
//   Polyline targetLoosePoly;

//   internal SdShortestPath(Func < EdgeGeometry, Array < Shape >> makeTransparentShapesOfEdgeGeometryAndGetTheShapes, Cdt cdt, Set < CdtEdge > gates) {
//     MakeTransparentShapesOfEdgeGeometry = makeTransparentShapesOfEdgeGeometryAndGetTheShapes;
//     Cdt = cdt;
//     Gates = gates;
//   }

//   void CreateGraphElements() {
//     foreach(var sdVertex of vertexArray) {
//       var vv = sdVertex.VisibilityVertex;
//       foreach(var vEdge of vv.InEdges) {
//         var boneEdge = new SdBoneEdge(vEdge, VisibilityVerticesToSdVerts[vEdge.Source], VisibilityVerticesToSdVerts[vEdge.Target]);
//         var otherSdVertex = VisibilityVerticesToSdVerts[vEdge.Source];
//         sdVertex.InBoneEdges.Add(boneEdge);
//         otherSdVertex.OutBoneEdges.Add(boneEdge);
//       }
//     }
//   }

//   void CreateRoutingGraph() {
//     vertexArray = new SdVertex[VisibilityGraph.VertexCount];
//     int i = 0;
//     VisibilityVerticesToSdVerts = new Map<VisibilityVertex, SdVertex>();
//     foreach(var v of VisibilityGraph.Vertices()) {
//       var sdVert = new SdVertex(v);
//       vertexArray[i++] = sdVert;
//       VisibilityVerticesToSdVerts[v] = sdVert;
//     }

//     CreateGraphElements();
//   }

//   // routing of the edges minimizing (ink+path length+capacity penalty)
//   // <
//   internal void RouteEdges() {
//     Initialize();
//     RestoreCapacities();
//     foreach(var edgeGeometry of EdgeGeometries) {
//       EdgesToRoutes[edgeGeometry] = RouteEdge(edgeGeometry);
//     }

//     RerouteEdges();

//     foreach(var edgeGeometry of EdgeGeometries)
//     SetEdgeGeometryCurve(edgeGeometry);
//   }

//   void SetEdgeGeometryCurve(EdgeGeometry edgeGeometry) {
//     Polyline poly = new Polyline();
//     SdVertex curV = EdgesToRouteSources[edgeGeometry];
//     poly.AddPoint(curV.point);
//     foreach(var edge of EdgesToRoutes[edgeGeometry]) {
//       if (edge.SourcePoint == curV.point) {
//         poly.AddPoint(edge.TargetPoint);
//         curV = edge.Target;
//       }
//       else {
//         poly.AddPoint(edge.SourcePoint);
//         curV = edge.Source;
//       }
//     }

//     edgeGeometry.Curve = poly;
//     var clusterSourcePort = edgeGeometry.SourcePort as ClusterBoundaryPort;
//     if (clusterSourcePort != null)
//       ExtendPolylineStartToClusterBoundary(poly, clusterSourcePort.Curve);

//     var clusterTargetPort = edgeGeometry.TargetPort as ClusterBoundaryPort;
//     if (clusterTargetPort != null)
//       ExtendPolylineEndToClusterBoundary(poly, clusterTargetPort.Curve);
//   }

//         static void ExtendPolylineEndToClusterBoundary(Polyline poly, ICurve curve) {
//     var par = curve.ClosestParameter(poly.End);
//     poly.AddPoint(curve[par]);
//   }

//         static void ExtendPolylineStartToClusterBoundary(Polyline poly, ICurve curve) {
//     var par = curve.ClosestParameter(poly.start);
//     poly.PrependPoint(curve[par]);
//   }

//   void RerouteEdges() {
//     RestoreCapacities();
//     foreach(var edgeGeometry of EdgeGeometries) {
//       var newRoute = RerouteEdge(edgeGeometry);
//       EdgesToRoutes[edgeGeometry] = newRoute;
//     }
//   }

//   void RestoreCapacities() {
//     if (Cdt != null)
//       Cdt.RestoreEdgeCapacities();
//   }

//   // Reroute edge
//   // <
//   Array < SdBoneEdge > RerouteEdge(EdgeGeometry edgeGeometry) {
//     var route = EdgesToRoutes[edgeGeometry];

//     foreach(var edge of route)
//     edge.RemoveOccupiedEdge();

//     return RouteEdge(edgeGeometry);
//   }

//   Array < SdBoneEdge > RouteEdge(EdgeGeometry edgeGeometry) {
//     CurrentEdgeGeometry = edgeGeometry;
//     for (int i = 0; i < vertexArray.length; i++) {
//       var sdv = vertexArray[i];
//       sdv.SetPreviousToNull();
//       sdv.IsSourceOfRouting = sdv.IsTargetOfRouting = false;
//     }

//     var transparentShapes = MakeTransparentShapesOfEdgeGeometry(edgeGeometry);
//     var ret = RouteEdgeWithGroups();

//     foreach(var shape of transparentShapes)
//     shape.IsTransparent = false;

//     /*Array<LineSegment> ls = new Array<LineSegment>();
//     foreach (var e of ret)
//         ls.Add(new LineSegment(e.SourcePoint, e.TargetPoint));
//     SplineRouter.ShowVisGraph(this.VisibilityGraph, ObstacleHierarchy.GetAllLeaves(), null, ls);*/

//     return ret;
//   }

//   Array < SdBoneEdge > RouteEdgeWithGroups() {
//     for (int i = 0; i < 2; i++) {
//       SetLengthCoefficient();
//       Queue = new GenericBinaryHeapPriorityQueue<SdVertex>();
//       SetPortVerticesAndObstacles(CurrentEdgeGeometry.SourcePort, true, out sourceLoosePoly);
//       SetPortVerticesAndObstacles(CurrentEdgeGeometry.TargetPort, false, out targetLoosePoly);
//       Array < SdBoneEdge > ret = RouteOnKnownSourceTargetVertices((CurrentEdgeGeometry.TargetPort.Location - CurrentEdgeGeometry.SourcePort.Location).normalize(), i == 0);
//       if (ret != null)
//         return ret;
//       for (int j = 0; j < vertexArray.length; j++) {
//         vertexArray[j].SetPreviousToNull();
//       }
//     }
//     //SplineRouter.ShowVisGraph(this.VisibilityGraph, ObstacleHierarchy.GetAllLeaves(), null, new[] { new LineSegment(
//     // CurrentEdgeGeometry.SourcePort.Location, CurrentEdgeGeometry.TargetPort.Location)});
//     throw new Error(); //cannot find a path
//   }

//   Array < SdBoneEdge > RouteOnKnownSourceTargetVertices(Point pathDirection, bool lookingForMonotonePath) {
//     LowestCostToTarget = Double.PositiveInfinity;
//     ClosestTargetVertex = null;
//     while (Queue.Count > 0) {
//       double hu;
//       SdVertex bestNode = Queue.Dequeue(out hu);
//       if (hu >= LowestCostToTarget)
//         continue;
//       //update the rest
//       for (int i = 0; i < bestNode.OutBoneEdges.Count; i++) {
//         var outBoneEdge = bestNode.OutBoneEdges[i];
//         if (outBoneEdge.IsPassable)
//           ProcessOutcomingBoneEdge(bestNode, outBoneEdge, pathDirection, lookingForMonotonePath);
//       }

//       for (int i = 0; i < bestNode.InBoneEdges.Count; i++) {
//         var inBoneEdge = bestNode.InBoneEdges[i];
//         if (inBoneEdge.IsPassable)
//           ProcessIncomingBoneEdge(bestNode, inBoneEdge, pathDirection, lookingForMonotonePath);
//       }
//     }

//     return GetPathAndUpdateRelatedCosts();
//   }

//   void ProcessOutcomingBoneEdge(SdVertex v, SdBoneEdge outBoneEdge, Point pathDirection, bool lookingForMonotonePath) {
//     Assert.assert(v == outBoneEdge.Source);
//     if (lookingForMonotonePath && pathDirection * (outBoneEdge.TargetPoint - outBoneEdge.SourcePoint) < 0) return;

//     ProcessBoneEdge(v, outBoneEdge.Target, outBoneEdge);
//   }

//   void ProcessIncomingBoneEdge(SdVertex v, SdBoneEdge inBoneEdge, Point pathDirection, bool lookingForMonotonePath) {
//     Assert.assert(v == inBoneEdge.Target);
//     if (lookingForMonotonePath && pathDirection * (inBoneEdge.SourcePoint - inBoneEdge.TargetPoint) < 0) return;

//     ProcessBoneEdge(v, inBoneEdge.Source, inBoneEdge);
//   }

//   void ProcessBoneEdge(SdVertex v, SdVertex queueCandidate, SdBoneEdge boneEdge) {
//     double newCost = GetEdgeAdditionalCost(boneEdge, v.Cost);
//     if (queueCandidate.Cost <= newCost) return;
//     queueCandidate.Cost = newCost;
//     queueCandidate.PrevEdge = boneEdge;
//     if (Queue.ContainsElement(queueCandidate))
//       Queue.DecreasePriority(queueCandidate, newCost);
//     else {
//       if (queueCandidate.IsTargetOfRouting) {
//         double costToTarget = 0;
//         if (CurrentEdgeGeometry.TargetPort is ClusterBoundaryPort)
//         costToTarget = LengthCoefficient * (queueCandidate.point - CurrentEdgeGeometry.TargetPort.Location).length;

//         if (newCost + costToTarget < LowestCostToTarget) {
//           LowestCostToTarget = newCost + costToTarget;
//           ClosestTargetVertex = queueCandidate;
//         }
//         return; //do not enqueue the target vertices
//       }
//       Enqueue(queueCandidate);
//     }
//   }

// #if TEST_MSAGL && TEST_MSAGL
//         //        void DebugShow(SdSimpleVertex prevElement, SdBoneEdge outBoneEdge) {
//         //            SplineRouter.ShowVisGraph(this.VisibilityGraph,
//         //                                      this.ObstacleHierarchy.GetAllLeaves(),
//         //                                      prevElement.BoneEdge != null ?
//         //                                       new[] { new LineSegment(prevElement.BoneEdge.SourcePoint, prevElement.BoneEdge.TargetPoint) } : null,
//         //                                      new[] {(ICurve) new LineSegment(outBoneEdge.SourcePoint, outBoneEdge.TargetPoint) ,
//         //                                      new Ellipse(5,5,outBoneEdge.TargetPoint)});
//         //        }
//         //
//         //        void DebugShowIn(SdSimpleVertex prevElement, SdBoneEdge inBoneEdge) {
//         //            SplineRouter.ShowVisGraph(this.VisibilityGraph,
//         //                                      this.ObstacleHierarchy.GetAllLeaves(),
//         //                                      prevElement.BoneEdge != null ?
//         //                                                                    new[] { new LineSegment(prevElement.BoneEdge.SourcePoint, prevElement.BoneEdge.TargetPoint) } : null,
//         //                                      new[] {(ICurve) new LineSegment(inBoneEdge.SourcePoint, inBoneEdge.TargetPoint) ,
//         //                                      new Ellipse(2,2,inBoneEdge.TargetPoint)});
//         //        }
// #endif

//   Array < SdBoneEdge > GetPathAndUpdateRelatedCosts() {
//     //restore the path by moving backwards
//     var current = ClosestTargetVertex;
//     if (current == null)
//       return null;
//     var result = new Array<SdBoneEdge>();

//     while (current.PrevEdge != null) {
//       result.Add(current.PrevEdge);
//       RegisterPathInBoneEdge(current.PrevEdge);
//       current = current.Prev;
//     }

//     EdgesToRouteSources[CurrentEdgeGeometry] = current;

//     result.Reverse();

//     Assert.assert(result.Count > 0);
//     return result;
//   }

//   void RegisterPathInBoneEdge(SdBoneEdge boneEdge) {
//     boneEdge.AddOccupiedEdge();
//     if (Cdt != null && BundlingSettings.CapacityOverflowCoefficient != 0)
//       UpdateResidualCostsOfCrossedCdtEdges(boneEdge);
//   }

//   void UpdateResidualCostsOfCrossedCdtEdges(SdBoneEdge boneEdge) {
//     foreach(var cdtEdge of boneEdge.CrossedCdtEdges) {
//       if (AdjacentToSourceOrTarget(cdtEdge))
//         continue;
//       if (cdtEdge.ResidualCapacity == cdtEdge.Capacity)
//         cdtEdge.ResidualCapacity -= CurrentEdgeGeometry.LineWidth;
//       else
//         cdtEdge.ResidualCapacity -= (CurrentEdgeGeometry.LineWidth + BundlingSettings.EdgeSeparation);
//       //TODO: can we have negative here?
//       //Assert.assert(cdtEdge.ResidualCapacity >= 0);
//     }
//   }

//   double H(SdVertex v) {
//     return v.Cost + LengthCoefficient * (v.point - CurrentEdgeGeometry.TargetPort.Location).length;
//   }

//   double GetEdgeAdditionalCost(SdBoneEdge boneEdge, double previousCost) {
//     var len = (boneEdge.TargetPoint - boneEdge.SourcePoint).length;
//     return LengthCoefficient * len + previousCost +
//       (boneEdge.IsOccupied ? 0 : BundlingSettings.InkImportance * len) + CapacityOverflowCost(boneEdge);
//   }

//   double CapacityOverflowCost(SdBoneEdge boneEdge) {
//     if (Cdt == null || BundlingSettings.CapacityOverflowCoefficient == 0)
//       return 0;
//     double ret = 0;
//     foreach(var cdtEdge of CrossedCdtEdgesOfBoneEdge(boneEdge)) {
//       ret += CostOfCrossingCdtEdgeLocal(capacityOverlowPenaltyMultiplier, BundlingSettings, CurrentEdgeGeometry, cdtEdge);
//     }
//     return ret;
//   }

//   Array < CdtEdge > CrossedCdtEdgesOfBoneEdge(SdBoneEdge boneEdge) {
//     if (boneEdge.CrossedCdtEdges != null)
//       return boneEdge.CrossedCdtEdges;
// #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=368
//     boneEdge.CrossedCdtEdges = ThreadBoneEdgeThroughCdt(boneEdge);
//     return boneEdge.CrossedCdtEdges;
// #else
//     return boneEdge.CrossedCdtEdges = ThreadBoneEdgeThroughCdt(boneEdge);
// #endif
//   }

//   Set < CdtEdge > ThreadBoneEdgeThroughCdt(SdBoneEdge boneEdge) {
//     var start = boneEdge.SourcePoint;
//     var currentTriangle = boneEdge.Source.Triangle;
//     Assert.assert(Cdt.PointIsInsideOfTriangle(start, currentTriangle));
//     var crossedEdges = new Set<CdtEdge>();
//     var end = boneEdge.TargetPoint;
//     if (Cdt.PointIsInsideOfTriangle(end, currentTriangle))
//       return crossedEdges;

//     var threader = new CdtThreader(currentTriangle, start, end);
//     while (threader.MoveNext()) {
//       CdtEdge piercedEdge = threader.CurrentPiercedEdge;
//       Assert.assert(piercedEdge != null);
//       if (Gates.Contains(piercedEdge))
//         crossedEdges.Insert(piercedEdge);
//     }

//     /*
//     CdtEdge piercedEdge = CdtIntersections.FindFirstPiercedEdge(currentTriangle, start, end, out negativeSign, out positiveSign, this.Cdt );
//     Assert.assert(piercedEdge != null);

//     do {
//         if (Gates.Contains(piercedEdge))
//             crossedEdges.Insert(piercedEdge);
//     }
//     while (CdtIntersections.FindNextPierced(start, end, ref currentTriangle, ref piercedEdge, ref negativeSign, ref positiveSign));
//     */
//     //if(ddd(boneEdge))
//     //CdtSweeper.ShowFront(Cdt.GetTriangles(),null,new []{new LineSegment(boneEdge.SourcePoint,boneEdge.TargetPoint)}, crossedEdges.Select(e=>new LineSegment(e.upperSite.point,e.lowerSite.point)));

//     return crossedEdges;
//   }

//   //TODO: method incorrect since id doesn't check AdjacentToSourceOrTarget condition
//   internal static double CostOfCrossingCdtEdge(double capacityOverflMult, BundlingSettings bundlingSettings, EdgeGeometry currentEdgeGeometry, CdtEdge e) {
//     var w = currentEdgeGeometry.LineWidth;
//     if (e.Capacity != e.ResidualCapacity)
//       w += bundlingSettings.EdgeSeparation;

//     var del = e.ResidualCapacity - w;
//     if (del >= 0) return 0;
//     return -del * capacityOverflMult;
//   }

//   double CostOfCrossingCdtEdgeLocal(double capacityOverflMult, BundlingSettings bundlingSettings, EdgeGeometry currentEdgeGeometry, CdtEdge e) {
//     if (AdjacentToSourceOrTarget(e))
//       return 0;
//     return CostOfCrossingCdtEdge(capacityOverflMult, bundlingSettings, currentEdgeGeometry, e);
//   }

//   bool AdjacentToSourceOrTarget(CdtEdge e) {
//     return e.upperSite.Owner == sourceLoosePoly || e.lowerSite.Owner == sourceLoosePoly || e.upperSite.Owner == targetLoosePoly || e.lowerSite.Owner == targetLoosePoly;
//   }

//   void SetLengthCoefficient() {
//     double idealEdgeLength = GetIdealDistanceBetweenSourceAndTarget(CurrentEdgeGeometry);
//     LengthCoefficient = BundlingSettings.PathLengthImportance / idealEdgeLength;
//   }

//   double GetIdealDistanceBetweenSourceAndTarget(EdgeGeometry edgeGeometry) {
//     return (edgeGeometry.SourcePort.Location - edgeGeometry.TargetPort.Location).length;
//   }

//   void SetPortVerticesAndObstacles(Port port, bool sources, out Polyline poly) {
//     var cbport = port as ClusterBoundaryPort;
//     if (cbport != null) {
//       //SplineRouter.ShowVisGraph(this.VisibilityGraph, this.ObstacleHierarchy.GetAllLeaves(), null, new[]{cbport.LoosePolyline});
//       poly = cbport.LoosePolyline;
//       foreach(var point of poly) {
//         double initialCost = 0;
//         if (sources) {
//           //we prefer paths starting from the center of the group
//           initialCost = LengthCoefficient * (point - CurrentEdgeGeometry.SourcePort.Location).length;
//         }
//         AddAndEnqueueVertexToEnds(point, sources, initialCost);
//       }
//     }
//     else {
//       var anywherePort = port as HookUpAnywhereFromInsidePort;
//       if (anywherePort != null) {
//         poly = anywherePort.LoosePolyline;
//         foreach(var point of poly)
//         AddAndEnqueueVertexToEnds(point, sources, 0);
//       }
//       else {
//         AddAndEnqueueVertexToEnds(port.Location, sources, 0);
//         var polys = this.ObstacleHierarchy.GetNodeItemsIntersectingRectangle(port.Curve.BoundingBox).ToArray();
//         double mindiag = polys[0].BoundingBox.Diagonal;
//         poly = polys[0];
//         for (int i = 1; i < polys.length; i++) {
//           var pl = polys[i];
//           var diag = pl.BoundingBox.Diagonal;
//           if (diag < mindiag) {
//             mindiag = diag;
//             poly = pl;
//           }
//         }

//       }
//     }
//   }

//   void Enqueue(SdVertex simpleSdVertex) {
//     Queue.Enqueue(simpleSdVertex, H(simpleSdVertex));
//   }

//   void AddAndEnqueueVertexToEnds(Point point, bool isSource, double initialCost) {
//     var v = FindVertex(point);
//     var sdVert = VisibilityVerticesToSdVerts[v];
//     if (isSource) {
//       sdVert.IsSourceOfRouting = true;
//       sdVert.Cost = initialCost;
//       Enqueue(sdVert);
//     }
//     else {
//       sdVert.IsTargetOfRouting = true;
//     }
//   }

//   VisibilityVertex FindVertex(Point p) {
//     return VisibilityGraph.FindVertex(p) ?? VisibilityGraph.FindVertex(GeomConstants.RoundPoint(p));
//     /*  if (r == null) {
//           SplineRouter.ShowVisGraph(this.VisibilityGraph, this.ObstacleHierarchy.GetAllLeaves(), null,
//           new[] { new Ellipse(5, 5, p) });
//       }
//       return r;*/
//   }

//   void Initialize() {
//     CreateRoutingGraph();
//     if (Cdt != null) {
//       capacityOverlowPenaltyMultiplier = CapacityOverflowPenaltyMultiplier(BundlingSettings);
//       SetVertexTriangles();
//       CalculateCapacitiesOfTrianglulation();
//     }
//   }

//   void CalculateCapacitiesOfTrianglulation() {
//     foreach(var e of Gates)
//     CalculateCdtEdgeCapacityForEdge(e);
//   }

//         static void CalculateCdtEdgeCapacityForEdge(CdtEdge e) {
//     if (e.Constrained || e.CwTriangle == null || e.CcwTriangle == null)
//       return; //this is a convex hull edge or an obstacle edge
//     var startPoly = e.upperSite.Owner as Polyline;
//     var endPoly = e.lowerSite.Owner as Polyline;
//     if (startPoly != endPoly) {
//       //e.Capacity = Polygon.Distance(new Polygon(startPoly), new Polygon(endPoly)); //todo: cache this
//       //e.Capacity = (e.upperSite.point - e.lowerSite.point).length;
//       double distA = Polygon.Distance(new Polygon(startPoly), e.lowerSite.point);
//       double distB = Polygon.Distance(new Polygon(endPoly), e.upperSite.point);
//       e.Capacity = (distA + distB) / 2;
//     }
//     //else - it is a diagonal of an obstacle, do not care
//   }

//   void SetVertexTriangles() {
//     var triangleTree =
//       RectangleNode<CdtTriangle, Point>.CreateRectangleNodeOnEnumeration(
//         Cdt.GetTriangles().Select(t => new RectangleNode<CdtTriangle, Point>(t, t.BoundingBox())));
//     var vertexTree =
//       RectangleNode<SdVertex, Point>.CreateRectangleNodeOnEnumeration(
//         vertexArray.Select(v => new RectangleNode<SdVertex, Point>(v, new Rectangle(v.point))));

//     RectangleNodeUtils.CrossRectangleNodes(triangleTree, vertexTree, TryToAssigenTriangleToVertex);
//     foreach(var v of vertexArray) {
//       Assert.assert(v.Triangle != null);
//     }
//   }

//   void TryToAssigenTriangleToVertex(CdtTriangle triangle, SdVertex vertex) {
//     if (vertex.Triangle != null)
//       return;

//     if (Cdt.PointIsInsideOfTriangle(vertex.point, triangle))
//       vertex.Triangle = triangle;
//   }

//   internal static double CapacityOverflowPenaltyMultiplier(BundlingSettings bundlingSettings) {
//     return bundlingSettings.CapacityOverflowCoefficient * (bundlingSettings.PathLengthImportance + bundlingSettings.InkImportance);
//   }

//   // compute cdt edges crossed by paths
//   // <
//   internal void FillCrossedCdtEdges(Map < EdgeGeometry, Set < CdtEdge >> crossedCdtEdges) {
//     foreach(var geometryEdge of EdgeGeometries) {
//       SetPortVerticesAndObstacles(geometryEdge.SourcePort, true, out sourceLoosePoly);
//       SetPortVerticesAndObstacles(geometryEdge.TargetPort, false, out targetLoosePoly);

//       //crossedCdtEdges.Add(geometryEdge, new Set<CdtEdge>());
//       foreach(var boneEdge of EdgesToRoutes[geometryEdge]) {
//         foreach(var cdtEdge of CrossedCdtEdgesOfBoneEdge(boneEdge)) {
//           if (AdjacentToSourceOrTarget(cdtEdge))
//             continue;
//           CollectionUtilities.AddToMap(crossedCdtEdges, geometryEdge, cdtEdge);
//         }
//       }
//     }
//   }
// }
// }
