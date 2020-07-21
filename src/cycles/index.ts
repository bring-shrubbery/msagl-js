import _ = require("lodash");

function dfsFAS(g) {
  const fas = [];
  const stack = {};
  const visited = {};

  function dfs(v) {
    if (_.has(visited, v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    _.forEach(g.outEdges(v), function (e) {
      if (_.has(stack, e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  }

  _.forEach(g.nodes(), dfs);
  return fas;
}

export function removeCycles(g) {
  const fas = dfsFAS(g);
  _.forEach(fas, function (e) {
    const label = g.edge(e);
    g.removeEdge(e);
    label.reversed = true;
    g.setEdge(e.w, e.v, label, _.uniqueId("rev"));
  });

  return g;
}
