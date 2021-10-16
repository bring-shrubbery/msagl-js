// using System;
// using System.Collections;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using System.Runtime.InteropServices;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {
//     [DebuggerDisplay("[{SerialNumber}] ({Position.x},{Position.y})")]
// #if SHARPKIT //http://code.google.com/p/sharpkit/issues/detail?id=203
//     //SharpKit/Colin - Interface implementations
//     // (this needs to be public because it's used elsewhere in an interface implementation)
//     public class Station {
//         #else
//         internal class Station {
//         #endif
//         internal Station(int serialNumber, bool isRealNode, Point position) {
//             this.SerialNumber = serialNumber;
//             this.IsRealNode = isRealNode;
//             this.Position = position;
//         }

//         // id of the station (used for comparison)
//         // <
//         internal readonly int SerialNumber;

//         // if true the station is a center of an obstacle
//         // <
//         internal readonly bool IsRealNode;

//         // radius of the corresponding hub
//         // <
//         internal double Radius;

//         // position of the corresponding hub
//         // <
//         internal Point Position;

//         // neighbors sorted in counter-clockwise order around the station
//         // <
//         internal Station[] Neighbors;

//         // it maps each neighbor to its hub
//         // <
//         internal Map<Station, BundleBase> BundleBases = new Map<Station, BundleBase>();

//         // it maps a node to a set of tight polylines that can contain the node
//         // <
//         internal Set<Polyline> EnterableTightPolylines;

//         // it maps a node to a set of loose polylines that can contain the node
//         // <
//         internal Set<Polyline> EnterableLoosePolylines;

//         // MetroNodeInfos corresponding to the node
//         // <
//         internal Array<MetroNodeInfo> MetroNodeInfos = new Array<MetroNodeInfo>();

//         // curve of the hub
//         // <
//         internal ICurve BoundaryCurve;

//         public static bool operator<(Station a, Station b) {
//             Assert.assert(a == b || a.SerialNumber != b.SerialNumber);
//             return a.SerialNumber < b.SerialNumber;
//         }

//         public static bool operator > (Station a, Station b) {
//         Assert.assert(a == b || a.SerialNumber != b.SerialNumber);
//         return a.SerialNumber > b.SerialNumber;
//     }

//         #region cache

//     // triangle of cdt where the station is situated
//     // <
//     internal CdtTriangle CdtTriangle;

//     internal double cachedRadiusCost;

//     internal double cachedBundleCost;

//     internal double cachedIdealRadius;

//         #endregion

//     internal void AddEnterableLoosePolyline(Polyline poly) {
//         if (EnterableLoosePolylines == null)
//             EnterableLoosePolylines = new Set<Polyline>();
//         EnterableLoosePolylines.Insert(poly);
//     }
//     internal void AddEnterableTightPolyline(Polyline poly) {
//         if (EnterableTightPolylines == null)
//             EnterableTightPolylines = new Set<Polyline>();
//         EnterableTightPolylines.Insert(poly);
//     }
// }
// }
