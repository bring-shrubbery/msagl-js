import {Graph} from '../../structs/graph'
import {Rectangle, Size} from '../../math/geometry/rectangle'
import {GeomObject} from './geomObject'
import {GeomNode} from './geomNode'
import {GeomEdge} from './geomEdge'
import {PlaneTransformation} from '../../math/geometry/planeTransformation'
import {Point} from '../../math/geometry/point'
import {OptimalRectanglePacking} from '../../math/geometry/rectanglePacking/OptimalRectanglePacking'
import {
  LayoutSettings,
  SugiyamaLayoutSettings,
} from '../layered/SugiyamaLayoutSettings'
// import {Curve} from '../../math/geometry/curve'
// import {Ellipse} from '../../math/geometry/ellipse'
// import {Entity} from '../../structs/entity'

// packs the subgraphs and set the bounding box of the parent graph
export function optimalPackingRunner(
  geomGraph: GeomGraph,
  subGraphs: GeomGraph[],
) {
  const originalLeftBottoms = new Array<{g: GeomGraph; lb: Point}>()
  for (const g of subGraphs) {
    originalLeftBottoms.push({g: g, lb: g.boundingBox.leftBottom.clone()})
  }
  const rectangles = subGraphs.map((g) => g.boundingBox)
  const packing = new OptimalRectanglePacking(
    rectangles,
    1.5, // TODO - pass as a parameter: PackingAspectRatio,
  )
  packing.run()
  for (const {g, lb} of originalLeftBottoms) {
    const delta = g.boundingBox.leftBottom.sub(lb)
    g.translate(delta)
  }
  geomGraph.boundingBox = new Rectangle({
    left: 0,
    bottom: 0,
    right: packing.PackedWidth,
    top: packing.PackedHeight,
  })
}

export class GeomGraph extends GeomNode {
  setSettingsRecursively(ls: LayoutSettings) {
    this.layoutSettings = ls
    for (const n of this.deepNodes()) {
      const gg = <GeomGraph>n
      gg.layoutSettings = ls
    }
  }
  private _layoutSettings: LayoutSettings
  public get layoutSettings(): LayoutSettings {
    return this._layoutSettings
  }

  // recursively sets the same settings for subgraphs
  public set layoutSettings(value: LayoutSettings) {
    this._layoutSettings = value
  }
  translate(delta: Point) {
    if (delta.x == 0 && delta.y == 0) return
    const m = new PlaneTransformation(1, 0, delta.x, 0, 1, delta.y)
    this.transform(m)
  }
  _boundingBox: Rectangle
  labelSize = new Size(0, 0)
  public get boundingBox(): Rectangle {
    return this._boundingBox
  }
  public set boundingBox(value: Rectangle) {
    this._boundingBox = value
    /*
    if (this.boundaryCurve) {
      // suppose it is a rectangle with rounded corners
      if (this.boundaryCurve instanceof Curve) {
        const r = <Curve>this.boundaryCurve
        let rx = 0
        let ry = 0
        for (const seg of r.segs) {
          if (seg instanceof Ellipse) {
            const ell = <Ellipse>seg
            rx = ell.aAxis.length
            ry = ell.bAxis.length
            break
          }
        }
        this.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
          value.width,
          value.height,
          rx,
          ry,
          value.center,
        )
      }
    }*/
  }
  isGraph(): boolean {
    return true
  }
  transform(matrix: PlaneTransformation) {
    if (matrix.isIdentity()) return
    if (this.boundaryCurve != null)
      this.boundaryCurve = this.boundaryCurve.transform(matrix)

    for (const n of this.shallowNodes()) {
      n.transform(matrix)
    }
    for (const e of this.edges()) {
      e.transform(matrix)
    }
    this.updateBoundingBox()
  }
  *deepNodes(): IterableIterator<GeomNode> {
    for (const n of this.graph.deepNodes) {
      yield GeomObject.getGeom(n) as unknown as GeomNode
    }
  }
  setEdge(s: string, t: string): GeomEdge {
    const structEdge = this.graph.setEdge(s, t)
    return new GeomEdge(structEdge)
  }

  MinimalWidth = 0
  MinimalHeight = 0
  pumpTheBoxToTheGraphWithMargins(minSeparation: number): Rectangle {
    const t = {b: Rectangle.mkEmpty()}
    this.pumpTheBoxToTheGraph(t)
    t.b.pad(Math.max(this.Margins, minSeparation))
    if (this.MinimalWidth > 0)
      t.b.width = Math.max(t.b.width, this.MinimalWidth)
    if (this.MinimalHeight > 0)
      t.b.height = Math.max(t.b.height, this.MinimalHeight)

    this._boundingBox = t.b

    return t.b
  }

  // Fields which are set by Msagl
  // return the center of the curve bounding box
  get center() {
    return this.boundingBox ? this.boundingBox.center : new Point(0, 0)
  }

  set center(value: Point) {
    const del = value.sub(this.center)
    const t = new PlaneTransformation(1, 0, del.x, 0, 1, del.y)
    this.transform(t)
  }

  pumpTheBoxToTheGraph(t: {b: Rectangle}) {
    for (const e of this.edges()) {
      if (e.underCollapsedCluster()) continue
      if (e.curve != null) {
        const cb = e.curve.boundingBox
        cb.pad(e.lineWidth)
        t.b.addRecSelf(cb)
      }
      if (e.label != null) t.b.addRecSelf(e.label.boundingBox)
    }

    for (const n of this.shallowNodes()) {
      if (n.underCollapsedCluster() || !n.boundingBox) continue
      t.b.addRecSelf(n.boundingBox)
    }
  }

  get left() {
    return this.boundingBox.left
  }
  get right() {
    return this.boundingBox.right
  }
  get top() {
    return this.boundingBox.top
  }
  get bottom() {
    return this.boundingBox.bottom
  }
  CheckClusterConsistency(): boolean {
    throw new Error('Method not implemented.')
  }
  Margins = 10
  get edgeCount() {
    return this.graph.edgeCount
  }

  *shallowNodes(): IterableIterator<GeomNode> {
    for (const n of this.graph.shallowNodes)
      yield GeomObject.getGeom(n) as GeomNode
  }

  *edges(): IterableIterator<GeomEdge> {
    for (const n of this.graph.edges) yield GeomObject.getGeom(n) as GeomEdge
  }

  static mk(id: string, labelSize: Size = new Size(0, 0)): GeomGraph {
    const g = new GeomGraph(new Graph(id))
    g.labelSize = labelSize
    return g
  }

  *subgraphs(): IterableIterator<GeomGraph> {
    for (const g of this.graph.subgraphs()) {
      yield <GeomGraph>GeomObject.getGeom(g)
    }
  }

  static mkWithGraphAndLabel(graph: Graph, labelSize: Size): GeomGraph {
    const g = new GeomGraph(graph)
    g.labelSize = labelSize
    return g
  }

  constructor(graph: Graph) {
    super(graph)
  }

  get height() {
    return this.boundingBox.height
  }

  get width() {
    return this.boundingBox.width
  }

  get shallowNodeCount() {
    return this.graph.shallowNodeCount
  }

  get graph() {
    return this.attrCont as Graph
  }

  liftNode(n: GeomNode): GeomNode {
    const liftedNode = this.graph.liftNode(n.node)
    return liftedNode ? <GeomNode>GeomObject.getGeom(liftedNode) : null
  }

  findNode(id: string): GeomNode {
    const n = this.graph.findNode(id)
    if (!n) return null
    return <GeomNode>GeomObject.getGeom(n)
  }

  addNode(gn: GeomNode): GeomNode {
    this.graph.addNode(gn.node)
    return gn
  }

  updateBoundingBox(): void {
    if (this.graph.isEmpty()) {
      this._boundingBox = Rectangle.mkEmpty()
      return
    }
    const rect = Rectangle.mkEmpty()
    let padding = 0
    for (const e of this.graph.edges) {
      const ge = GeomObject.getGeom(e) as GeomEdge
      if (ge.curve == null) continue
      rect.addRecSelf(ge.boundingBox)
      padding = Math.max(padding, ge.lineWidth)
    }
    for (const gn of this.shallowNodes()) {
      if (gn.boundingBox) {
        rect.addRecSelf(gn.boundingBox)
        padding = Math.max(padding, gn.padding)
      }
    }
    this.addLabelToGraphBB(rect)

    rect.pad(Math.max(padding, this.Margins))
    this.boundingBox = rect
  }

  addLabelToGraphBB(rect: Rectangle) {
    if (this.labelSize) {
      rect.top += this.labelSize.height + 2 // for label margin
      if (rect.width < this.labelSize.width) {
        rect.width = this.labelSize.width
      }
    }
  }

  FlipYAndMoveLeftTopToOrigin() {
    this.transform(new PlaneTransformation(1, 0, -this.left, 0, -1, this.top))
  }
}
