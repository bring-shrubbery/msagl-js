import {join} from 'path'
import {
  CancelToken,
  GeomGraph,
  Graph,
  LayeredLayout,
  SugiyamaLayoutSettings,
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

xtest('three nodes', () => {
  const gg = new GeomGraph(new Graph('graph'), new Size(0, 0))

  const a = addNode(
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
    'b',
    CurveFactory.mkRectangleWithRoundedCorners(20, 10, 1, 1, new Point(100, 0)),
  )

  const c = addNode(
    'c',
    CurveFactory.mkRectangleWithRoundedCorners(20, 10, 1, 1, new Point(200, 0)),
  )

  new GeomEdge(new Edge(a, b))
  new GeomEdge(new Edge(a, c))

  const rr = RectilinearEdgeRouter.constructorGNNB(gg, 1, 3, true)
  rr.run()

  const t: SvgDebugWriter = new SvgDebugWriter('/tmp/rectr.svg')
  t.writeGraph(gg)

  function addNode(id: string, c: ICurve): Node {
    const node: Node = gg.graph.addNode(new Node(id))

    const geomNodea = new GeomNode(node)
    geomNodea.boundaryCurve = c
    return node
  }
})
xtest('first 50 dot files', () => {
  const path = 'src/tests/data/graphvis/'
  let i = 0
  for (const f of sortedList) {
    if (f.match('big(.*).gv')) continue // the parser bug
    if (++i == 1) continue
    let dg: DrawingGraph
    try {
      dg = runMDSLayout(join(path, f), EdgeRoutingMode.Rectilinear)
    } catch (Error) {
      console.log('i = ' + i + ', ' + f + ' error:' + Error.message)
      expect(1).toBe(0)
    }
    if (dg != null) {
      const t: SvgDebugWriter = new SvgDebugWriter('/tmp/pivot' + f + '.svg')
      t.writeGraph(GeomObject.getGeom(dg.graph) as GeomGraph)
    }
    if (i > 50) return
  }
})
