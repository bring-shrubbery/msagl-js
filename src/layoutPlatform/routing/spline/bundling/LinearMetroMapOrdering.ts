﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core.Layout;
// using Microsoft.Msagl.DebugHelpers;

// namespace Microsoft.Msagl.Routing.Spline.Bundling {

//     // Linear algorithm as described in our paper
//     // Edge Routing with Ordered Bunldles
//     // <
//     public class LinearMetroMapOrdering : IMetroMapOrderingAlgorithm {

//         // bundle lines
//         // <
//         readonly Array < Metroline > MetrolinesGlobal;

//         Array < int[] > Metrolines;

//         // Station positions
//         // <
//         Point[] positions;

//         // Initialize bundle graph and build the ordering
//         // <
//         internal LinearMetroMapOrdering(Array < Metroline > MetrolinesGlobal, Map < Point, Station > pointToIndex) {
//             this.MetrolinesGlobal = MetrolinesGlobal;

//             ConvertParameters(pointToIndex);

//             BuildOrder();
//         }

//         // Get the ordering of lines on station u with respect to the edge (u->v)
//         // <
//         IEnumerable < Metroline > IMetroMapOrderingAlgorithm.GetOrder(Station u, Station v) {
//             MetroEdge me = MetroEdge.CreateFromTwoNodes(u.SerialNumber, v.SerialNumber);
//             Array < int > orderedMetrolineListForUv = order[me];
//             if (u.SerialNumber < v.SerialNumber) {
//                 foreach(int MetrolineIndex of orderedMetrolineListForUv)
//                 yield return MetrolinesGlobal[MetrolineIndex];
//             }
//             else {
//                 for (int i = orderedMetrolineListForUv.Count - 1; i >= 0; i--)
//                 yield return MetrolinesGlobal[orderedMetrolineListForUv[i]];
//             }
//         }

//         // Get the index of line on the edge (u->v) and node u
//         // <
//         int IMetroMapOrderingAlgorithm.GetLineIndexInOrder(Station u, Station v, Metroline Metroline) {
//             MetroEdge me = MetroEdge.CreateFromTwoNodes(u.SerialNumber, v.SerialNumber);
//             Map < Metroline, int > d = lineIndexInOrder[me];
//             if (u.SerialNumber < v.SerialNumber) {
//                 return d[Metroline];
//             }
//             else {
//                 return d.Count - 1 - d[Metroline];
//             }
//         }

//         void ConvertParameters(Map < Point, Station > pointToIndex) {
//             Metrolines = new Array<int[]>();
//             positions = new Point[pointToIndex.Count];
//             foreach(Metroline gline of MetrolinesGlobal) {
//                 Array < int > line = new Array<int>();
//                 foreach(Point p of gline.Polyline) {
//                     line.Add(pointToIndex[p].SerialNumber);
//                     positions[pointToIndex[p].SerialNumber] = p;
//                 }

//                 Metrolines.Add(line.ToArray());
//             }
//         }

//         //order for node u of edge u->v
//         Map < MetroEdge, Array < int >> order;
//         Map < MetroEdge, Map < Metroline, int >> lineIndexInOrder;

//         HashSet < int > nonTerminals;
//         HashSet < MetroEdge > initialEdges;

//         // Edge in graph H
//         // label is used to distinguish multiple edges
//         // <
//         class MetroEdge {
//             Array<int> nodes;

//             internal static MetroEdge CreateFromTwoNodes(int u, int v) {
//                 MetroEdge res = new MetroEdge();
//                 res.nodes = new Array<int>();
//                 res.nodes.Add(Math.Min(u, v));
//                 res.nodes.Add(Math.Max(u, v));

// #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289
//                 res.UpdateHashKey();
// #endif

//                 return res;
//             }

//             internal static MetroEdge CreateFromTwoEdges(int v, MetroEdge e1, MetroEdge e2) {
//                 int s = e1.Source() == v ? e1.Target() : e1.Source();
//                 int t = e2.Source() == v ? e2.Target() : e2.Source();

//                 if (s < t)
//                     return CreateFromTwoEdges(v, e1.nodes, e2.nodes);
//                 else
//                     return CreateFromTwoEdges(v, e2.nodes, e1.nodes);
//             }

//             internal static MetroEdge CreateFromTwoEdges(int v, Array<int> e1, Array < int > e2) {
//             Array < int > nodes = new Array<int>(e1.Count + e2.Count - 1);
//             if (e1[0] != v) {
//                 for (int i = 0; i < e1.Count; i++)
//                 nodes.Add(e1[i]);
//             }
//             else {
//                 for (int i = e1.Count - 1; i >= 0; i--)
//                 nodes.Add(e1[i]);
//             }

//             if (e2[0] == v) {
//                 for (int i = 1; i < e2.Count; i++)
//                 nodes.Add(e2[i]);
//             }
//             else {
//                 for (int i = e2.Count - 2; i >= 0; i--)
//                 nodes.Add(e2[i]);
//             }

//             MetroEdge res = new MetroEdge();
//             res.nodes = nodes;
// #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289
//             res.UpdateHashKey();
// #endif
//             return res;
//         }

//         internal int Source() {
//             return nodes[0];
//         }

//         internal int Target() {
//             return nodes[nodes.Count - 1];
//         }

//             public override string ToString() {
//             string s = "(";
//             foreach(int i of nodes)
//             s += i + " ";
//             s += ")";
//             return s;
//         }

//         int label;
//         bool labelCached = false;

// #if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289 Support Map directly based on object's GetHashCode
//             private SharpKit.JavaScript.JsString _hashKey;
//             private void UpdateHashKey()
//         {
//             _hashKey = GetHashCode().ToString();
//         }
// #endif

//             public override int GetHashCode()
//         {
//             if (!labelCached) {
//                 ulong hc = (ulong)nodes.Count;
//                 for (int i = 0; i < nodes.Count; i++) {
//                     hc = unchecked(hc * 314159 + (ulong)nodes[i]);
//                 }

//                 label = (int)hc;
//                 labelCached = true;
//             }

//             return label;
//         }

//             // overrides the equality
//             // <

//             public override bool Equals(object obj) {
//             if (!(obj is MetroEdge))
//             return false;
//             return (MetroEdge)obj == this;

//         }

//             public static bool operator == (MetroEdge pair0, MetroEdge pair1) {
//             if (pair0.GetHashCode() != pair1.GetHashCode()) return false;
//             return true;
//             //TODO: are conflicts possible?
//             //return pair0.nodes.SequenceEqual(pair1.nodes);
//         }

//             public static bool operator != (MetroEdge pair0, MetroEdge pair1) {
//             return !(pair0 == pair1);
//         }

//     }

//     // unordered list of paths on a specified edge
//     // <
//     class PathList {
//         internal MetroEdge edge;
//         internal HashSet<PathOnEdge> paths;
//         internal Array<PathList> subLists;

//         public override string ToString() {
//         return edge.ToString() + " (" + paths.Count + ")";
//     }
// }

// class PathOnEdge {
//     internal int index;
//     internal LinkedListNode<MetroEdge> node;

//     public override string ToString() {
//     string s = "(index = " + index + ")";
//     return s;
// }
//         }

// Map < int, LinkedList < MetroEdge >> orderedAdjacent;
// Map < Tuple < int, MetroEdge >, LinkedListNode < MetroEdge >> adjacencyIndex;

// Map < MetroEdge, PathList > e2p;
// Map < int, LinkedList < MetroEdge >> paths;

// // Do the main job
// // <
// void BuildOrder() {
//     //init local structures
//     Initialize();

//     //ordering itself
//     foreach(int v of nonTerminals) {
//         ProcessNonTerminal(v);
//     }

//     //get result
//     RestoreResult();
// }

// void Initialize() {
//     //non terminals and adjacent
//     nonTerminals = new HashSet<int>();
//     initialEdges = new HashSet<MetroEdge>();
//     //non-sorted adjacent edges. will be sorted later
//     Map < int, HashSet < MetroEdge >> adjacent = new Map<int, HashSet<MetroEdge>>();
//     for (int mi = 0; mi < Metrolines.Count; mi++) {
//         int[] Metroline = Metrolines[mi];
//         for (int i = 0; i + 1 < Metroline.length; i++) {
//             MetroEdge me = MetroEdge.CreateFromTwoNodes(Metroline[i], Metroline[i + 1]);

//             if (!initialEdges.Contains(me))
//                 initialEdges.Add(me);

//             if (i + 2 < Metroline.length)
//                 nonTerminals.Add(Metroline[i + 1]);

//             CollectionUtilities.AddToMap(adjacent, Metroline[i], me);
//             CollectionUtilities.AddToMap(adjacent, Metroline[i + 1], me);
//         }
//     }

//     //order neighbors around each vertex
//     InitAdjacencyData(adjacent);

//     //create e2p and paths...
//     InitPathData();
// }

// void InitPathData() {
//     paths = new Map<int, LinkedList<MetroEdge>>();
//     e2p = new Map<MetroEdge, PathList>();
//     for (int mi = 0; mi < Metrolines.Count; mi++) {
//         int[] Metroline = Metrolines[mi];
//         paths.Add(mi, new LinkedList<MetroEdge>());

//         for (int i = 0; i + 1 < Metroline.length; i++) {
//             MetroEdge me = MetroEdge.CreateFromTwoNodes(Metroline[i], Metroline[i + 1]);

//             if (!e2p.ContainsKey(me)) {
//                 PathList pl = new PathList();
//                 pl.edge = me;
//                 pl.paths = new HashSet<PathOnEdge>();
//                 e2p.Add(me, pl);
//             }

//             PathOnEdge pathOnEdge = new PathOnEdge();
//             pathOnEdge.index = mi;
//             pathOnEdge.node = paths[mi].AddLast(me);
//             e2p[me].paths.Add(pathOnEdge);
//         }
//     }
// }

// void InitAdjacencyData(Map < int, HashSet < MetroEdge >> adjacent) {
//     orderedAdjacent = new Map<int, LinkedList<MetroEdge>>();
//     adjacencyIndex = new Map<Tuple<int, MetroEdge>, LinkedListNode<MetroEdge>>();
//     foreach(int v of adjacent.Keys) {
//         Array < MetroEdge > adj = new Array<MetroEdge>(adjacent[v]);
//         orderedAdjacent.Add(v, SortAdjacentEdges(v, adj));
//     }
// }

// LinkedList < MetroEdge > SortAdjacentEdges(int v, Array < MetroEdge > adjacent) {
//     MetroEdge mn = adjacent.First();
//     int mnv = OppositeNode(mn, v);
//     adjacent.Sort(delegate(MetroEdge edge1, MetroEdge edge2) {
//         int a = OppositeNode(edge1, v);
//         int b = OppositeNode(edge2, v);

//         //TODO: remove angles!
//         double angA = Point.Angle(positions[a] - positions[v], positions[mnv] - positions[v]);
//         double angB = Point.Angle(positions[b] - positions[v], positions[mnv] - positions[v]);

//         return angA.CompareTo(angB);
//     });

//     LinkedList < MetroEdge > res = new LinkedList<MetroEdge>();
//     foreach(MetroEdge edge of adjacent) {
//         LinkedListNode < MetroEdge > node = res.AddLast(edge);
//         adjacencyIndex.Add(new Tuple<int, MetroEdge>(v, edge), node);
//     }
//     return res;
// }

// // update adjacencies of node 'a': put new edges instead of oldEdge
// // <
// void UpdateAdjacencyData(int a, MetroEdge oldEdge, Array < PathList > newSubList) {
//     //find a (cached) position of oldEdge in order
//     LinkedListNode < MetroEdge > node = adjacencyIndex[new Tuple<int, MetroEdge>(a, oldEdge)];
//     Assert.assert(node.Value == oldEdge);

//     LinkedListNode < MetroEdge > inode = node;
//     foreach(PathList pl of newSubList) {
//         MetroEdge newEdge = pl.edge;

//         if (oldEdge.Source() == a)
//             node = node.Array.AddAfter(node, newEdge);
//         else
//             node = node.Array.AddBefore(node, newEdge);

//         adjacencyIndex.Add(new Tuple<int, MetroEdge>(a, newEdge), node);
//     }

//     adjacencyIndex.Remove(new Tuple<int, MetroEdge>(a, oldEdge));
//     inode.Array.Remove(inode);
// }

// // recursively build an order on the edge
// // <
// Array < int > RestoreResult(MetroEdge edge) {
//     Array < int > res = new Array<int>();

//     PathList pl = e2p[edge];
//     if (pl.subLists == null) {
//         foreach(PathOnEdge path of pl.paths)
//         res.Add(path.index);
//     }
//     else {
//         foreach(PathList subList of pl.subLists) {
//             Array < int > subResult = RestoreResult(subList.edge);
//             if (!(edge.Source() == subList.edge.Source() || edge.Target() == subList.edge.Target()))
//                 subResult.Reverse();
//             res.AddRange(subResult);
//         }
//     }
//     return res;
// }

// void RestoreResult() {
//     order = new Map<MetroEdge, Array<int>>();
//     lineIndexInOrder = new Map<MetroEdge, Map<Metroline, int>>();
//     foreach(MetroEdge me of initialEdges) {
//         order.Add(me, RestoreResult(me));
//         Map < Metroline, int > d = new Map<Metroline, int>();
//         int index = 0;
//         foreach(int v of order[me]) {
//             d[MetrolinesGlobal[v]] = index++;
//         }
//         lineIndexInOrder.Add(me, d);
//     }
// }

// // Remove vertex v from the graph. Update graph and paths correspondingly
// // <
// void ProcessNonTerminal(int v) {
//     //oldEdge => sorted PathLists
//     Map < MetroEdge, Array < PathList >> newSubLists = RadixSort(v);

//     //update current data
//     foreach(MetroEdge oldEdge of orderedAdjacent[v]) {
//         Assert.assert(e2p.ContainsKey(oldEdge));
//         Array < PathList > newSubList = newSubLists[oldEdge];

//         //update e2p[oldEdge]
//         e2p[oldEdge].paths = null;
//         e2p[oldEdge].subLists = newSubList;

//         //update ordered adjacency data
//         UpdateAdjacencyData(OppositeNode(oldEdge, v), oldEdge, newSubList);

//         //update paths and add new edges
//         foreach(PathList pl of newSubList) {
//             MetroEdge newEdge = pl.edge;

//             //we could check the reverse edge before
//             if (e2p.ContainsKey(newEdge)) continue;

//             //add e2p for new edge
//             e2p.Add(newEdge, pl);

//             //update paths
//             foreach(PathOnEdge path of pl.paths) {
//                 UpdatePath(path, v, newEdge);
//             }
//         }
//     }
// }

// // Linear sorting of paths passing through vertex v
// // <
// Map < MetroEdge, Array < PathList >> RadixSort(int v) {
//     //build a map [old_edge => list_of_paths_on_it]; the relative order of paths is important
//     Map < MetroEdge, Array < PathOnEdge >> r = new Map<MetroEdge, Array<PathOnEdge>>();
//     //first index in circular order
//     Map < MetroEdge, int > firstIndex = new Map<MetroEdge, int>();

//     foreach(MetroEdge oldEdge of orderedAdjacent[v]) {
//         PathList pathList = e2p[oldEdge];
//         foreach(PathOnEdge path of pathList.paths) {
//             MetroEdge ej = FindNextEdgeOnPath(v, path);
//             CollectionUtilities.AddToMap(r, ej, path);
//         }

//         firstIndex.Add(oldEdge, (r.ContainsKey(oldEdge) ? r[oldEdge].Count : 0));
//     }

//     //oldEdge => SortedPathLists
//     Map < MetroEdge, Array < PathList >> res = new Map<MetroEdge, Array<PathList>>();
//     //build the desired order for each edge
//     foreach(MetroEdge oldEdge of orderedAdjacent[v]) {
//         //r[oldEdge] is the right order! (up to the circleness)
//         Array < PathOnEdge > paths = r[oldEdge];
//         Assert.assert(paths.Count > 0);

//         Array < PathList > subLists = new Array<PathList>();
//         HashSet < PathOnEdge > curPathSet = new HashSet<PathOnEdge>();

//         for (int j = 0; j < paths.Count; j++) {

//             int i = (j + firstIndex[oldEdge]) % paths.Count;
//             MetroEdge nowEdge = paths[i].node.Value;
//             MetroEdge nextEdge = paths[(i + 1) % paths.Count].node.Value;

//             curPathSet.Add(paths[i]);

//             if (j == paths.Count - 1 || nowEdge != nextEdge) {
//                 //process
//                 MetroEdge newEdge = MetroEdge.CreateFromTwoEdges(v, oldEdge, nowEdge);
//                 PathList pl = new PathList();
//                 pl.edge = newEdge;
//                 pl.paths = curPathSet;
//                 subLists.Add(pl);

//                 //clear
//                 curPathSet = new HashSet<PathOnEdge>();
//             }
//         }

//         if (oldEdge.Source() == v) subLists.Reverse();
//         res.Add(oldEdge, subLists);
//     }

//     return res;
// }

// // extract the next edge on a given path after node v
// // <
// MetroEdge FindNextEdgeOnPath(int v, PathOnEdge pathOnEdge) {
//     if (pathOnEdge.node.next != null) {
//         int o = OppositeNode(pathOnEdge.node.next.Value, v);
//         if (o != -1) return pathOnEdge.node.next.Value;
//     }

//     if (pathOnEdge.node.Previous != null) {
//         int o = OppositeNode(pathOnEdge.node.Previous.Value, v);
//         if (o != -1) return pathOnEdge.node.Previous.Value;
//     }

//     throw new NotSupportedException();
// }

// // return an opposite vertex of a given edge
// // <
// int OppositeNode(MetroEdge edge, int v) {
//     if (edge.Source() == v) return edge.Target();
//     if (edge.Target() == v) return edge.Source();

//     return -1;
// }

// // replace edges (av) and (vb) with edge (ab) on a given path
// // <
// void UpdatePath(PathOnEdge pathOnEdge, int v, MetroEdge newEdge) {
//     LinkedListNode < MetroEdge > f = pathOnEdge.node;
//     Assert.assert(f.Value.Source() == v || f.Value.Target() == v);

//     int a, b;

//     a = OppositeNode(f.Value, v);

//     if (f.next != null && (b = OppositeNode(f.next.Value, v)) != -1) {
//         Assert.assert((a == newEdge.Source() || a == newEdge.Target()));
//         Assert.assert((b == newEdge.Source() || b == newEdge.Target()));

//         f.Value = newEdge;
//         f.Array.Remove(f.next);
//     }
//     else if (f.Previous != null && (b = OppositeNode(f.Previous.Value, v)) != -1) {
//         Assert.assert((a == newEdge.Source() || a == newEdge.Target()));
//         Assert.assert((b == newEdge.Source() || b == newEdge.Target()));

//         f.Value = newEdge;
//         f.Array.Remove(f.Previous);
//     }
//     else
//         throw new NotSupportedException();
// }
//     }

// }
