import {ICurve} from './icurve';
import {Ellipse} from './ellipse';
import {Curve} from './curve';
import {Point} from './point';
import {LineSegment} from './lineSegment';

export class CurveFactory {
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

  static createRectangleWithRoundedCorners(
    width: number,
    height: number,
    radiusInXDirection: number,
    radiusInYDirection: number,
    center: Point,
  ): Curve {
    if (radiusInXDirection == 0 || radiusInYDirection == 0) {
      CurveFactory.createRectangle(width, height, center);
      return;
    }
    const c = new Curve();
    const w = width / 2;
    if (radiusInXDirection > w / 2) radiusInXDirection = w / 2;
    const h = height / 2;
    if (radiusInYDirection > h / 2) radiusInYDirection = h / 2;
    const x = center.x;
    const y = center.y;
    const ox = w - radiusInXDirection;
    const oy = h - radiusInYDirection;
    const top = y + h;
    const bottom = y - h;
    const left = x - w;
    const right = x + w;
    //ellipse's axises
    const a = new Point(radiusInXDirection, 0);
    const b = new Point(0, radiusInYDirection);

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
