import { longestPath, slack } from "./util";
import { feasibleTree } from "./feasible-tree";
import { Graph, alg } from "graphlib";
import * as _ from "lodash";

/*
 * The network simplex algorithm assigns layers to each node in the input graph
 * and iteratively improves the layering to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minlen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "layer" attribute that has
 *       been optimized by the network simplex algorithm. layers start at 0.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial layers to each node. We use the longest path algorithm,
 *       which assigns layers to the lowest position possible. In general this
 *       leads to very wide bottom layers and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minlen for the edge). This by itself greatly improves the assigned
 *       layerings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 */
export function networkSimplex(g): Graph {
  //make sure each edge has weight
  g = init(g);

  longestPath(g);

  const fTree = feasibleTree(g);

  initLowLimValues(fTree);

  initCutValues(fTree, g);

  let e, f;
  while ((e = leaveEdge(fTree))) {
    f = enterEdge(fTree, g, e);
    exchangeEdges(fTree, g, e, f);
  }

  return g;
}

/*
 * Initializes cut values for all edges in the tree.
 */
function initCutValues(t, g) {
  let vs = alg.postorder(t, t.nodes());
  vs = vs.slice(0, vs.length - 1);
  _.forEach(vs, function (v) {
    assignCutValue(t, g, v);
  });
}

function assignCutValue(t, g, child) {
  let childLab = t.node(child);
  let parent = childLab.parent;
  t.edge(child, parent).cutvalue = calcCutValue(t, g, child);
}

/*
 * Given the tight tree, its graph, and a child in the graph calculate and
 * return the cut value for the edge between the child and its parent.
 */
function calcCutValue(t, g, child) {
  let childLab = t.node(child);
  let parent = childLab.parent;
  // True if the child is on the tail end of the edge in the directed graph
  let childIsTail = true;
  // The graph's view of the tree edge we're inspecting
  let graphEdge = g.edge(child, parent);
  // The accumulated cut value for the edge between this node and its parent
  let cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g.edge(parent, child);
  }

  cutValue = graphEdge.weight;

  _.forEach(g.nodeEdges(child), function (e) {
    let isOutEdge = e.v === child,
      other = isOutEdge ? e.w : e.v;

    if (other !== parent) {
      let pointsToHead = isOutEdge === childIsTail,
        otherWeight = g.edge(e).weight;

      cutValue += pointsToHead ? otherWeight : -otherWeight;
      if (isTreeEdge(t, child, other)) {
        let otherCutValue = t.edge(child, other).cutvalue;
        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
      }
    }
  });

  return cutValue;
}

function initLowLimValues(tree, root?) {
  if (arguments.length < 2) {
    root = tree.nodes()[0];
  }

  dfsAssignLowLim(tree, {}, 1, root);
}

function dfsAssignLowLim(tree, visited, nextLim, v, parent?) {
  let low = nextLim;
  let label = tree.node(v);

  visited[v] = true;
  _.forEach(tree.neighbors(v), function (w) {
    if (!_.has(visited, w)) {
      nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
    }
  });

  label.low = low;
  label.lim = nextLim++;
  if (parent) {
    label.parent = parent;
  } else {
    // TODO should be able to remove this when we incrementally update low lim
    delete label.parent;
  }

  return nextLim;
}

function leaveEdge(tree) {
  return _.find(tree.edges(), function (e) {
    return tree.edge(e).cutvalue < 0;
  });
}

function enterEdge(t, g, edge) {
  let v = edge.v;
  let w = edge.w;

  // For the rest of this function we assume that v is the tail and w is the
  // head, so if we don't have this edge in the graph we should flip it to
  // match the correct orientation.
  if (!g.hasEdge(v, w)) {
    v = edge.w;
    w = edge.v;
  }

  let vLabel = t.node(v);
  let wLabel = t.node(w);
  let tailLabel = vLabel;
  let flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if (vLabel.lim > wLabel.lim) {
    tailLabel = wLabel;
    flip = true;
  }

  let candidates = _.filter(g.edges(), function (edge) {
    return flip === isDescendant(t, t.node(edge.v), tailLabel) && flip !== isDescendant(t, t.node(edge.w), tailLabel);
  });

  return _.minBy(candidates, function (edge) {
    return slack(g, edge);
  });
}

function exchangeEdges(t, g, e, f) {
  let v = e.v;
  let w = e.w;
  t.removeEdge(v, w);
  t.setEdge(f.v, f.w, {});
  initLowLimValues(t);
  initCutValues(t, g);
  updatelayers(t, g);
}

function updatelayers(t, g) {
  let root = _.find(t.nodes(), function (v) {
    return !g.node(v).parent;
  });
  let vs = alg.preorder(t, root);
  vs = vs.slice(1);
  _.forEach(vs, function (v) {
    let parent = t.node(v).parent,
      edge = g.edge(v, parent),
      flipped = false;

    if (!edge) {
      edge = g.edge(parent, v);
      flipped = true;
    }

    g.node(v).layer = g.node(parent).layer + (flipped ? edge.minlen : -edge.minlen);
  });
}

/*
 * Returns true if the edge is in the tree.
 */
function isTreeEdge(tree, u, v) {
  return tree.hasEdge(u, v);
}

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
function isDescendant(tree, vLabel, rootLabel) {
  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
}

function init(g) {
  let simplified = new Graph().setGraph(g.graph());
  _.forEach(g.nodes(), function (v) {
    simplified.setNode(v, g.node(v));
  });
  _.forEach(g.edges(), function (e) {
    let simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
    let label = g.edge(e);
    simplified.setEdge(e.v, e.w, {
      weight: label && label.weight ? label.weight : 1,
      minlen: Math.max(simpleLabel.minlen, label && label.minlen ? label.minlen : 1),
    });
  });
  return simplified;
}
