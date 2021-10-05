import {join} from 'path'
import {
  GeomGraph,
  Graph,
  Node,
  GeomNode,
  CurveFactory,
  Point,
  ICurve,
  Edge,
  GeomEdge,
} from '../../../..'
import {DrawingGraph} from '../../../../drawing/drawingGraph'
import {EdgeRoutingMode} from '../../../../layoutPlatform/core/routing/EdgeRoutingMode'
import {GeomObject} from '../../../../layoutPlatform/layout/core/geomObject'
import {Size} from '../../../../layoutPlatform/math/geometry/rectangle'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {RectilinearEdgeRouter} from '../../../../layoutPlatform/routing/rectilinear/RectilinearEdgeRouter'
import {runMDSLayout} from '../../../utils/testUtils'

import {sortedList} from '../../layout/sortedBySizeListOfgvFiles'
test('empty graph', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/emptyrectr.svg')
  t.writeGraph(gg)
})

test('two nodes', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const a = addNode(
    gg,
    'a',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(150, 100),
    ),
  )

  const b = addNode(
    gg,
    'b',
    CurveFactory.mkRectangleWithRoundedCorners(20, 10, 1, 1, new Point(100, 0)),
  )

  new GeomEdge(new Edge(a, b))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/tworectr.svg')
  t.writeGraph(gg)
})

test('three nodes', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const a = addNode(
    gg,
    'a',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(150, 100),
    ),
  )

  const b = addNode(
    gg,
    'b',
    CurveFactory.mkRectangleWithRoundedCorners(20, 10, 1, 1, new Point(100, 0)),
  )

  const c = addNode(
    gg,
    'c',
    CurveFactory.mkRectangleWithRoundedCorners(20, 10, 1, 1, new Point(200, 0)),
  )

  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(b, a))
  new GeomEdge(new Edge(b, c))
  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(a, c))
  new GeomEdge(new Edge(c, a))
  new GeomEdge(new Edge(a, c))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/threerectr.svg')
  t.writeGraph(gg)
})

test('four nodes', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const a = addNode(
    gg,
    'a',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(30.05000000000004, 195.94110392619666),
    ),
  )

  const b = addNode(
    gg,
    'b',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(243.11507640382774, 205.0615810745058),
    ),
  )

  const c = addNode(
    gg,
    'c',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(341.7503606207244, 394.1406165636244),
    ),
  )
  const d = addNode(
    gg,
    'd',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(357.54294072486624, 25.099999999999994),
    ),
  )

  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(c, b))
  new GeomEdge(new Edge(b, d))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/fourrectr.svg')
  t.writeGraph(gg)
})
function addNode(gg: GeomGraph, id: string, c: ICurve): Node {
  const node: Node = gg.graph.addNode(new Node(id))

  const geomNodea = new GeomNode(node)
  geomNodea.boundaryCurve = c
  return node
}
test('6 nodes', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))
  const coords = nodeCoords()
  const a = getNode(0)
  const b = getNode(1)
  const c = getNode(2)
  const d = getNode(3)
  const e = getNode(4)
  const f = getNode(5)
  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(a, c))
  new GeomEdge(new Edge(a, d))
  new GeomEdge(new Edge(a, e))
  new GeomEdge(new Edge(a, f))
  new GeomEdge(new Edge(e, f))
  new GeomEdge(new Edge(e, b))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/sixrectr.svg')
  t.writeGraph(gg)

  function getNode(i: number) {
    const n = addNode(
      gg,
      coords[i].id,
      CurveFactory.mkRectangleWithRoundedCorners(
        20,
        10,
        1,
        1,
        new Point(coords[i].x, coords[i].y),
      ),
    )
    return n
  }

  function nodeCoords() {
    return [
      {id: 'a', x: 246, y: 250},
      {id: 'b', x: 240, y: 25},
      {id: 'c', x: 383, y: 430},
      {id: 'd', x: 118, y: 436},
      {id: 'e', x: 30, y: 186},
      {id: 'f', x: 459, y: 175},
    ]
  }
})
test('first 50 dot files', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug

    ++i
    //if (++i != 17) continue

    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f), EdgeRoutingMode.Rectilinear)
    } catch (Error) {
      console.log('i = ' + i + ', ' + f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/' + f + 'rect.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
    if (i > 50) return
  }
})
