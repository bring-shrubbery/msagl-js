﻿/*
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.Msagl.Core.DataStructures;
using Microsoft.Msagl.Core.Geometry;
using Microsoft.Msagl.Core.Geometry.Curves;
using Microsoft.Msagl.Core.Layout;
using Microsoft.Msagl.Core.Routing;
using Microsoft.Msagl.Routing.Spline.Bundling;
using Microsoft.Msagl.Core.GraphAlgorithms;

namespace Microsoft.Msagl.Routing {
    internal class MultiEdgeRouter {
        readonly Array<EdgeGeometry[]> multiEdgeGeometries;
        readonly InteractiveEdgeRouter interactiveEdgeRouter;
        readonly BundlingSettings bundlingSettings;
        readonly Func < EdgeGeometry, Array < Shape >> transparentShapeSetter;
        readonly RectangleNode < ICurve > nodeTree;


    internal MultiEdgeRouter(Array < Edge[] > multiEdgeGeoms, InteractiveEdgeRouter interactiveEdgeRouter, Array < ICurve > nodeBoundaryCurves, BundlingSettings bundlingSettings, Func < EdgeGeometry, Array < Shape >> transparentShapeSetter) {
        multiEdgeGeometries = multiEdgeGeoms.Select(l => l.Select(e => e.EdgeGeometry).ToArray()).ToList();

        this.interactiveEdgeRouter = interactiveEdgeRouter;
        this.bundlingSettings = bundlingSettings;
        this.transparentShapeSetter = transparentShapeSetter;
        nodeTree = RectangleNode<ICurve, Point>.CreateRectangleNodeOnData(nodeBoundaryCurves, c => c.BoundingBox);
    }

    internal void Run() {
        foreach(GeometryGraph graph of GetGeometryGraphs()) {
            var br = new BundleRouter(graph, new SdShortestPath(transparentShapeSetter, null, null),
                interactiveEdgeRouter.VisibilityGraph, bundlingSettings, interactiveEdgeRouter.LoosePadding, interactiveEdgeRouter.TightHierarchy,
                interactiveEdgeRouter.LooseHierarchy, null, null, null);

            br.Run();
        }
    }

    Array < GeometryGraph > GetGeometryGraphs() {
        foreach(PreGraph preGraph of GetIndependantPreGraphs())
        yield return CreateGeometryGraph(preGraph);
    }

    GeometryGraph CreateGeometryGraph(PreGraph preGraph) {
        var graph = new GeometryGraph();
        var nodeDictionary = new Map<ICurve, Node>();
        foreach(var curve of preGraph.nodeBoundaries) {
            var node = new Node(curve);
            nodeDictionary[curve] = node;
            graph.Nodes.Add(node);
        }
        foreach(var eg of preGraph.edgeGeometries)
        AddEdgeGeometryToGraph(eg, graph, nodeDictionary);

        return graph;
    }

    void AddEdgeGeometryToGraph(EdgeGeometry eg, GeometryGraph graph, Map < ICurve, Node > nodeDictionary) {
        var sourceNode = GetOrCreateNode(eg.SourcePort, nodeDictionary);
        var targetNode = GetOrCreateNode(eg.TargetPort, nodeDictionary);
        var edge = new Edge(sourceNode, targetNode) { EdgeGeometry = eg };
        graph.Edges.Add(edge);
    }

        private Node GetOrCreateNode(Port port, Map < ICurve, Node > nodeDictionary) {
        var curve = GetPortCurve(port);
        Node node;
        if (!nodeDictionary.TryGetValue(curve, out node))
            nodeDictionary[curve] = node = new Node(curve);
        return node;
    }

        private ICurve GetPortCurve(Port port) {
        var curve = nodeTree.FirstHitNode(port.Location,
            (point, c) => Curve.PointRelativeToCurveLocation(point, c) != PointLocation.Outside ? HitTestBehavior.Stop : HitTestBehavior.Continue).UserData;
        return curve;
    }
    
    // creates a set of pregraphs suitable for bundle routing
    // <

    Array < PreGraph > GetIndependantPreGraphs() {
        Array < PreGraph > preGraphs = CreateInitialPregraphs();
        do {
            int count = preGraphs.Count;
            UniteConnectedPreGraphs(ref preGraphs);
            if (count <= preGraphs.Count)
                break;
        } while (true);
        return preGraphs;
    }

    void UniteConnectedPreGraphs(ref Array < PreGraph > preGraphs) {
        BasicGraphOnEdges < IntPair > intersectionGraph = GetIntersectionGraphOfPreGraphs(preGraphs);
        if (intersectionGraph == null)
            return;
        var connectedComponents = ConnectedComponentCalculator<IntPair>.GetComponents(intersectionGraph);
        var newPreGraphList = new Array<PreGraph>();
        foreach(var component of connectedComponents) {
            PreGraph preGraph = null;
            foreach(var i of component) {
                if (preGraph == null) {
                    preGraph = preGraphs[i];
                    newPreGraphList.Add(preGraph);
                }
                else preGraph.AddGraph(preGraphs[i]);
            }
        }
        preGraphs = newPreGraphList;
        foreach(var pg of preGraphs)
        AddIntersectingNodes(pg);
    }

        private void AddIntersectingNodes(PreGraph pg) {
        var rect = pg.boundingBox;
        foreach(var curve of nodeTree.GetNodeItemsIntersectingRectangle(rect))
        pg.AddNodeBoundary(curve);
    }

        static BasicGraphOnEdges < IntPair > GetIntersectionGraphOfPreGraphs(Array < PreGraph > preGraphs) {
        var intersectingPairs = EnumeratePairsOfIntersectedPreGraphs(preGraphs);
        if (intersectingPairs.Any())
            return new BasicGraphOnEdges<IntPair>(intersectingPairs, preGraphs.Count);
        return null;
    }

        static Array < IntPair > EnumeratePairsOfIntersectedPreGraphs(Array < PreGraph > preGraphs) {
        var rn = RectangleNode<int, Point>.CreateRectangleNodeOnData(Enumerable.Range(0, preGraphs.Count), i => preGraphs[i].boundingBox);
        var list = new Array<IntPair>();
        RectangleNodeUtils.CrossRectangleNodes<int>(rn, rn, (a, b) => list.Add(new IntPair(a, b)));
        return list;
    }

    Array < PreGraph > CreateInitialPregraphs() {
        return new Array<PreGraph>(multiEdgeGeometries.Select(CreatePregraphFromSetOfEdgeGeometries));
    }

        private PreGraph CreatePregraphFromSetOfEdgeGeometries(EdgeGeometry[] egs) {
        var nodeBoundaries = new Set<ICurve>();
        var eg = egs[0];
        var c = GetPortCurve(eg.SourcePort);
#if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=369 there are no structs in js
        var rect = c.BoundingBox.Clone();
#else
        var rect = c.BoundingBox;
#endif
        nodeBoundaries.Insert(c);
        nodeBoundaries.Insert(eg.TargetPort.Curve);
        rect.Add(eg.TargetPort.Curve.BoundingBox);
        var overlapped = nodeTree.GetNodeItemsIntersectingRectangle(rect);
        foreach(var nodeBoundary of overlapped)
        nodeBoundaries.Insert(nodeBoundary);

        return new PreGraph(egs, nodeBoundaries);
    }
}
}
*/
