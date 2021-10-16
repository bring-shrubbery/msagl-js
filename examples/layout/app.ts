import {
  GeomGraph,
  SugiyamaLayoutSettings,
  LayeredLayout,
  CancelToken,
  Size,
} from "msagl-js";

function measureTextSize(str: string): Size {
  return new Size(str.length * 8 + 8, 20);
}

async function main() {
  const resp = await fetch(
    "https://gist.githubusercontent.com/mohdsanadzakirizvi/6fc325042ce110e1afc1a7124d087130/raw/ab9a310cfc2003f26131a7149950947645391e28/got_social_graph.json"
  );
  const data = await resp.json();

  const nodeMap: any = {};
  const g = GeomGraph.mk("graph", new Size(0, 0));
  for (const node of data.nodes) {
    nodeMap[node.id] = node;
    g.setNode(node.character, measureTextSize(node.character));
  }
  for (const edge of data.links) {
    g.setEdge(nodeMap[edge.source].character, nodeMap[edge.target].character);
  }

  const layoutSettings = new SugiyamaLayoutSettings();
  const layout = new LayeredLayout(g, layoutSettings, new CancelToken());
  layout.run();

  console.log(layout);
}

main();
