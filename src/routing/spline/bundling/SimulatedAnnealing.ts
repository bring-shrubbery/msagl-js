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
// using Microsoft.Msagl.Routing.Visibility;
// using Microsoft.Msagl.DebugHelpers;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Adjust current bundle-routing
//     // <
//     public class SimulatedAnnealing {

//         // bundle data
//         // <
//         readonly MetroGraphData metroGraphData;

//         // Algorithm settings
//         // <
//         readonly BundlingSettings bundlingSettings;

//         //  calculates rouing cost
//         readonly CostCalculator costCalculator;

//         //  used for fast calculation of intersections
//         readonly IntersectionCache cache;

//         // fix routing by simulated annealing algorithm
//         // <
//         internal static bool FixRouting(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//             return FixRouting(metroGraphData, bundlingSettings, null);
//         }

//         internal static bool FixRouting(MetroGraphData metroGraphData, BundlingSettings bundlingSettings, HashSet<Point> changedPoints) {
//         return new SimulatedAnnealing(metroGraphData, bundlingSettings).FixRouting(changedPoints);
//     }

//     SimulatedAnnealing(MetroGraphData metroGraphData, BundlingSettings bundlingSettings) {
//         this.metroGraphData = metroGraphData;
//         this.bundlingSettings = bundlingSettings;
//         costCalculator = new CostCalculator(metroGraphData, bundlingSettings);
//         cache = new IntersectionCache(metroGraphData, bundlingSettings, costCalculator, metroGraphData.Cdt);
//     }

//     const int MaxIterations = 100;
//     const double MaxStep = 50;
//     const double MinStep = 1;
//     const double MinRelativeChange = 0.0005;

//     HashSet < Station > stationsForOptimizations;

//     // Use constraint edge routing to reduce ink
//     // <
//     [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters",
//         MessageId = "Microsoft.Msagl.Routing.Spline.Bundling.GeneralBundling.InkMetric.OutputQ(System.String,Microsoft.Msagl.Routing.Spline.Bundling.GeneralBundling.MetroGraphData,Microsoft.Msagl.Core.Routing.BundlingSettings)"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId = "Microsoft.Msagl.Routing.Spline.Bundling.GeneralBundling.InkMetric.OutputQ(System.String,Microsoft.Msagl.Routing.Spline.Bundling.GeneralBundling.MetroGraphData,Microsoft.Msagl.Routing.Spline.Bundling.BundlingSettings)")]
//     bool FixRouting(HashSet < Point > changedPoints) {
//         stationsForOptimizations = GetStationsForOptimizations(changedPoints);

//         cache.InitializeCostCache();

//         double step = MaxStep;
//         double energy = Number.POSITIVE_INFINITY;

//         Array < Point > x = new Array<Point>(metroGraphData.VirtualNodes().Select(v => v.Position));
//         int iteration = 0;
//         while (iteration++ < MaxIterations) {
//             bool coordinatesChanged = TryMoveNodes();
//             //TimeMeasurer.DebugOutput("  #iter = " + iteration + " moved: " + cnt + "/" + metroGraphData.VirtualNodes().Count() + " step: " + step);

//             if (iteration <= 1 && !coordinatesChanged) return false;
//             if (!coordinatesChanged) break;

//             double oldEnergy = energy;
//             energy = CostCalculator.Cost(metroGraphData, bundlingSettings);
//             //TimeMeasurer.DebugOutput("energy: " + energy);

//             step = UpdateMaxStep(step, oldEnergy, energy);
//             Array < Point > oldX = x;
//             x = new Array<Point>(metroGraphData.VirtualNodes().Select(v => v.Position));
//             if (step < MinStep || Converged(step, oldX, x)) break;
//         }

//         //TimeMeasurer.DebugOutput("SA completed after " + iteration + " iterations");
//         return true;
//     }

//     HashSet < Station > GetStationsForOptimizations(HashSet < Point > changedPoints) {
//         if (changedPoints == null) {
//             return new HashSet<Station>(metroGraphData.VirtualNodes());
//         }
//         else {
//             HashSet < Station > result = new HashSet<Station>();
//             foreach(var p of changedPoints) {
//                 if (metroGraphData.PointToStations.ContainsKey(p)) {
//                     var s = metroGraphData.PointToStations[p];
//                     if (!s.IsRealNode) result.Add(s);
//                 }
//             }
//             return result;
//         }
//     }

//     // stop SA if relative changes are small
//     // <
//     bool Converged(double step, Array < Point > oldx, Array < Point > newx) {
//         //return false;

//         double num = 0, den = 0;
//         for (int i = 0; i < oldx.Count; i++) {
//             num += (oldx[i] - newx[i]).LengthSquared;
//             den += oldx[i].LengthSquared;
//         }
//         double res = Math.Sqrt(num / den);
//         return (res < MinRelativeChange);
//     }

//     int stepsWithProgress = 0;

//     double UpdateMaxStep(double step, double oldEnergy, double newEnergy) {
//         //cooling factor
//         double T = 0.8;
//         if (newEnergy + 1.0 < oldEnergy) {
//             stepsWithProgress++;
//             if (stepsWithProgress >= 5) {
//                 stepsWithProgress = 0;
//                 step = Math.Min(MaxStep, step / T);
//             }
//         }
//         else {
//             stepsWithProgress = 0;
//             step *= T;
//         }

//         return step;
//     }

//     bool TryMoveNodes() {
//         var coordinatesChanged = false;
//         HashSet < Station > movedStations = new HashSet<Station>();
//         //foreach (var node of metroGraphData.VirtualNodes()) {
//         foreach(var node of stationsForOptimizations) {
//             if (TryMoveNode(node)) {
//                 Assert.assert(stationsForOptimizations.Contains(node));

//                 coordinatesChanged = true;

//                 movedStations.Add(node);
//                 foreach(var adj of node.Neighbors)
//                 if (!adj.IsRealNode) movedStations.Add(adj);
//             }
//         }

//         stationsForOptimizations = movedStations;
//         return coordinatesChanged;
//     }

//     // Move node to decrease the cost of the drawing
//     // Returns true iff position has changed
//     // <
//     bool TryMoveNode(Station node) {
//         Point direction = BuildDirection(node);
//         if (direction.length == 0) return false;

//         double stepLength = BuildStepLength(node, direction);
//         if (stepLength < MinStep) {
//             //try random direction
//             direction = Point.RandomPoint();
//             stepLength = BuildStepLength(node, direction);
//             if (stepLength < MinStep)
//                 return false;
//         }

//         Point step = direction * stepLength;
//         Point newPosition = node.Position + step;
//         //can this happen?
//         if (metroGraphData.PointToStations.ContainsKey(newPosition)) return false;

//         metroGraphData.MoveNode(node, newPosition);
//         cache.UpdateCostCache(node);
//         return true;
//     }

//     // Calculate the direction to improve the ink function
//     // <
//     Point BuildDirection(Station node) {
//         var forceInk = BuildForceForInk(node);
//         var forcePL = BuildForceForPathLengths(node);
//         var forceR = BuildForceForRadius(node);
//         var forceBundle = BuildForceForBundle(node);

//         var force = forceInk + forcePL + forceR + forceBundle;
//         if (force.length < 0.1) return new Point();
//         force = force.normalize();

//         return force;
//     }

//     double BuildStepLength(Station node, Point direction) {
//         double stepLength = MinStep;

//         double costGain = CostGain(node, node.Position + direction * stepLength);
//         if (costGain < 0.01)
//             return 0;

//         while (2 * stepLength <= MaxStep) {
//             double newCostGain = CostGain(node, node.Position + direction * stepLength * 2);
//             if (newCostGain <= costGain)
//                 break;

//             stepLength *= 2;
//             costGain = newCostGain;
//         }

//         return stepLength;
//     }

//     // Computes cost delta when moving the node
//     // the cost will be negative if a new position overlaps obstacles
//     // <
//     double CostGain(Station node, Point newPosition) {
//         double MInf = -12345678.0;
//         double rGain = costCalculator.RadiusGain(node, newPosition);
//         if (rGain < MInf) return MInf;
//         double bundleGain = costCalculator.BundleGain(node, newPosition);
//         if (bundleGain < MInf) return MInf;
//         double inkGain = costCalculator.InkGain(node, newPosition);
//         double plGain = costCalculator.PathLengthsGain(node, newPosition);

//         return rGain + inkGain + plGain + bundleGain;
//     }

//     // force to decrease ink
//     // <
//     Point BuildForceForInk(Station node) {
//         //return new Point();
//         Point direction = new Point();
//         foreach(var adj of node.Neighbors) {
//             var p = (adj.Position - node.Position);
//             direction += p / p.length;
//         }

//         //derivative
//         Point force = direction * bundlingSettings.InkImportance;

//         return force;
//     }

//     // direction to decrease path lengths
//     // <
//     Point BuildForceForPathLengths(Station node) {
//         //return new Point();
//         var direction = new Point();

//         foreach(var mni of metroGraphData.MetroNodeInfosOfNode(node)) {
//             var metroline = mni.Metroline;
//             Point u = mni.PolyPoint.next.point;
//             Point v = mni.PolyPoint.Prev.point;

//             var p1 = u - node.Position;
//             var p2 = v - node.Position;
//             direction += p1 / (p1.length * metroline.IdealLength);
//             direction += p2 / (p2.length * metroline.IdealLength);
//         }

//         //derivative
//         Point force = direction * bundlingSettings.PathLengthImportance;

//         return force;
//     }

//     // direction to increase radii
//     // <
//     Point BuildForceForRadius(Station node) {
//         Point direction = new Point();

//         double idealR = node.cachedIdealRadius;
//         Array < Tuple < Polyline, Point >> touchedObstacles;
//         bool res = metroGraphData.looseIntersections.HubAvoidsObstacles(node, node.Position, idealR, out touchedObstacles);
//         Assert.assert(res);

//         foreach(var d of touchedObstacles) {
//             double dist = (d.Item2 - node.Position).length;
//             Assert.assert(dist <= idealR);
//             double lforce = 2.0 * (1.0 - dist / idealR);
//             Point dir = (node.Position - d.Item2).normalize();
//             direction += dir * lforce;
//         }

//         //derivative
//         Point force = direction * bundlingSettings.HubRepulsionImportance;

//         return force;
//     }

//     // direction to push a bundle away from obstacle
//     // <
//     Point BuildForceForBundle(Station node) {
//         var direction = new Point();
//         foreach(var adj of node.Neighbors) {
//             double idealWidth = metroGraphData.GetWidth(node, adj, bundlingSettings.EdgeSeparation);

//             Array < Tuple < Point, Point >> closestPoints;
//             bool res = metroGraphData.cdtIntersections.BundleAvoidsObstacles(node, adj, node.Position, adj.Position, idealWidth / 2, out closestPoints);
//             if (!res) {
// #if TEST_MSAGL && TEST_MSAGL
//                 HubDebugger.ShowHubs(metroGraphData, bundlingSettings, new LineSegment(node.Position, adj.Position));
// #endif
//             }
//             //Assert.assert(res);  //todo : still unsolved

//             foreach(var d of closestPoints) {
//                 double dist = (d.Item1 - d.Item2).length;
//                 Assert.assert(ApproximateComparer.LessOrEqual(dist, idealWidth / 2));
//                 double lforce = 2.0 * (1.0 - dist / (idealWidth / 2));
//                 Point dir = -(d.Item1 - d.Item2).normalize();
//                 direction += dir * lforce;
//             }
//         }

//         //derivative
//         Point force = direction * bundlingSettings.BundleRepulsionImportance;

//         return force;
//     }
// }
// }
