// using System.Collections.Generic;
// using System.Linq;
// using System.Diagnostics;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Routing;
// using Microsoft.Msagl.Routing.Visibility;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;
// using System;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Calculates the cost of the routing
//     // <
//     internal class CostCalculator {
//         internal const double Inf = 1000000000.0;

//         readonly MetroGraphData metroGraphData;
//         readonly BundlingSettings bundlingSettings;

//         internal CostCalculator(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             this.metroGraphData = metroGraphData;
//             this.bundlingSettings = bundlingSettings;
//         }

//         // Error of ink
//         // <
//         static internal double InkError(double oldInk, double newInk, BundlingSettings bundlingSettings) {
//             return (oldInk - newInk) * bundlingSettings.InkImportance;
//         }

//         // Error of path lengths
//         // <
//         static internal double PathLengthsError(double oldLength, double newLength, double idealLength, BundlingSettings bundlingSettings) {
//             return (oldLength - newLength) * (bundlingSettings.PathLengthImportance / idealLength);
//         }

//         // Error of hubs
//         // <
//         static internal double RError(double idealR, double nowR, BundlingSettings bundlingSettings) {
//             if (idealR <= nowR) return 0;

//             double res = bundlingSettings.HubRepulsionImportance * (1.0 - nowR / idealR) * (idealR - nowR);
//             return res;
//         }

//         // Error of bundles
//         // <
//         static internal double BundleError(double idealWidth, double nowWidth, BundlingSettings bundlingSettings) {
//             if (idealWidth <= nowWidth) return 0;

//             double res = bundlingSettings.BundleRepulsionImportance * (1.0 - nowWidth / idealWidth) * (idealWidth - nowWidth);
//             return res;
//         }

//         // Cost of the whole graph
//         // <
//         static internal double Cost(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             double cost = 0;

//             //ink
//             cost += bundlingSettings.InkImportance * metroGraphData.Ink;

//             //path lengths
//             foreach(var metroline of metroGraphData.Metrolines) {
//                 cost += bundlingSettings.PathLengthImportance * metroline.length / metroline.IdealLength;
//             }

//             cost += CostOfForces(metroGraphData, bundlingSettings);

//             return cost;
//         }

//         // Cost of the whole graph (hubs and bundles)
//         // <
//         static internal double CostOfForces(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             double cost = 0;

//             //hubs
//             foreach(var v of metroGraphData.VirtualNodes()) {
//                 cost += v.cachedRadiusCost;
//             }

//             //bundles
//             foreach(var edge of metroGraphData.VirtualEdges()) {
//                 var v = edge.Item1;
//                 var u = edge.Item2;
//                 cost += metroGraphData.GetIjInfo(v, u).cachedBundleCost;
//             }

//             return cost;
//         }

//         // Gain of ink
//         // <
//         internal double InkGain(Station node, Point newPosition) {
//             //ink
//             double oldInk = metroGraphData.Ink;
//             double newInk = metroGraphData.Ink;
//             foreach(var adj of node.Neighbors) {
//                 Point adjPosition = adj.Position;
//                 newInk -= (adjPosition - node.Position).length;
//                 newInk += (adjPosition - newPosition).length;
//             }
//             return InkError(oldInk, newInk, bundlingSettings);
//         }

//         // Gain of path lengths
//         // <
//         internal double PathLengthsGain(Station node, Point newPosition) {
//             double gain = 0;
//             //edge lengths
//             foreach(var e of metroGraphData.MetroNodeInfosOfNode(node)) {
//                 var oldLength = e.Metroline.length;
//                 var newLength = e.Metroline.length;

//                 var prev = e.PolyPoint.Prev.point;
//                 var next = e.PolyPoint.next.point;

//                 newLength += (next - newPosition).length + (prev - newPosition).length - (next - node.Position).length - (prev - node.Position).length;

//                 gain += PathLengthsError(oldLength, newLength, e.Metroline.IdealLength, bundlingSettings);
//             }

//             return gain;
//         }

//         // Gain of radii
//         // <
//         internal double RadiusGain(Station node, Point newPosition) {
//             double gain = 0;

//             gain += node.cachedRadiusCost;
//             gain -= RadiusCost(node, newPosition);

//             return gain;
//         }

//         internal double RadiusCost(Station node, Point newPosition) {
//             double idealR;
//             if (Point.closeDistEps(node.Position, newPosition))
//                 idealR = node.cachedIdealRadius;
//             else
//                 idealR = HubRadiiCalculator.CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, node, newPosition);

//             Array < Tuple < Polyline, Point >> touchedObstacles;
//             if (!metroGraphData.looseIntersections.HubAvoidsObstacles(node, newPosition, idealR, out touchedObstacles)) {
//                 return Inf;
//             }

//             double cost = 0;
//             foreach(var d of touchedObstacles) {
//                 double dist = (d.Item2 - newPosition).length;
//                 cost += RError(idealR, dist, bundlingSettings);
//             }

//             return cost;
//         }

//         // Gain of bundles
//         // if a newPosition is not valid (e.g. intersect obstacles) the result is -inf
//         // <
//         internal double BundleGain(Station node, Point newPosition) {
//             double gain = 0;

//             gain += node.cachedBundleCost;
//             foreach(var adj of node.Neighbors) {
//                 double lgain = BundleCost(node, adj, newPosition);
//                 if (ApproximateComparer.GreaterOrEqual(lgain, Inf)) return -Inf;
//                 gain -= lgain;
//             }

//             return gain;
//         }

//         internal double BundleCost(Station node, Station adj, Point newPosition) {
//             double idealWidth = metroGraphData.GetWidth(node, adj, bundlingSettings.EdgeSeparation);
//             Array < Tuple < Point, Point >> closestDist;

//             double cost = 0;
//             //find conflicting obstacles
//             if (!metroGraphData.cdtIntersections.BundleAvoidsObstacles(node, adj, newPosition, adj.Position, idealWidth, out closestDist)) {
//                 return Inf;
//             }

//             foreach(var pair of closestDist) {
//                 double dist = (pair.Item1 - pair.Item2).length;
//                 cost += BundleError(idealWidth / 2, dist, bundlingSettings);
//             }

//             return cost;
//         }

//     }
// }
