import {Ellipse} from './ellipse';
import {Curve} from './curve';
import {Point} from './point';
import {LineSegment} from './lineSegment';
import {PlaneTransformation} from './planeTransformation';
import {ICurve} from './icurve';
type RoundedRectRadii = {
  radX: number;
  radY: number;
};
export class CurveFactory {
  static rotateCurveAroundCenterByDegree(curve: ICurve, center: Point, angle: number) {
    return CurveFactory.rotateCurveAroundCenterByRadian(curve, center, (angle * Math.PI) / 180);
  }

  static rotateCurveAroundCenterByRadian(curve: ICurve, center: Point, angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const transform = new PlaneTransformation(1, 0, center.x, 0, 1, center.y)
      .multiply(new PlaneTransformation(c, -s, 0, s, c, 0))
      .multiply(new PlaneTransformation(1, 0, -center.x, 0, 1, -center.y));
    return curve.transform(transform);
  }
  static mkCircle(radius: number, center: Point) {
    return Ellipse.mkCircle(radius, center);
  }
  static createRectangle(width: number, height: number, center: Point): Curve {
    const w = width / 2;
    const h = height / 2;
    const x = center.x;
    const y = center.y;
    const c = new Curve();
    const p = [new Point(x - w, y - h), new Point(x + w, y - h), new Point(x + w, y + h), new Point(x - w, y + h)];
    c.addSegs([
      LineSegment.mkLinePP(p[0], p[1]),
      LineSegment.mkLinePP(p[1], p[2]),
      LineSegment.mkLinePP(p[2], p[3]),
      LineSegment.mkLinePP(p[3], p[0]),
    ]);
    return c;
  }

  static isRoundedRect(ic: ICurve): RoundedRectRadii | undefined {
    if (!(ic instanceof Curve)) return;
    const segs = ic.segs;
    if (segs.length != 8 && segs.length != 4) return;
    const full = segs.length == 8 ? true : false;
    let radX: number;
    let radY: number;
    for (let k = 0; k < 4; k++) {
      const i = full ? 2 * k + 1 : k;
      if (k == 0) {
        if (!(segs[i] instanceof Ellipse)) {
          return;
        }
        const el = segs[i] as Ellipse;
        radX = el.aAxis.length;
        radY = el.bAxis.length;
      } else {
        if (!(segs[i] instanceof Ellipse)) {
          return;
        }
        const el = segs[i] as Ellipse;
        if (radX != el.aAxis.length || radY != el.bAxis.length) return;
      }
      // some more checks are missing!
    }
    return {
      radX: radX,
      radY: radY,
    };
  }

  static createRectangleWithRoundedCorners(width: number, height: number, radX: number, radY: number, center: Point): Curve {
    if (radX == 0 || radY == 0) {
      CurveFactory.createRectangle(width, height, center);
      return;
    }
    const c = new Curve();
    const w = width / 2;
    if (radX > w / 2) radX = w / 2;
    const h = height / 2;
    if (radY > h / 2) radY = h / 2;
    const x = center.x;
    const y = center.y;
    const ox = w - radX;
    const oy = h - radY;
    const top = y + h;
    const bottom = y - h;
    const left = x - w;
    const right = x + w;
    //ellipse's axises
    const a = new Point(radX, 0);
    const b = new Point(0, radY);

    if (ox > 0) c.addSegment(LineSegment.mkLinePP(new Point(x - ox, bottom), new Point(x + ox, bottom)));
    c.addSegment(Ellipse.mkEllipse(1.5 * Math.PI, 2 * Math.PI, a, b, x + ox, y - oy));
    if (oy > 0) c.addSegment(LineSegment.mkLinePP(new Point(right, y - oy), new Point(right, y + oy)));
    c.addSegment(Ellipse.mkEllipse(0, 0.5 * Math.PI, a, b, x + ox, y + oy));
    if (ox > 0) c.addSegment(LineSegment.mkLinePP(new Point(x + ox, top), new Point(x - ox, top)));
    c.addSegment(Ellipse.mkEllipse(0.5 * Math.PI, Math.PI, a, b, x - ox, y + oy));
    if (oy > 0) c.addSegment(LineSegment.mkLinePP(new Point(left, y + oy), new Point(left, y - oy)));
    c.addSegment(Ellipse.mkEllipse(Math.PI, 1.5 * Math.PI, a, b, x - ox, y - oy));
    return c;
  }
}
