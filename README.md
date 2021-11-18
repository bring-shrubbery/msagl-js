# msagl-js

## Sugiyama Scheme

Here is the layered layout example, or Sugiyama Scheme. By default, it creates a layout with
the nodes positioned on horizontal layers, where, if your directed graph does not have cycles, every
edge spans at least one layer down. Here is an API example in Typescript

```typescript
// Create a new geometry graph
const g = GeomGraph.mk('graph', new Size(0, 0))
// Add nodes to the graph. The first argument is the node id. The second is the size string
setNode(g, 'kspacey', 10, 10)
setNode(g, 'swilliams', 10, 10)
setNode(g, 'bpitt', 10, 10)
setNode(g, 'hford', 10, 10)
setNode(g, 'lwilson', 10, 10)
setNode(g, 'kbacon', 10, 10)

// Add edges to the graph.
g.setEdge('kspacey', 'swilliams')
g.setEdge('swilliams', 'kbacon')
g.setEdge('bpitt', 'kbacon')
g.setEdge('hford', 'lwilson')
g.setEdge('lwilson', 'kbacon')
layoutGraphWithSugiayma(g)
/// ... consume graph 'g' here
```

The generated layout should look like this:
![Alt text](./docs/images/showAPI.svg)

That is the function that prepares a GeometryNode for layout.

```typescript
function setNode(
  g: GeomGraph,
  id: string,
  xRad: number,
  yRad: number,
): GeomNode {
  let node = g.graph.findNode(id)
  if (node == null) {
    g.graph.addNode((node = new Node(id)))
  }
  const geomNode = new GeomNode(node)
  const size = measureTextSize(id)
  geomNode.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
    size.width,
    size.height,
    xRad,
    yRad,
    new Point(0, 0),
  )
  return geomNode
}
```

## Multi Dimensional Scaling

Multi Dimensional Scaling works: the routing is with just straight or rectilinear edges for now. The routing with smooth edges avoiding the nodes is not implemented yet. If you replate in the example above the line

```typescript
layoutGraphWithSugiayma(g)
```

by the line

```typescript
layoutGraphWithMDS(g)
```

then the layout should look like this
![Alt text](./docs/images/mdsShowAPI.svg)

![Test Status](https://github.com/msaglJS/msagl-js/workflows/Test%20Status/badge.svg?branch=master)
