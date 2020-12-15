import { Point, distanceEpsilon, parallelWithinEpsilon, dot } from "./point";
 
enum VertexId { Corner,  VertexA, otherCorner, VertexB }

    
export class Parallelogram {
        isSeg:Boolean
        corner: Point
        a:Point //a side adjacent to the corner
        b:Point //another side exiting from the corner
        otherCorner: Point
        aPlusCorner:Point
        bPlusCorner:Point
        aRot:Point //a rotated on 90 degrees towards side1
        bRot:Point //b rotated on 90 degrees towards coeff
        abRot:number //a*bRot 
        baRot:number //b*aRot;
    
        
        constructor() {}
        
        /// <summary>
        /// Return true if the parallelogram contains the point
        /// </summary>
        /// <param name="point"></param>
        /// <returns></returns>
        Contains(point:Point): Boolean{
            let g = point.min(this.corner)
            let e = distanceEpsilon

            let gbRot = g.dot(this.bRot)
            if (gbRot > this.abRot + e || gbRot < -e)
                return false;

            let gaRot = g.dot(this.aRot)
            return gaRot <= this.baRot + e && gaRot >= -e;
        }


        area () { return Math.abs(this.a.x * this.b.y - this.a.y * this.b.x) } 
}

 /// Return the correspoinding vertex of the parallelogram
 export function vertex(p:Parallelogram, vertexPar:VertexId) {
    switch (vertexPar) {
        case VertexId.Corner: return p.corner;
        case VertexId.VertexA: return p.aPlusCorner;
        case VertexId.otherCorner: return p.otherCorner;
        case VertexId.VertexB: return p.bPlusCorner;
        default:
            throw undefined;
    }
}        

function PumpMinMax(minx:number, maxx:number, miny:number, maxy:number, 
                p:Point) {
                if (p.x < minx) {
                    minx = p.x;
                } else if (p.x > maxx) {
                    maxx = p.x;
                }
                if (p.y < miny) {
                    miny = p.y;
                } else if (p.y > maxy) {
                    maxy = p.y;
                }
            }
   
             // returns true if parallelograms intersect
export function intersect(parallelogram0:Parallelogram, parallelogram1:Parallelogram) {
    // It can be shown that two parallelograms do not intersect if and only if
    // they are separated with one of the parallelogram sides 


    let ret = !(separByA(parallelogram0, parallelogram1) || separByA(parallelogram1, parallelogram0) ||
               separByB(parallelogram0, parallelogram1) || separByB(parallelogram1, parallelogram0));

    if (ret == false)
        return false;

    if (!(parallelogram0.isSeg && parallelogram1.isSeg))
        return true;


    if (!parallelWithinEpsilon(parallelogram0.otherCorner.min(parallelogram0.corner),
                                     parallelogram1.otherCorner.min(parallelogram1.corner), 1.0E-5))
        return true

    //here we know that the segs are parallel
    return ParallelSegsIntersect(parallelogram1, parallelogram0);

}

function ParallelSegsIntersect(p0:Parallelogram, p1:Parallelogram) :Boolean{
    let v0 = p0.corner
    let v1 = p0.otherCorner

    let v2 = p1.corner
    let v3 = p1.otherCorner

    let d = v1.min(v0)

    //let us imagine that v0 is at zero
    let r0:number = 0; // position of v0
    let r1 = d.dot(d) //offset of v1
    
    //offset of v2
    let r2 = v2.min(v0). dot(d)

    //offset of v3
    let r3 = v3.min(v0).dot(d)

    // we need to check if [r0,r1] intersects [r2,r3]

    if (r2 > r3) {
        let t = r2;
        r2 = r3;
        r3 = t;
    }

    return !(r3 < r0 - distanceEpsilon || r2 > r1 + distanceEpsilon);

}

function separByB(p0:Parallelogram, p1:Parallelogram) {
    let eps = distanceEpsilon
    let p1a = vertex(p1, 0).min(p0.corner).dot(p0.bRot)
    let list = [VertexId.VertexA, VertexId.otherCorner, VertexId.VertexB]        
    if (p1a > p0.abRot + eps) {
        for (let i of list) {
            if (vertex(p1, i).min(p0.corner).dot(p0.bRot) <= p0.abRot + eps)
                return false;
        }

        return true;
    } else if (p1a < -eps) {
        for (let i of list) {
            if (vertex(p1, i).min(p0.corner).dot(p0.bRot) >= -eps)
                return false;
        }
        return true;
    }
    return false;
}
function separByA(p0:Parallelogram, p1:Parallelogram) {

    let eps = distanceEpsilon;

    let t = p1.corner.min(p0.corner)
    let p1a = dot(t , p0.aRot);

    if (p1a > p0.baRot + eps) {
        t.x = p1.aPlusCorner.x - p0.corner.x;
        t.y = p1.aPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        t.x = p1.bPlusCorner.x - p0.corner.x;
        t.y = p1.bPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        t.x = p1.otherCorner.x - p0.corner.x;
        t.y = p1.otherCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        return true;
    } else if (p1a < -eps) {
        t.x = p1.aPlusCorner.x - p0.corner.x;
        t.y = p1.aPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= - eps)
            return false;

        t.x = p1.bPlusCorner.x - p0.corner.x;
        t.y = p1.bPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= -eps)
            return false;

        t.x = p1.otherCorner.x - p0.corner.x;
        t.y = p1.otherCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= -eps)
            return false;

        return true;
    }

    return false
}

    /// create a Parallelogram over a group
    function GetParallelogramOfAGroup( boxes:[Parallelogram]) {
        let minx = 0, maxx = 0, miny = 0, maxy = 0
        let firstTime = true;
        for (let b of boxes) {
            let verts = AllVertices(b)
            for (var v of verts) {
                let x = v.x;
                let y = v.y;
                if (firstTime) {
                    firstTime = false;
                    minx = maxx = x;
                    miny = maxy = y;
                } else {
                    if (x < minx) {
                        minx = x;
                    } else if (x > maxx) {
                        maxx = x;
                    }
                    if (y < miny) {
                        miny = y;
                    } else if (y > maxy) {
                        maxy = y;
                    }
                }
            }
        }
        return parallelogramByCornerSideSide(new Point(minx, miny), 
        new Point(0, maxy - miny), 
        new Point(maxx - minx, 0));
    }


    export function parallelogramByCornerSideSide(corner:Point, sideA:Point, sideB:Point): Parallelogram {
        const result = new Parallelogram();

        result.corner = corner;
        result.a = sideA;
        result.b = sideB;

        result.aRot = new Point(-sideA.y, sideA.x);
        if (result.aRot.length() > 0.5)
        result.aRot = this.aRot.Normalize();

        result.bRot = new Point(-sideB.y, sideB.x);
        if (result.bRot.length() > 0.5)
        result.bRot = this.bRot.Normalize();

        result.abRot = result.bRot.dot(sideA)

        result.baRot = sideB.dot(this.aRot)


        if (result.abRot < 0) {
            result.abRot = -result.abRot;
            result.bRot = result.bRot.neg();
        }

        if (result.baRot < 0) {
            result.baRot = -result.baRot
            result.aRot = result.aRot.neg()
        }

        result.isSeg = sideA.min(sideB).length() < distanceEpsilon;

        result.aPlusCorner = sideA.add(corner);
        result.otherCorner =  sideB.add(result.aPlusCorner);
        result.bPlusCorner = sideB.add(corner);
        
        return result;
    }

    function parallelogramOfTwo(box0:Parallelogram, box1:Parallelogram): Parallelogram {
        let v = box0.corner
        let minx = v.x, maxx = v.x, miny = v.y, maxy = v.y
        

        PumpMinMax(minx,  maxx,  miny,  maxy,  box0.aPlusCorner);
        PumpMinMax( minx,  maxx,  miny,  maxy,  box0.otherCorner);
        PumpMinMax( minx,  maxx,  miny,  maxy,  box0.bPlusCorner);

        PumpMinMax( minx,  maxx,  miny,  maxy,  box1.corner);
        PumpMinMax( minx,  maxx,  miny,  maxy,  box1.aPlusCorner);
        PumpMinMax( minx,  maxx,  miny,  maxy,  box1.otherCorner);
        PumpMinMax( minx,  maxx,  miny,  maxy,  box1.bPlusCorner);

        this.corner = new Point(minx, miny);
        this.a = new Point(0, maxy - miny);
        this.b = new Point(maxx - minx, 0);

        this.aPlusCorner = this.a + this.corner;
        this.otherCorner = this.b.add(this.aPlusCorner);
        this.bPlusCorner = this.b.add(this.corner);

        this.aRot = new Point(-this.a.y, this.a.x);
        if (this.aRot.length > 0.5)
            this.aRot = this.aRot.Normalize();

        this.bRot = new Point(-this.b.y, this.b.x);
        if (this.bRot.length > 0.5)
        this.bRot = this.bRot.Normalize()   

        this.abRot = this.a.dot( this.bRot)
        this.baRot = this.b.dot(this.aRot)


        if (this.abRot < 0) {
            this.abRot = -this.abRot;
            this.bRot = this.bRot.neg();
        }

        if (this.baRot < 0) {
            this.baRot = -this.baRot;
            this.aRot = this.aRot.neg();
        }

        this.isSeg = this.a.min(this.b).length < distanceEpsilon
        return this
    }
 
 function *AllVertices(p:Parallelogram)  {            
        yield p.corner
        yield p.aPlusCorner
        yield p.otherCorner
        yield p.bPlusCorner
}
function *OtherVertices (p:Parallelogram) {
    yield p.aPlusCorner
    yield p.otherCorner
    yield p.bPlusCorner
}
