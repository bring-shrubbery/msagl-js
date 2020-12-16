import { Point } from "./point";

// 2 by 3 matrix of plane affine transformations
export class PlaneTransformation {

    // the identity transform
    elements: number[][] = [[1, 0 , 0], [0, 1, 0]];
    

    // the matrix elements
    get Elements() { return this.elements; }
    // i,j th element
    getElem(i: number, j: number) { return this.elements[i][j]; }

    setElem(i: number, j: number, v:number) { this.elements[i][j] = v; }


    
    
    // Divid matrix by a matrix
    static Divide(m0: PlaneTransformation, m1: PlaneTransformation) {
        return Multiply(m0, Inverse(m1));
    }

    IsIdentity(): Boolean {
        return Point.closeD(this.elements[0][0], 1) &&
            Point.closeD(this.elements[0][1], 0) &&
            Point.closeD(this.elements[0][2], 0) &&
            Point.closeD(this.elements[1][0], 0) &&
            Point.closeD(this.elements[1][1], 1) &&
            Point.closeD(this.elements[1][2], 0);
    }
        


    // returns the point of the matrix offset
    Offset(): Point {
        return new Point(this.getElem(0, 2), this.getElem(1, 2));
    }
    static getPlaneTransformation(m00: number, m01: number, m02: number,
        m10: number, m11: number, m12: number) {
        let r = new PlaneTransformation();
        r.elements[0][0] = m00; r.elements[0][1] = m01; r.elements[0][2] = m02;
        r.elements[1][0] = m10; r.elements[1][1] = m11; r.elements[1][2] = m12;
        return r;
    }
}

// Rotation matrix    
export function Rotation(angle : number):PlaneTransformation {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    return PlaneTransformation.getPlaneTransformation(cos, -sin, 0, sin, cos, 0);
}


export function ScaleAroundCenterTransformation(xScale: number, yScale: number, center: Point):PlaneTransformation
    {
        /*var toOrigin = new PlaneTransformation(1, 0, -center.x, 0, 1, -center.y);
          var scaleTr = new PlaneTransformation(scale, 0, 0,
          0, scale, 0);
          var toCenter = new PlaneTransformation(1, 0, center.x, 0, 1, center.y);
          var t = toCenter*scaleTr*toOrigin;
          return t;*/
        var dX = 1 - xScale;
        var dY = 1 - yScale;
        return PlaneTransformation.getPlaneTransformation(xScale, 0, dX * center.x, 0, yScale, dY * center.y);
    }

// Point by matrix multiplication
export function MultiplyPoint(m: PlaneTransformation, p: Point):Point {
    if (m != null)
        return new Point(
            m.getElem(0, 0) * p.x + m.getElem(0, 1) * p.y + m.getElem(0, 2),
            m.getElem(1, 0) * p.x + m.getElem(1, 1) * p.y + m.getElem(1, 2)
            );
    return new Point(0,0);
}

   // matrix matrix multiplication
export function Multiply(a: PlaneTransformation, b: PlaneTransformation):PlaneTransformation {
    if (a != null && b != null)
        return PlaneTransformation.getPlaneTransformation(
            a.getElem(0, 0) * b.getElem(0, 0) + a.getElem(0, 1) * b.getElem(1, 0),
            a.getElem(0, 0) * b.getElem(0, 1) + a.getElem(0, 1) * b.getElem(1, 1), 
            a.getElem(0, 0) * b.getElem(0, 2) + a.getElem(0, 1) * b.getElem(1, 2) + a.getElem(0, 2),            
            a.getElem(1, 0) * b.getElem(0, 0) + a.getElem(1, 1) * b.getElem(1, 0),
            a.getElem(1, 0) * b.getElem(0, 1) + a.getElem(1, 1) * b.getElem(1, 1),
            a.getElem(1, 0) * b.getElem(0, 2) + a.getElem(1, 1) * b.getElem(1, 2) + a.getElem(1, 2));
    return null;
}

 // returns the inversed matrix
function Inverse(m:PlaneTransformation) {
     let det = m.getElem(0,0) * m.getElem(1,1) - m.getElem(1,0) * m.getElem(0,1);
     
     let a00 = m.getElem(1,1) / det;
     let a01 = -m.getElem(0,1) / det;
     let a10 = -m.getElem(1,0) / det;
     let a11 = m.getElem(0,0) / det;
     let a02 = -a00 * m.getElem(0,2) - a01 * m.getElem(1,2);
     let a12 = -a10 * m.getElem(0,2) - a11 * m.getElem(1,2);
     return PlaneTransformation.getPlaneTransformation(a00, a01, a02, a10, a11, a12);
 }
