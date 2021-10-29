import {DrawingEdge} from '.'
import {
  CurveFactory,
  Edge,
  GeomEdge,
  GeomGraph,
  GeomLabel,
  GeomNode,
  ICurve,
  Point,
  Rectangle,
  Size,
} from '..'
import {Graph, Node} from '..'
import {GeomObject} from '../layout/core/geomObject'
import {Ellipse} from '../math/geometry/ellipse'
import {DrawingNode} from './drawingNode'
import {DrawingObject} from './drawingObject'
import {ShapeEnum} from './shapeEnum'

type GraphVisData = {
  sameRanks: string[][]
  minRanks: string[]
  maxRanks: string[]
  sourceRanks: string[]
  sinkRanks: string[]
}

export class DrawingGraph extends DrawingObject {
  defaultNode: DrawingNode // this node does not belong to the graph,
  // but serves as a template for the attributes (like filledColor, style, etc.)
  graphVisData: GraphVisData = {
    sameRanks: new Array<string[]>(),
    minRanks: new Array<string>(),
    maxRanks: new Array<string>(),
    sourceRanks: new Array<string>(),
    sinkRanks: new Array<string>(),
  }
  get graph(): Graph {
    return this.attrCont as Graph
  }

  findNode(id: string): DrawingNode {
    const gr = this.graph
    const n = gr.findNode(id)
    if (n == null) return null
    return DrawingObject.getDrawingObj(n) as DrawingNode
  }

  hasDirectedEdge(): boolean {
    for (const e of this.graph.edges) {
      const drawingEdge = <DrawingEdge>DrawingObject.getDrawingObj(e)
      if (drawingEdge.directed) {
        return true
      }
    }
    return false
  }

  createGeometry(textMeasure: (label: string) => Size): void {
    new GeomGraph(this.graph)
    for (const n of this.graph.deepNodes) {
      this.createNodeGeometry(n, textMeasure)
    }
    for (const e of this.graph.edges) {
      this.createEdgeGeometry(e, textMeasure)
    }
  }
  createEdgeGeometry(e: Edge, textMeasure: (label: string) => Size) {
    const de = <DrawingEdge>DrawingEdge.getDrawingObj(e)
    const ge = new GeomEdge(e)
    if (de.directed == false) {
      ge.edgeGeometry.targetArrowhead = null
    }
    if (e.label) {
      const size = textMeasure(e.label.text)
      ge.label = new GeomLabel(
        Rectangle.mkPP(new Point(0, 0), new Point(size.width, size.height)),
        e.label,
      )
    }
  }

  curveByShape(
    width: number,
    height: number,
    center: Point,
    shape: ShapeEnum,
    drawingNode: DrawingNode,
  ): ICurve {
    let curve: ICurve
    switch (shape) {
      case ShapeEnum.DoubleCircle:
      case ShapeEnum.Diamond:
        curve = CurveFactory.CreateDiamond(width, height, center)
        break
      case ShapeEnum.Ellipse:
        break
      case ShapeEnum.Box:
        curve = CurveFactory.mkRectangleWithRoundedCorners(
          width,
          height,
          drawingNode.XRadius,
          drawingNode.YRadius,
          center,
        )
        break
      case ShapeEnum.Circle:
        curve = CurveFactory.mkCircle(width / 2, center)
        break
      case ShapeEnum.Record:
        return null
      case ShapeEnum.Plaintext:
        return null
      case ShapeEnum.Point:
        break
      case ShapeEnum.Mdiamond:
        break
      case ShapeEnum.Msquare:
        break
      case ShapeEnum.Polygon:
        break
      case ShapeEnum.DoubleCircle:
        curve = CurveFactory.mkCircle(width / 2, center)
        break
      case ShapeEnum.House:
        curve = CurveFactory.createHouse(width, height, center)
        break
      case ShapeEnum.InvHouse:
        curve = CurveFactory.createInvertedHouse(width, height, center)
        break
      case ShapeEnum.Parallelogram:
        break
      case ShapeEnum.Octagon:
        curve = CurveFactory.createOctagon(width, height, center)
        break
      case ShapeEnum.TripleOctagon:
        break
      case ShapeEnum.Triangle:
        break
      case ShapeEnum.Trapezium:
        break
      case ShapeEnum.DrawFromGeometry:
        break
      case ShapeEnum.Hexagon:
        curve = CurveFactory.createHexagon(width, height, center)
        break
    }
    return curve ?? Ellipse.mkFullEllipseNNP(width / 2, height / 2, center)
  }

  createNodeGeometry(n: Node, textMeasure: (label: string) => Size): void {
    if (n.isGraph) return

    const drawingNode = <DrawingNode>DrawingNode.getDrawingObj(n)
    let nodeSize = new Size(1, 1)
    if (drawingNode.labelText) {
      nodeSize = textMeasure(drawingNode.labelText)
    }
    const width = nodeSize.width
    const height = nodeSize.height
    const center = new Point(0, 0)
    const geomNode = new GeomNode(n)
    geomNode.boundaryCurve = this.curveByShape(
      width,
      height,
      center,
      drawingNode.shapeEnum,
      drawingNode,
    )
  }
}
