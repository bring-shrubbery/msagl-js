import {ICurve} from './icurve';
import {Point} from './point';
import {LineSegment} from './lineSegment';
import {GeomConstants} from './geomConstants';

// For curves A(s) and B(t), when we have some evidence that
// there is at most one intersection point, and we have a guess for the parameters (s0, t0),
// we try to bring to (0,0) vector F(s,t) = A(s) - B(t).  To minimize the length of F(s,t)
// we solve the system of equations:
// F*Fs + (F*Fss + Fs*Fs)ds + (F*Fst + Fs*Ft)dt = 0
// F*Ft + (F*Fst + Fs*Ft)ds + (F*Ftt + Ft*Ft)dt = 0
//
// Where F = F(si,ti), Fs and Ft are the first partials at si, ti, Fxx are the second partials,
// and s(i+1) = si+ds, t(i+1) = ti+dt.
// We adjust ds and dt to stay in the domain.

export class MinDistCurveCurve {
  curveA: ICurve;
  curveB: ICurve;
  aMin: number;
  aMax: number;
  bMin: number;
  bMax: number;
  aGuess: number;
  bGuess: number;
  aSolution: number;
  bSolution: number;

  aPoint: Point;
  bPoint: Point;
  success: boolean;
  si: number;
  ti: number;

  a: Point;
  b: Point;
  a_b: Point;
  ad: Point;
  bd: Point;
  add: Point;
  bdd: Point;

  initValues() {
    this.a = this.curveA.value(this.si);
    this.b = this.curveB.value(this.ti);
    this.a_b = this.a.minus(this.b);
    this.ad = this.curveA.derivative(this.si);
    this.add = this.curveA.secondDerivative(this.si);
    this.bd = this.curveB.derivative(this.ti);
    this.bdd = this.curveB.secondDerivative(this.ti);
  }

  /// curveAPar">first curve</param>
  /// curveBPar">second curve</param>
  /// lowBound0">the first curve minimal parameter</param>
  /// upperBound0">the first curve maximal parameter</param>
  /// lowBound1">the second curve minimal parameter</param>
  /// upperBound1">the first curve maximal parameter</param>
  /// guess0"></param>
  /// guess1"></param>
  constructor(curveA: ICurve, curveB: ICurve, aMin: number, aMax: number, bMin: number, mBax: number, aGuess: number, bGuess: number) {
    this.curveA = curveA;
    this.curveB = curveB;
    this.aMin = aMin;
    this.bMin = bMin;
    this.aMax = aMax;
    this.bMax = mBax;
    this.aGuess = aGuess;
    this.bGuess = bGuess;
    this.si = aGuess;
    this.ti = bGuess;
  }

  //we ignore the mulitplier 2 here fore efficiency reasons
  Fs() {
    return /*2**/ this.a_b.dot(this.ad);
  }

  Fss() {
    return /*2**/ this.a_b.dot(this.add) + this.ad.dot(this.ad);
  }

  Fst() {
    //equals to Fts
    return -(/*2**/ this.bd.dot(this.ad));
  }

  Ftt() {
    return /*2**/ -this.a_b.dot(this.bdd) + this.bd.dot(this.bd);
  }

  Ft() {
    return -(/*2**/ this.a_b.dot(this.bd));
  }

  // xy - the first row
  // uw - the second row
  delta(x: number, y: number, u: number, w: number) {
    return x * w - u * y;
  }
  //Fs + Fss*ds + Fst*dt = 0
  //Ft + Fst*ds + Ftt*dt = 0
  solve() {
    let numberOfBoundaryCrossings = 0;
    const maxNumberOfBoundaryCrossings = 10;
    let numberOfTotalReps = 0;
    const maxNumberOfTotalReps = 100;

    let abort = false;

    this.initValues();

    if (this.curveA instanceof LineSegment && this.curveB instanceof LineSegment) {
      let bd1 = this.curveB.derivative(0);
      bd1 = bd1.div(bd1.length());
      const an = (this.curveA as LineSegment).normal();

      const del = Math.abs(an.dot(bd1));

      if (Math.abs(del) < GeomConstants.distanceEpsilon || this.delta(this.Fss(), this.Fst(), this.Fst(), this.Ftt()) < GeomConstants.tolerance) {
        this.success = true;
        this.parallelLineSegLineSegMinDist();
        return;
      }
    }

    let ds: number;
    let dt: number;
    do {
      //hopefully it will be inlined by the compiler
      const delta = this.delta(this.Fss(), this.Fst(), this.Fst(), this.Ftt());
      if (Math.abs(delta) < GeomConstants.tolerance) {
        this.success = false;
        abort = true;
        break;
      }

      ds = this.delta(-this.Fs(), this.Fst(), -this.Ft(), this.Ftt()) / delta;
      dt = this.delta(this.Fss(), -this.Fs(), this.Fst(), -this.Ft()) / delta;

      const nsi = this.si + ds;
      const nti = this.ti + dt;

      let bc: boolean;

      if (
        nsi > this.aMax + GeomConstants.distanceEpsilon ||
        nsi < this.aMin - GeomConstants.distanceEpsilon ||
        nti > this.bMax + GeomConstants.distanceEpsilon ||
        nti < this.bMin - GeomConstants.distanceEpsilon
      ) {
        numberOfBoundaryCrossings++;
        this.chopDsDt(ds, dt);
        this.si += ds;
        this.ti += dt;
        bc = true;
      } else {
        bc = false;
        this.si = nsi;
        this.ti = nti;
        if (this.si > this.aMax) this.si = this.aMax;
        else if (this.si < this.aMin) this.si = this.aMin;

        if (this.ti > this.bMax) this.ti = this.bMax;
        else if (this.ti < this.bMin) this.ti = this.bMin;
      }

      this.initValues();

      numberOfTotalReps++;

      abort = numberOfBoundaryCrossings >= maxNumberOfBoundaryCrossings || numberOfTotalReps >= maxNumberOfTotalReps || (ds == 0 && dt == 0 && bc);
    } while ((Math.abs(ds) >= GeomConstants.tolerance || Math.abs(dt) >= GeomConstants.tolerance) && !abort);

    if (abort) {
      //may be the initial values were just OK
      const t = this.curveA.value(this.aGuess).minus(this.curveB.value(this.bGuess));
      if (t.dot(t) < GeomConstants.distanceEpsilon * GeomConstants.distanceEpsilon) {
        this.aSolution = this.aGuess;
        this.bSolution = this.bGuess;
        this.aPoint = this.curveA.value(this.aGuess);
        this.bPoint = this.curveB.value(this.bGuess);
        this.success = true;
        return;
      }
    }
    this.aSolution = this.si;
    this.bSolution = this.ti;
    this.aPoint = this.a;
    this.bPoint = this.b;
    this.success = !abort;
  }

  chopDsDt(ds: number, dt: number) {
    if (ds != 0 && dt != 0) {
      let k1 = 1; //we are looking for a chopped vector of the form k(ds,dt)

      if (this.si + ds > this.aMax)
        //we have si+k*ds=aMax
        k1 = (this.aMax - this.si) / ds;
      else if (this.si + ds < this.aMin) k1 = (this.aMin - this.si) / ds;

      let k2 = 1;

      if (this.ti + dt > this.bMax)
        //we need to have ti+k*dt=bMax  or ti+k*dt=bMin
        k2 = (this.bMax - this.ti) / dt;
      else if (this.ti + dt < this.bMin) k2 = (this.bMin - this.ti) / dt;

      const k = Math.min(k1, k2);
      ds *= k;
      dt *= k;
    } else if (ds == 0) {
      if (this.ti + dt > this.bMax) dt = this.bMax - this.ti;
      else if (this.ti + dt < this.bMin) dt = this.bMin - this.ti;
    } else {
      //dt==0)
      if (this.si + ds > this.aMax) ds = this.aMax - this.si;
      else if (this.si + ds < this.aMin) ds = this.aMin - this.si;
    }
  }

  parallelLineSegLineSegMinDist() {
    const l0 = this.curveA as LineSegment;
    const l1 = this.curveB as LineSegment;

    const v0 = l0.start();
    const v1 = l0.end();
    const v2 = l1.start();
    const v3 = l1.end();

    let d0 = v1.minus(v0);

    const nd0 = d0.length();

    let r0 = 0;
    let r1: number, r2: number, r3: number;

    if (nd0 > GeomConstants.distanceEpsilon) {
      //v0 becomes the zero point
      d0 = d0.div(nd0);
      r1 = d0.dot(v1.minus(v0));
      r2 = d0.dot(v2.minus(v0));
      r3 = d0.dot(v3.minus(v0));

      let swapped = false;
      if (r2 > r3) {
        swapped = true;
        const t = r2;
        r2 = r3;
        r3 = t;
      }

      if (r3 < r0) {
        this.aSolution = 0;
        this.bSolution = swapped ? 0 : 1;
      } else if (r2 > r1) {
        this.aSolution = 1;
        this.bSolution = swapped ? 1 : 0;
      } else {
        const r = Math.min(r1, r3);
        this.aSolution = r / (r1 - r0);
        this.bSolution = (r - r2) / (r3 - r2);
        if (swapped) this.bSolution = 1 - this.bSolution;
      }
    } else {
      let d1 = v3.minus(v2);
      const nd1 = d1.length();
      if (nd1 > GeomConstants.distanceEpsilon) {
        //v2 becomes the zero point
        d1 = d1.div(nd1);
        r0 = 0; //v2 position
        r1 = d1.dot(v3.minus(v2)); //v3 position
        r2 = d1.dot(v0.minus(v2)); //v0 position - here v0 and v1 are indistinguishable

        if (r2 < r0) {
          this.bSolution = 0;
          this.aSolution = 1;
        } else if (r2 > r1) {
          this.bSolution = 1;
          this.aSolution = 0;
        } else {
          const r = Math.min(r1, r2);
          this.bSolution = r / (r1 - r0);
          this.aSolution = 0;
        }
      } else {
        this.aSolution = 0;
        this.bSolution = 0;
      }
    }
    this.aPoint = this.curveA.value(this.aSolution);
    this.bPoint = this.curveB.value(this.bSolution);
  }
}
