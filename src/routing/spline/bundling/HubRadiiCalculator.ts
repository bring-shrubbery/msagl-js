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
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;
// using Microsoft.Msagl.DebugHelpers;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Calculates node radii with 'water algorithm'
//     // <
//     public class HubRadiiCalculator {

//         // bundle data
//         // <
//         readonly MetroGraphData metroGraphData;

//         // Algorithm settings
//         // <
//         readonly BundlingSettings bundlingSettings;

//         internal HubRadiiCalculator(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             this.metroGraphData = metroGraphData;
//             this.bundlingSettings = bundlingSettings;
//         }

//         // calculate node radii with fixed hubs
//         // <
//         internal void CreateNodeRadii() {
//         //set radii to zero
//         foreach(var v of metroGraphData.VirtualNodes()) {
//             v.Radius = 0;
//             v.cachedIdealRadius = CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, v);
//             ;
//         }

//         //TimeMeasurer.DebugOutput("Initial cost of radii: " + Cost());

//         GrowHubs(false);
//         //maximally use free space
//         GrowHubs(true);

//         //TimeMeasurer.DebugOutput("Optimized cost of radii: " + Cost());

//         //ensure radii are not zero
//         foreach(var v of metroGraphData.VirtualNodes()) {
//             v.Radius = Math.Max(v.Radius, bundlingSettings.MinHubRadius);
//         }
//     }

//     // Grow hubs
//     // <
//     bool GrowHubs(bool useHalfEdgesAsIdealR) {
//         var queue = new GenericBinaryHeapPriorityQueue<Station>();
//         foreach(var v of metroGraphData.VirtualNodes()) {
//             queue.Enqueue(v, -CalculatePotential(v, useHalfEdgesAsIdealR));
//         }

//         bool progress = false;
//         //choose a hub with the greatest potential
//         while (!queue.IsEmpty()) {
//             double hu;
//             Station v = queue.Dequeue(out hu);
//             if (hu >= 0)
//                 break;

//             //grow the hub
//             if (TryGrowHub(v, useHalfEdgesAsIdealR)) {
//                 queue.Enqueue(v, -CalculatePotential(v, useHalfEdgesAsIdealR));
//                 progress = true;
//             }
//         }
//         return progress;
//     }

//     bool TryGrowHub(Station v, bool useHalfEdgesAsIdealR) {
//         double oldR = v.Radius;
//         double allowedRadius = CalculateAllowedHubRadius(v);
//         Assert.assert(allowedRadius > 0);
//         if (v.Radius >= allowedRadius)
//             return false;
//         double idealR = useHalfEdgesAsIdealR ?
//             CalculateIdealHubRadiusWithAdjacentEdges(metroGraphData, bundlingSettings, v) :
//             v.cachedIdealRadius;

//         Assert.assert(idealR > 0);
//         if (v.Radius >= idealR)
//             return false;
//         double step = 0.05;
//         double delta = step * (idealR - v.Radius);
//         if (delta < 1.0)
//             delta = 1.0;

//         double newR = Math.Min(v.Radius + delta, allowedRadius);
//         if (newR <= v.Radius)
//             return false;

//         v.Radius = newR;
//         return true;
//     }

//     double CalculatePotential(Station v, bool useHalfEdgesAsIdealR) {
//         double idealR = useHalfEdgesAsIdealR ?
//             CalculateIdealHubRadiusWithAdjacentEdges(metroGraphData, bundlingSettings, v) :
//             v.cachedIdealRadius;

//         if (idealR <= v.Radius)
//             return 0.0;
//         return (idealR - v.Radius) / idealR;
//     }

//         #region allowed and desired radii

//
//     // Returns the maximal possible radius of the node
//     // <
//     double CalculateAllowedHubRadius(Station node) {
//         double r = bundlingSettings.MaxHubRadius;

//         //adjacent nodes
//         foreach(Station adj of node.Neighbors) {
//             double dist = (adj.Position - node.Position).length;
//             Assert.assert(dist - 0.05 * (node.Radius + adj.Radius) + 1 >= node.Radius + adj.Radius);
//             r = Math.Min(r, dist / 1.05 - adj.Radius);
//         }
//         //TODO: still we can have two intersecting hubs for not adjacent nodes

//         //obstacles
//         double minimalDistance = metroGraphData.tightIntersections.GetMinimalDistanceToObstacles(node, node.Position, r);
//         if (minimalDistance < r)
//             r = minimalDistance - 0.001;

//         return Math.Max(r, 0.1);
//     }

//         // Returns the ideal radius of the hub
//         // <
//         static double CalculateIdealHubRadius(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, Station node) {
//         double r = 1.0;
//         foreach(Station adj of node.Neighbors) {
//             double width = metroGraphData.GetWidth(adj, node, bundlingSettings.EdgeSeparation);
//             double nr = width / 2.0 + bundlingSettings.EdgeSeparation;
//             r = Math.Max(r, nr);
//         }

//         r = Math.Min(r, 2 * bundlingSettings.MaxHubRadius);
//         return r;
//     }

//     // Returns the ideal radius of the hub
//     // <
//     internal static double CalculateIdealHubRadiusWithNeighbors(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, Station node) {
//         return CalculateIdealHubRadiusWithNeighbors(metroGraphData, bundlingSettings, node, node.Position);
//     }

//     // Returns the ideal radius of the hub
//     // <
//     internal static double CalculateIdealHubRadiusWithNeighbors(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, Station node, Point newPosition) {
//         double r = CalculateIdealHubRadius(metroGraphData, bundlingSettings, node);

//         if (node.Neighbors.Count() > 1) {
//             Station[] adjNodes = node.Neighbors;
//             //there must be enough space between neighbor bundles
//             for (int i = 0; i < adjNodes.length; i++) {
//                 Station adj = adjNodes[i];
//                 Station nextAdj = adjNodes[(i + 1) % adjNodes.length];
//                 r = Math.Max(r, GetMinRadiusForTwoAdjacentBundles(r, node, newPosition, adj, nextAdj, metroGraphData, bundlingSettings));
//             }
//         }
//         r = Math.Min(r, 2 * bundlingSettings.MaxHubRadius);
//         return r;
//     }

//         // Returns the ideal radius of the hub
//         // <
//         static double CalculateIdealHubRadiusWithAdjacentEdges(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, Station node) {
//         double r = bundlingSettings.MaxHubRadius;
//         foreach(var adj of node.Neighbors) {
//             r = Math.Min(r, (node.Position - adj.Position).length / 2);
//         }

//         return r;
//     }

//     internal static double GetMinRadiusForTwoAdjacentBundles(double r, Station node, Point nodePosition, Station adj0, Station adj1,
//         MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//         double w0 = metroGraphData.GetWidth(node, adj0, bundlingSettings.EdgeSeparation);
//         double w1 = metroGraphData.GetWidth(node, adj1, bundlingSettings.EdgeSeparation);

//         return GetMinRadiusForTwoAdjacentBundles(r, nodePosition, adj0.Position, adj1.Position, w0, w1, metroGraphData, bundlingSettings);
//     }

//     // Radius we need to draw to separate adjacent bundles ab and ac
//     // <
//     internal static double GetMinRadiusForTwoAdjacentBundles(double r, Point a, Point b, Point c, double widthAB, double widthAC,
//         MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//         if (widthAB < GeomConstants.distanceEpsilon || widthAC < GeomConstants.distanceEpsilon)
//             return r;

//         double angle = Point.Angle(b, a, c);
//         angle = Math.Min(angle, Math.PI * 2 - angle);
//         if (angle < GeomConstants.distanceEpsilon)
//             return 2 * bundlingSettings.MaxHubRadius;

//         if (angle >= Math.PI / 2)
//             return r * 1.05;

//         //find the intersection point of two bundles
//         double sina = Math.Sin(angle);
//         double cosa = Math.Cos(angle);
//         double aa = widthAB / (4 * sina);
//         double bb = widthAC / (4 * sina);
//         double d = 2 * Math.Sqrt(aa * aa + bb * bb + 2 * aa * bb * cosa);
//         d = Math.Min(d, 2 * bundlingSettings.MaxHubRadius);
//         d = Math.Max(d, r);
//         return d;
//     }

//         #endregion
// }
// }
