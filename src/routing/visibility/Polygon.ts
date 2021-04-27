import { DebugCurve } from "../../math/geometry/debugCurve";
import { LineSegment } from "../../math/geometry/lineSegment";
import { Point, TriangleOrientation } from "../../math/geometry/point";
import { Polyline } from "../../math/geometry/polyline";
import { PolylinePoint } from "../../math/geometry/polylinePoint";
import { Assert } from "../../utils/assert";
import { BimodalSequence } from "./BimodalSequence";

export class Polygon {

  polyline: Polyline;

    get Polyline(): Polyline {
    return this.polyline;
  }

  points: PolylinePoint[];

  constructor(polyline: Polyline) {
    this.polyline = this.polyline;
    this.points = new Array(this.polyline.count);
    let i: number = 0;
    let pp: PolylinePoint = this.polyline.startPoint;
    for (; i < this.polyline.count; i++,pp = pp.next)
      this.points[i] = pp;
  }

    Next(i: number): number {
    return this.Module((i + 1));
  }

    Prev(i: number): number {
    return this.Module((i - 1));
  }

    get count(): number {
    return this.Polyline.count;
  }

    Module(i: number): number {
    if ((i < 0)) {
      return (i + this.count);
    }

    if ((i < this.count)) {
      return i;
    }

    return (i - this.count);
  }

    get Item(i: number): PolylinePoint {
    return this.points[this.Module(i)];
  }

  //  LineSegment ls(Point pivot, int p) {
  //     return new LineSegment(pivot, Pnt(p));
  // }
    Pnt(i: number): Point {
    return this[i].point;
  }

  public  toString(): string {
    return this.polyline.toString();
  }

  //  the median of a chunk going clockwise from p1 to p2
    Median(p1: number, p2: number): number {
    Assert.assert((p1 != p2));
    // otherwise we do not know what arc is mean: the whole one or just the point
    if ((p2 > p1)) {
      return ((p2 + p1)
        / 2);
    }

    return this.Module(((p2
      + (this.count + p1))
      / 2));
  }

  //  p1 and p2 represent the closest feature. Two cases are possible p1=p2, or p1 and p2 share an edge going from p1 to p2
  //  Remind that the polygons are oriented clockwise
    FindTheFurthestVertexFromBisector(p1: number, p2: number, bisectorPivot: Point, bisectorRay: Point): number {
    let directionToTheHill: Point = bisectorRay.rotate((Math.PI / 2));
    if (this.polyline.startPoint.point.sub(bisectorPivot).dot(directionToTheHill)
      < 0) {
      directionToTheHill = directionToTheHill.mul(-1)
    }

    if (p1 == p2) {
      p2 = this.Next(p1);
    }

    // binary search
    do
    {
      let m: number = this.Median(p2, p1);
      // now the chunk goes clockwise from p2 to p1
      let mp: Point = this.Pnt(m);
      if (this.Pnt(this.Next(m)).sub(mp).dot(directionToTheHill)
        >= 0) {
        p2 = this.Next(m);
      }
      else if (this.Pnt(this.Prev(m)).sub(mp).dot(directionToTheHill)
        >= 0) {
        p1 = this.Prev(m);
      }
      else {
        p2 = m;
      }

      p1 = m;
    } while     (p1 != p2)
    

    return p1;
  }

  static TestPolygonDist(a: Polygon, b: Polygon): number {
    let ret: number = Number.MAX_SAFE_INTEGER
    for (let i: number = 0; (i < a.count); i++) {
      for (let j: number = 0; (j < b.count); j++) {
        const t = LineSegment.minDistBetweenLineSegments(a.Pnt(i), a.Pnt((i + 1)), b.Pnt(j), b.Pnt((j + 1)))
        ret = Math.min(ret, t.dist);
      }
   }
 return ret;
  }

  //  Distance between two polygons
  //  p and q are the closest points
  //  The function doesn't work if the polygons intersect each other
  static Distance(a: Polygon, b: Polygon, t: {p: Point, q: Point}): number {
    let tp = new TangentPair(a, b);
    tp.FindClosestPoints(/* out */p, /* out */q);
        #if(TEST_MSAGL)
    if (!Point.closeDistEps((p - q).length, Polygon.TestPolygonDist(a, b))) {
      let stream = File.Open("c:\tmp\polygonBug", FileMode.Create);
      let bf = new BinaryFormatter();
      bf.Serialize(stream, a);
      bf.Serialize(stream, b);
      LayoutAlgorithmSettings.ShowDebugCurves(new DebugCurve(100, 0.1, "red", a.Polyline), new DebugCurve(100, 0.1, "blue", b.Polyline), new DebugCurve(100, 0.1, "black", new LineSegment(p, q)));
      System.Diagnostics.Debug.Fail("wrong distance between two polygons");
    }
        
        #endif
    return (p - q).length;
  }

  //  Distance between two polygons
  public static Distance(a: Polygon, b: Polygon): number {
    Assert.assert(Polygon.PolygonIsLegalDebug(a));
    Assert.assert(Polygon.PolygonIsLegalDebug(b));
    let q: Point;
    let p: Point;
    return Polygon.Distance(a, b, /* out */p, /* out */q);
  }

   static PolygonIsLegalDebug(a: Polygon): boolean {
    let poly = a.Polyline;
    for (let p = poly.startPoint; ((p.next != null)
      && (p.next.next != null)); p = p.next) {
      if ((Point.getTriangleOrientation(p.point, p.next.point, p.next.next.point) == TriangleOrientation.Collinear)) {
        return false;
      }

    }

    return true;
  }

  //  Distance between polygon and point
  public static Distance(poly: Polygon, b: Point): number {
    let res: number = double.PositiveInfinity;
    for (let i: number = 0; (i < poly.count); i++) {
      let par: number;
      let dist: number = Point.DistToLineSegment(b, poly.points[i].point, poly.points[((i + 1)
        % poly.count)].point, /* out */par);
      res = Math.min(res, dist);
    }

    return res;
  }

  GetTangentPoints(t:{leftTangentPoint: number, rightTangentPoint: number}, point: Point) {
    const bimodalSequence = new BimodalSequence(this.GetSequenceDelegate(point), this.count);
    t.leftTangentPoint = bimodalSequence.FindMaximum();
    t.rightTangentPoint = bimodalSequence.FindMinimum();
  }

   GetSequenceDelegate(point: Point): (u:number)=> number {
    
            const pointOfP = this.Pnt(0);
            return (i:number) => {
                const d = Point.anglePCP(pointOfP, point, this.Pnt(i));
                return d < Math.PI ? d : d - 2 * Math.PI;
            };

    }
}
