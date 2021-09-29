# msagl-js
## Sugiyama Scheme
Currently the Sugiyma Scheme seems working. It creates a layout with
layers, where, if your directed graph does not have cycles, every
edge points down. Here is an API example in Typescript
```typescript

// Create a new geometry graph
  const g = GeomGraph.mk('graph', new Size(0, 0))
  // Add nodes to the graph. The first argument is the node id, the
  second is the node size.
  g.setNode('kspacey', {width: 144, height: 100})
  g.setNode('swilliams', {width: 160, height: 100})
  g.setNode('bpitt', {width: 108, height: 100})
  g.setNode('hford', {width: 168, height: 100})
  g.setNode('lwilson', {width: 144, height: 100})
  g.setNode('kbacon', {width: 121, height: 100})

  // Add edges to the graph.
  g.setEdge('kspacey', 'swilliams')
  g.setEdge('swilliams', 'kbacon')
  g.setEdge('bpitt', 'kbacon')
  g.setEdge('hford', 'lwilson')
  g.setEdge('lwilson', 'kbacon')
  const ss = new SugiyamaLayoutSettings()
  const ll = new LayeredLayout(g, ss, new CancelToken())
  ll.run()
 /// ... consume graph 'g' here
``` 
The generated layout should look like this:
![Alt text](./showAPI.svg)

## Multi Dimensional Scaling
Multi Dimensional Scaling layout should work too, but the routing is
only with straight lines for now. If the lines from the code above 
``` typescript
const ss = new SugiyamaLayoutSettings()
const ll = new LayeredLayout(g, ss, new CancelToken())
``` 
are replaced by 
``` typescript
const settings = new MdsLayoutSettings()
settings.edgeRoutingMode = EdgeRoutingMode.StraightLine
layoutGraph(g, null, () => settings)
``` 
then the layout should look like this 
![Alt text](./mdsShowAPI.svg)
  


![Test Status](https://github.com/msaglJS/msagl-js/workflows/Test%20Status/badge.svg?branch=master)
