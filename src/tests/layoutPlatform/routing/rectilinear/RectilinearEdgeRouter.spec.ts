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
import {runMDSLayout} from '../../layout/mds/PivotMDS.spec'
import {sortedList} from '../../layout/sortedBySizeListOfgvFiles'
xtest('empty graph', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/emptyrectr.svg')
  t.writeGraph(gg)
})

xtest('two nodes', () => {
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

xtest('three nodes', () => {
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
  new GeomEdge(new Edge(a, c))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/threerectr.svg')
  t.writeGraph(gg)
})

xtest('four nodes', () => {
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
  const d = addNode(
    gg,
    'd',
    CurveFactory.mkRectangleWithRoundedCorners(
      20,
      10,
      1,
      1,
      new Point(150, -50),
    ),
  )

  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(a, c))
  new GeomEdge(new Edge(a, d))

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
test('first 50 dot files', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug

    // ++i
    if (++i != 23) continue

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
