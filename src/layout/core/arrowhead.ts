import {Point} from './../../math/geometry/point';
export class Arrowhead {
  static defaultArrowheadLength = 10;
  length: number = Arrowhead.defaultArrowheadLength;
  width: number;
  tipPosition: Point;
  // A relative offset that moves the tip position
  offset: number;

  clone(): Arrowhead {
    const ret = new Arrowhead();
    ret.length = this.length;
    ret.width = this.width;
    ret.tipPosition = this.tipPosition;
    ret.offset = this.offset;
    return ret;
  }
}
