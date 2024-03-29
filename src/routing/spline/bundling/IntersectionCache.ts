﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.Core.Routing;
// using Microsoft.Msagl.Routing.Visibility;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Stores intersections between edges, hubs, and obstacles to speed up simulated annealing
//     // <
//     internal class IntersectionCache {
//         readonly MetroGraphData metroGraphData;
//         readonly BundlingSettings bundlingSettings;
//         readonly CostCalculator costCalculator;
//         readonly Cdt cdt;

//         public IntersectionCache(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, CostCalculator costCalculator, Cdt cdt) {
//             Assert.assert(cdt != null);
//             this.metroGraphData = metroGraphData;
//             this.bundlingSettings = bundlingSettings;
//             this.costCalculator = costCalculator;
//             this.cdt = cdt;
//         }

//         internal void InitializeCostCache() {
//         foreach(var v of metroGraphData.VirtualNodes()) {
//             v.cachedIdealRadius = HubRadiiCalculator.CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, v);
//             v.cachedRadiusCost = costCalculator.RadiusCost(v, v.Position);
//             v.cachedBundleCost = 0;
//         }

//         foreach(var edge of metroGraphData.VirtualEdges()) {
//             var v = edge.Item1;
//             var u = edge.Item2;
//             StationEdgeInfo edgeInfo = metroGraphData.GetIjInfo(v, u);
//             edgeInfo.cachedBundleCost = costCalculator.BundleCost(v, u, v.Position);
//             v.cachedBundleCost += edgeInfo.cachedBundleCost;
//             u.cachedBundleCost += edgeInfo.cachedBundleCost;
//         }
//     }

//     internal void UpdateCostCache(Station node) {
//         RectangleNode < CdtTriangle > cdtTree = cdt.GetCdtTree();
//         node.CdtTriangle = cdtTree.FirstHitNode(node.Position, Test).UserData;

//         node.cachedIdealRadius = HubRadiiCalculator.CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, node);
//         node.cachedRadiusCost = costCalculator.RadiusCost(node, node.Position);
//         node.cachedBundleCost = 0;

//         foreach(var adj of node.Neighbors) {
//             if (!adj.IsRealNode) {
//                 adj.cachedIdealRadius = HubRadiiCalculator.CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, adj);
//                 adj.cachedRadiusCost = costCalculator.RadiusCost(adj, adj.Position);
//             }

//             StationEdgeInfo edgeInfo = metroGraphData.GetIjInfo(node, adj);
//             adj.cachedBundleCost -= edgeInfo.cachedBundleCost;

//             edgeInfo.cachedBundleCost = costCalculator.BundleCost(node, adj, node.Position);
//             node.cachedBundleCost += edgeInfo.cachedBundleCost;
//             adj.cachedBundleCost += edgeInfo.cachedBundleCost;
//         }
//     }

//         static internal HitTestBehavior test(Point pnt, CdtTriangle t) {
//         return Cdt.PointIsInsideOfTriangle(pnt, t) ? HitTestBehavior.Stop : HitTestBehavior.Continue;
//     }

// }
// }
