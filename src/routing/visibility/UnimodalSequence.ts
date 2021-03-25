enum Behavior { Increasing, Decreasing, Extremum }

//  A real valued function f defined on
//  the integers 0, 1, . . . , n-1 is said to be unimodal if there exists an integer m such that
// f is strictly increasing (respectively, decreasing) on [ 0, m] and
//  decreasing (respectively, increasing) on [m + 1, n-1]
//  No three sequential elements have the same value
export class UnimodalSequence {

  sequence: (m: number) => number;  // int -> double

  //  the sequence values
  get Sequence() {
    return this.sequence;
  }
  set Sequence(value: (m: number) => number) {
    this.sequence = value;
  }

  length: number;

  //  the length of the sequence: the sequence starts from 0
  get Length(): number {
    return this.length;
  }
  set Length(value: number) {
    this.length = value;
  }

  constructor(sequenceDelegate: (m: number) => number, length: number) {
    this.sequence = sequenceDelegate;
    this.Length = length;
  }

  FindMinimum(): number {
    // find out first that the minimum is inside of the domain
    let a: number = 0;
    let b: number = this.Length - 1
    let m: number = a + Math.floor((b - a) / 2)
    let valAtM: number = this.sequence(m);
    if (valAtM >= this.sequence(0) && valAtM >= this.sequence(this.Length - 1))
      return this.sequence(0) < this.sequence(this.Length - 1) ? 0 : this.Length - 1;
    while (b - a > 1) {
      m = a + Math.floor((b - a) / 2);
      switch (this.BehaviourAtIndex(m)) {
        case Behavior.Decreasing:
          a = m;
          break;
        case Behavior.Increasing:
          b = m;
          break;
        case Behavior.Extremum:
          return m;
      }
    }

    return (a == b) ? a : (this.sequence(a) <= this.sequence(b) ? a : b)
  }

  private BehaviourAtIndex(m: number): Behavior {
    let seqAtM: number = this.sequence(m);
    if ((m == 0)) {
      let seqAt1: number = this.sequence(1);
      if ((seqAt1 == seqAtM)) {
        return Behavior.Extremum;
      }

      return seqAt1 > seqAtM ? Behavior.Increasing : Behavior.Decreasing;
    }

    if ((m == (this.Length - 1))) {
      let seqAt1: number = this.sequence((this.Length - 2));
      if ((seqAt1 == seqAtM)) {
        return Behavior.Extremum;
      }
      return seqAt1 > seqAtM ? Behavior.Decreasing : Behavior.Increasing;
    }

    let delLeft: number = (seqAtM - this.sequence((m - 1)));
    let delRight: number = (this.sequence((m + 1)) - seqAtM);
    if (delLeft * delRight <= 0) {
      return Behavior.Extremum;
    }
    return delLeft > 0 ? Behavior.Increasing : Behavior.Decreasing;
  }

  FindMaximum(): number {
    // find out first that the maximum is inside of the domain
    let a: number = 0;
    let b: number = (this.Length - 1);
    let m: number = (a + Math.floor((b - a) / 2));
    let valAtM: number = this.sequence(m);
    if (((valAtM <= this.sequence(0))
      && (valAtM <= this.sequence((this.Length - 1))))) {
      return this.sequence(0) > this.sequence(this.Length - 1) ? 0 : this.Length - 1;
    }

    while (b - a > 1) {
      m = a + Math.floor((b - a) / 2);
      switch (this.BehaviourAtIndex(m)) {
        case Behavior.Decreasing:
          b = m;
          break;
        case Behavior.Increasing:
          a = m;
          break;
        case Behavior.Extremum:
          return m;

      }

    }

    return (a == b) ? a : (this.sequence(a) > this.sequence(b) ? a : b)
  }
}
