import {ICurve} from './icurve';
import {Curve} from './curve';
import {Point} from './point';
import {Polyline} from './polyline';
import {Rectangle} from './rectangle';
import {Ellipse} from './ellipse';
import {LineSegment} from './lineSegment';
import {BezierSeg} from './bezierSeg';
import {DebugCurve} from './debugCurve';
import {String, StringBuilder} from 'typescript-string-operations';
import {from} from 'linq-to-typescript';

export class SvgDebugWriter {
  // Here we import the File System module of node
  private fs = require('fs');
  private xmlw = require('xml-writer');
  xw: any;
  ws: any;

  constructor(svgFileName: string) {
    this.ws = this.fs.createWriteStream(svgFileName);
    const wsCapture = this.ws;
    this.xw = new this.xmlw(true, function (string: string, encoding) {
      wsCapture.write(string, encoding);
    });
  }

  static getBoundingBox(dcurves: DebugCurve[]): Rectangle {
    const r = Rectangle.mkEmpty();
    for (const c of dcurves) {
      r.addRec(c.icurve.boundingBox());
    }
    const s = Math.max(r.width, r.height);
    r.pad(s / 20);
    return r;
  }

  writeBoundingBox(box: Rectangle) {
    this.xw.writeAttribute('width', box.width);

    this.xw.writeAttribute('version', '1.1');
    this.xw.startElement('g');
    this.xw.writeAttribute('transform', 'translate(' + -box.left + ',' + -box.bottom + ')');
  }

  open(box: Rectangle) {
    this.xw.startElement('svg');
    this.xw.writeAttribute('xmlns:svg', 'http://www.w3.org/2000/svg');
    this.xw.writeAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.xw.writeAttribute('width', box.width);
    this.xw.writeAttribute('height', box.height);
    this.xw.writeAttribute('id', 'svg2');
    this.xw.writeAttribute('version', '1.1');
    this.xw.startElement('g');
    this.xw.writeAttribute('transform', 'translate(' + -box.left + ',' + -box.bottom + ')');
  }

  pointToString(start: Point) {
    return this.doubleToString(start.x) + ' ' + this.doubleToString(start.y);
  }

  doubleToString(d: number) {
    return Math.abs(d) < 1e-11 ? '0' : d.toString(); //formatForDoubleString, CultureInfo.InvariantCulture);
  }

  segmentString(c: ICurve): string {
    const isls = c instanceof LineSegment;
    if (isls) return this.lineSegmentString(c as LineSegment);

    const iscubic = c instanceof BezierSeg;
    if (iscubic) return this.bezierSegToString(c as BezierSeg);

    const isell = c instanceof Ellipse;
    if (isell) return this.ellipseToString(c as Ellipse);

    throw new Error('NotImplementedException');
  }

  lineSegmentString(ls: LineSegment): string {
    return 'L ' + this.pointToString(ls.end());
  }

  pointsToString(points: Point[]) {
    return String.Join(
      ' ',
      from(points)
        .select((p) => this.pointToString(p))
        .toArray(),
    );
  }

  bezierSegToString(cubic: BezierSeg): string {
    return 'C' + this.pointsToString([cubic.B(1), cubic.B(2), cubic.B(3)]);
  }

  static isFullEllipse(ell: Ellipse): boolean {
    return ell.parEnd() == Math.PI * 2 && ell.parStart() == 0;
  }

  ellipseToString(ellipse: Ellipse): string {
    const largeArc = Math.abs(ellipse.parEnd() - ellipse.parStart()) >= Math.PI ? '1' : '0';
    const sweepFlag = ellipse.orientedCounterclockwise() ? '1' : '0';

    return String.Join(
      ' ',
      'A',
      this.ellipseRadiuses(ellipse),
      this.doubleToString(Point.angle(new Point(1, 0), ellipse.aAxis) / (Math.PI / 180.0)),
      largeArc,
      sweepFlag,
      this.pointToString(ellipse.end()),
    );
  }
  ellipseRadiuses(ellipse: Ellipse): string {
    return this.doubleToString(ellipse.aAxis.length()) + ',' + this.doubleToString(ellipse.bAxis.length());
  }

  curveString(iCurve: ICurve): string {
    return String.Join(' ', Array.from(this.curveStringTokens(iCurve)));
  }

  *curveStringTokens(iCurve: ICurve): IterableIterator<string> {
    yield 'M';
    yield this.pointToString(iCurve.start());
    const iscurve = iCurve instanceof Curve;
    if (iscurve) for (const segment of (iCurve as Curve).segs) yield this.segmentString(segment);
    else {
      const islineSeg = iCurve instanceof LineSegment;
      if (islineSeg) {
        yield 'L';
        yield this.pointToString(iCurve.end());
      } else {
        const isbezier = iCurve instanceof BezierSeg;
        if (isbezier) {
          yield this.bezierSegToString(iCurve as BezierSeg);
        } else {
          const ispoly = iCurve instanceof Polyline;
          if (ispoly) {
            const poly = iCurve as Polyline;
            for (const p of poly.skip(1)) {
              yield 'L';
              yield this.pointToString(p.point);
            }
            if (poly.isClosed()) {
              yield 'L';
              yield this.pointToString(poly.start());
            }
          } else {
            const isellipse = iCurve instanceof Ellipse;
            if (isellipse) {
              const ellipse = iCurve as Ellipse;
              if (SvgDebugWriter.isFullEllipse(ellipse)) {
                yield this.ellipseToString(new Ellipse(0, Math.PI, ellipse.aAxis, ellipse.bAxis, ellipse.center));
                yield this.ellipseToString(new Ellipse(Math.PI, Math.PI * 2, ellipse.aAxis, ellipse.bAxis, ellipse.center));
              } else yield this.ellipseToString(ellipse);
            }
          }
        }
      }
    }
  }

  writeStroke(c: DebugCurve) {
    const color = SvgDebugWriter.validColor(c.color);
    this.xw.writeAttribute('stroke', color);
    this.xw.writeAttribute('stroke-opacity', c.transparency / 255.0);
    this.xw.writeAttribute('stroke-width', c.width);
  }

  static validColor(color: string) {
    if (DebugCurve.colors.includes(color)) return color;
    return 'Black';
  }

  dashArrayString(da: number[]): string {
    const stringBuilder = new StringBuilder('stroke-dasharray:');
    for (let i = 0; ; ) {
      stringBuilder.Append(da[i].toString());
      i++;
      if (i < da.length) stringBuilder.Append(' ');
      else {
        stringBuilder.Append(';');
        break;
      }
    }
    return stringBuilder.ToString();
  }

  writeDebugCurve(c: DebugCurve) {
    this.xw.startElement('path');
    this.xw.writeAttribute('fill', 'none');
    const iCurve = c.icurve;
    this.writeStroke(c);
    this.xw.writeAttribute('d', this.curveString(iCurve));
    if (c.dashArray != null) this.xw.writeAttribute('style', this.dashArrayString(c.dashArray));
    this.xw.endElement();
  }

  writeDebugCurves(dcurves: DebugCurve[]) {
    this.open(SvgDebugWriter.getBoundingBox(dcurves));
    for (const c of dcurves) {
      this.writeDebugCurve(c);
    }
    this.close();
  }

  close() {
    this.xw.endElement('g');
    this.xw.endDocument();
    this.xw.flush();
  }

  // this.fs.close();
}
