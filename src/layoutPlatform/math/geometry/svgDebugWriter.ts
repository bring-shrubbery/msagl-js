import {ICurve} from './icurve'
import {Curve} from './curve'
import {Point} from './point'
import {Polyline} from './polyline'
import {Rectangle} from './rectangle'
import {Ellipse} from './ellipse'
import {LineSegment} from './lineSegment'
import {BezierSeg} from './bezierSeg'
import {DebugCurve} from './debugCurve'
import {String, StringBuilder} from 'typescript-string-operations'
import {from} from 'linq-to-typescript'
import {allVerticesOfParall} from './parallelogram'
import {GeomEdge} from './../../layout/core/geomEdge'
import {GeomGraph} from '../../layout/core/GeomGraph'
import {GeomLabel} from './../../layout/core/geomLabel'
import {PlaneTransformation} from './planeTransformation'
import {SmoothedPolyline} from './smoothedPolyline'

export class SvgDebugWriter {
  // Here we import the File System module of node
  private fs = require('fs')
  private xmlw = require('xml-writer')
  xw: any
  ws: any
  readonly arrowAngle = 25

  constructor(svgFileName: string) {
    this.ws = this.fs.createWriteStream(svgFileName)
    const wsCapture = this.ws
    this.xw = new this.xmlw(true, function (string: string, encoding) {
      wsCapture.write(string, encoding)
    })
  }

  static getBoundingBox(dcurves: DebugCurve[]): Rectangle {
    const r = Rectangle.mkEmpty()
    for (const c of dcurves) {
      r.addRec(c.icurve.boundingBox)
    }
    const s = Math.max(r.width, r.height)
    r.pad(s / 20)
    return r
  }

  writeBoundingBox(box: Rectangle) {
    this.xw.writeAttribute('width', box.width)

    this.xw.writeAttribute('version', '1.1')
    this.xw.startElement('g')
    this.xw.writeAttribute(
      'transform',
      'translate(' + -box.left + ',' + -box.bottom + ')',
    )
  }

  open(box: Rectangle) {
    this.xw.startElement('svg')
    this.xw.writeAttribute('xmlns:svg', 'http://www.w3.org/2000/svg')
    this.xw.writeAttribute('xmlns', 'http://www.w3.org/2000/svg')
    this.xw.writeAttribute('width', box.width)
    this.xw.writeAttribute('height', box.height)
    this.xw.writeAttribute('version', '1.1')
    this.xw.startElement('g')
    // this.xw.writeAttribute(
    //   'transform',
    //   'translate(' + -box.left + ',' + -box.bottom + ')',
    // )
  }

  static pointToString(start: Point) {
    return (
      SvgDebugWriter.doubleToString(start.x) +
      ' ' +
      SvgDebugWriter.doubleToString(start.y)
    )
  }

  static doubleToString(d: number) {
    return Math.abs(d) < 1e-11 ? '0' : d.toString() //formatForDoubleString, CultureInfo.InvariantCulture);
  }

  static segmentString(c: ICurve): string {
    const isls = c instanceof LineSegment
    if (isls) return this.lineSegmentString(c as LineSegment)

    const iscubic = c instanceof BezierSeg
    if (iscubic) return this.bezierSegToString(c as BezierSeg)

    const isell = c instanceof Ellipse
    if (isell) return this.ellipseToString(c as Ellipse)

    throw new Error('NotImplementedException')
  }

  static lineSegmentString(ls: LineSegment): string {
    return 'L ' + SvgDebugWriter.pointToString(ls.end)
  }

  static pointsToString(points: Point[]) {
    return String.Join(
      ' ',
      from(points)
        .select((p) => SvgDebugWriter.pointToString(p))
        .toArray(),
    )
  }

  static bezierSegToString(cubic: BezierSeg): string {
    return 'C' + this.pointsToString([cubic.B(1), cubic.B(2), cubic.B(3)])
  }

  static isFullEllipse(ell: Ellipse): boolean {
    return ell.parEnd == Math.PI * 2 && ell.parStart == 0
  }

  static ellipseToString(ellipse: Ellipse): string {
    const largeArc =
      Math.abs(ellipse.parEnd - ellipse.parStart) >= Math.PI ? '1' : '0'
    const sweepFlag = ellipse.orientedCounterclockwise() ? '1' : '0'

    return String.Join(
      ' ',
      'A',
      this.ellipseRadiuses(ellipse),
      SvgDebugWriter.doubleToString(
        Point.angle(new Point(1, 0), ellipse.aAxis) / (Math.PI / 180.0),
      ),
      largeArc,
      sweepFlag,
      SvgDebugWriter.pointToString(ellipse.end),
    )
  }
  static ellipseRadiuses(ellipse: Ellipse): string {
    return (
      SvgDebugWriter.doubleToString(ellipse.aAxis.length) +
      ',' +
      SvgDebugWriter.doubleToString(ellipse.bAxis.length)
    )
  }

  static curveString(iCurve: ICurve): string {
    return String.Join(
      ' ',
      Array.from(SvgDebugWriter.curveStringTokens(iCurve)),
    )
  }

  static *curveStringTokens(iCurve: ICurve): IterableIterator<string> {
    yield 'M'
    yield SvgDebugWriter.pointToString(iCurve.start)
    const iscurve = iCurve instanceof Curve
    if (iscurve)
      for (const segment of (iCurve as Curve).segs)
        yield SvgDebugWriter.segmentString(segment)
    else {
      const islineSeg = iCurve instanceof LineSegment
      if (islineSeg) {
        yield 'L'
        yield SvgDebugWriter.pointToString(iCurve.end)
      } else {
        const isbezier = iCurve instanceof BezierSeg
        if (isbezier) {
          yield this.bezierSegToString(iCurve as BezierSeg)
        } else {
          const ispoly = iCurve instanceof Polyline
          if (ispoly) {
            const poly = iCurve as Polyline
            for (const p of poly.skip(1)) {
              yield 'L'
              yield SvgDebugWriter.pointToString(p.point)
            }
            if (poly.closed) {
              yield 'L'
              yield SvgDebugWriter.pointToString(poly.start)
            }
          } else {
            const isellipse = iCurve instanceof Ellipse
            if (isellipse) {
              const ellipse = iCurve as Ellipse
              if (SvgDebugWriter.isFullEllipse(ellipse)) {
                yield this.ellipseToString(
                  new Ellipse(
                    0,
                    Math.PI,
                    ellipse.aAxis,
                    ellipse.bAxis,
                    ellipse.center,
                  ),
                )
                yield this.ellipseToString(
                  new Ellipse(
                    Math.PI,
                    Math.PI * 2,
                    ellipse.aAxis,
                    ellipse.bAxis,
                    ellipse.center,
                  ),
                )
              } else yield this.ellipseToString(ellipse)
            }
          }
        }
      }
    }
  }

  writeStroke(c: DebugCurve, div = 1) {
    const color = SvgDebugWriter.validColor(c.color)
    this.xw.writeAttribute('stroke', color)
    this.xw.writeAttribute('stroke-opacity', c.transparency / 255.0 / div)
    this.xw.writeAttribute('stroke-width', c.width / div)
  }

  static validColor(color: string) {
    if (DebugCurve.colors.includes(color)) return color
    return 'Black'
  }

  dashArrayString(da: number[]): string {
    const stringBuilder = new StringBuilder('stroke-dasharray:')
    for (let i = 0; ; ) {
      stringBuilder.Append(da[i].toString())
      i++
      if (i < da.length) stringBuilder.Append(' ')
      else {
        stringBuilder.Append(';')
        break
      }
    }
    return stringBuilder.ToString()
  }

  writeDebugCurve(c: DebugCurve) {
    this.xw.startElement('path')
    this.xw.writeAttribute('fill', 'none')
    const iCurve = c.icurve
    this.writeStroke(c)
    this.xw.writeAttribute('d', SvgDebugWriter.curveString(iCurve))
    if (c.dashArray != null)
      this.xw.writeAttribute('style', this.dashArrayString(c.dashArray))
    this.xw.endElement()

    // parallelogram node
    if (c.drawPN) {
      this.xw.startElement('path')
      this.xw.writeAttribute('fill', 'none')
      const poly = new Polyline()
      const pn = c.icurve.pNodeOverICurve()
      for (const p of allVerticesOfParall(pn.parallelogram)) {
        poly.addPoint(p)
      }
      poly.closed = true
      this.writeStroke(c, 2)
      this.xw.writeAttribute('d', SvgDebugWriter.curveString(poly))
      if (c.dashArray != null)
        this.xw.writeAttribute('style', this.dashArrayString(c.dashArray))
      this.xw.endElement()
    }
  }

  writeDebugCurves(dcurves: DebugCurve[]) {
    flipDebugCurvesByY(dcurves)
    this.open(SvgDebugWriter.getBoundingBox(dcurves))
    for (const c of dcurves) {
      this.writeDebugCurve(c)
    }
    this.close()
  }

  close() {
    this.xw.endElement('g')
    this.xw.endDocument()
    this.xw.flush()
  }

  static dumpICurves(fileName: string, icurves: ICurve[]) {
    const w = new SvgDebugWriter(fileName)
    const dcs = icurves.map((c) => DebugCurve.mkDebugCurveI(c))
    w.writeDebugCurves(dcs)
    w.close()
  }
  static dumpDebugCurves(fileName: string, debugCurves: DebugCurve[]) {
    const w = new SvgDebugWriter(fileName)
    w.writeDebugCurves(debugCurves)
  }

  writeGraph(g: GeomGraph) {
    this.open(g.boundingBox)
    for (const e of g.edges()) {
      this.writeEdge(e)
    }
    for (const n of g.nodes()) {
      this.writeDebugCurve(DebugCurve.mkDebugCurveI(n.boundaryCurve))
      const box = n.boundingBox
      this.writeNodeLabel(n.id, box)
    }
    this.close()
  }

  writeLabelText(text: string, xContainer: number) {
    this.xw.startElement('tspan')
    this.xw.writeAttribute('x', xContainer)
    this.xw.writeAttribute('dy', 0)

    this.xw.writeRaw(text)
    this.xw.endElement()
  }

  writeNodeLabel(id: string, label: Rectangle) {
    const yScaleAdjustment = 1.5

    const x = label.center.x - label.width / 2
    const y = label.center.y + label.height / (2 * yScaleAdjustment)
    const fontSize = 16
    this.xw.startElement('text')
    this.xw.writeAttribute('x', x)
    this.xw.writeAttribute('y', y)
    this.xw.writeAttribute('font-family', 'Arial')
    this.xw.writeAttribute('font-size', fontSize)
    this.xw.writeAttribute('fill', 'Black')
    this.writeLabelText(id, x)
    this.xw.endElement()
  }

  private writeEdge(edge: GeomEdge) {
    const icurve = edge.curve // mkFromeSmothPolyline(edge.underlyingPolyline)
    if (icurve == null) return
    this.xw.startElement('path')
    this.xw.writeAttribute('fill', 'none')
    this.xw.writeAttribute('stroke', 'Black')

    this.xw.writeAttribute('d', SvgDebugWriter.curveString(icurve))
    this.xw.endElement()
    if (edge.edgeGeometry != null && edge.edgeGeometry.sourceArrowhead != null)
      this.addArrow(icurve.start, edge.edgeGeometry.sourceArrowhead.tipPosition)
    if (edge.edgeGeometry != null && edge.edgeGeometry.targetArrowhead != null)
      this.addArrow(icurve.end, edge.edgeGeometry.targetArrowhead.tipPosition)
    if (edge.label != null) this.writeLabel(edge.label)
  }

  writeLabel(label: GeomLabel) {
    const dc = DebugCurve.mkDebugCurveI(label.boundingBox.perimeter())
    dc.transparency = 124
    dc.width /= 2
    this.writeDebugCurve(dc)
  }

  addArrow(start: Point, end: Point) {
    let dir = end.sub(start)
    const l = dir.length
    dir = dir.div(l).rotate90Ccw()
    dir = dir.mul(l * Math.tan(this.arrowAngle * 0.5 * (Math.PI / 180.0)))
    this.drawArrowPolygon([start.add(dir), end, start.sub(dir)])
  }

  drawPolygon(points: Point[]) {
    this.xw.writeStartElement('polygon')
    this.xw.writeAttribute('stroke', 'Black')
    this.xw.writeAttribute('fill', 'none')
    this.xw.writeAttribute('points', SvgDebugWriter.pointsToString(points))
    this.xw.endElement()
  }

  drawArrowPolygon(points: Point[]) {
    this.xw.startElement('polygon')
    this.xw.writeAttribute('stroke', 'Black')
    this.xw.writeAttribute('fill', 'none')
    this.xw.writeAttribute('points', SvgDebugWriter.pointsToString(points))
    this.xw.endElement()
  }
}
function flipDebugCurvesByY(dcurves: DebugCurve[]) {
  const matrix = new PlaneTransformation(1, 0, 0, 0, -1, 0)
  for (const dc of dcurves) {
    dc.icurve = dc.icurve.transform(matrix)
  }
}
function mkFromeSmothPolyline(underlyingPolyline: SmoothedPolyline) {
  const ret = new Polyline()
  for (const p of underlyingPolyline.points()) {
    ret.addPoint(p)
  }
  return ret
}
