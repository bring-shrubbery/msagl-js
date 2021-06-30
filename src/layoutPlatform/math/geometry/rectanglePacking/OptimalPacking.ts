﻿import {Rectangle} from '../rectangle'
import {Packing} from './Packing'
import {Algorithm} from '../../../utils/algorithm'
import {Assert} from '../../../utils/assert'
import {PackingConstants} from './PackingConstants'

//  Pack rectangles (without rotation) into a given aspect ratio
export abstract class OptimalPacking extends Algorithm {
  desiredAspectRatio = 1.2

  bestPackingCost: number

  bestPacking: Packing = null

  protected rectangles: Array<Rectangle>

  cachedCosts = new Map<number, number>()
  createPacking: (rects: Rectangle[], limit: number) => Packing

  constructor(rectangles: Rectangle[], aspectRatio: number) {
    super(null)
    this.rectangles = this.rectangles
    this.desiredAspectRatio = aspectRatio
  }

  //  The width of the widest row in the packed solution
  public get PackedWidth(): number {
    if (this.bestPacking != null) {
      return this.bestPacking.PackedWidth
    }

    return 0
  }

  //  The height of the bounding box of the packed solution
  public get PackedHeight(): number {
    if (this.bestPacking != null) {
      return this.bestPacking.PackedHeight
    }

    return 0
  }

  //  controls the maximum number of steps we are allowed to take in our golden section search
  //  (actually worst case is O (n log n) for n=MaxSteps)
  static MaxSteps = 1000

  Pack(lowerBound: number, upperBound: number, minGranularity: number) {
    const c0: number = OptimalPacking.GetGoldenSectionStep(
      lowerBound,
      upperBound,
    )
    //  the worst case time complexity is O(n log(n)) where we have to do a full traversal of the
    //  golden section search tree because it each stage the two candidate split points we chose had
    //  the same cost.
    //  the following calculation for precision limits the worst case time by making max(n) = MaxSteps.
    const precision: number = Math.max(
      minGranularity / 10,
      (upperBound - lowerBound) / OptimalPacking.MaxSteps,
    )
    //  need to overshoot upperbound in case upperbound is actually optimal
    upperBound = upperBound + precision
    this.bestPackingCost = Number.MAX_VALUE
    if (this.rectangles.length == 1) {
      //  the trivial solution for just one rectangle is widthLowerBound
      this.PackLimit(lowerBound)
    } else if (this.rectangles.length == 2) {
      //  if we have 2 rectangles just try the two possibilities
      this.PackLimit(lowerBound)
      this.PackLimit(upperBound)
    } else if (this.rectangles.length > 2) {
      OptimalPacking.GoldenSectionSearch(
        this.PackLimit,
        lowerBound,
        c0,
        upperBound,
        precision,
      )
    }

    //  packing works on the rectangles in place, so we need to rerun to get back the best packing.
    this.bestPacking.run()
  }

  PackLimit(limit: number): number {
    let cost = this.cachedCosts.get(limit)
    if (cost == undefined) {
      const packing = this.createPacking(this.rectangles, limit)
      packing.run()
      cost = Math.abs(packing.PackedAspectRatio - this.desiredAspectRatio)
      this.cachedCosts[limit] = Math.abs(
        packing.PackedAspectRatio - this.desiredAspectRatio,
      )
      if (cost < this.bestPackingCost) {
        this.bestPackingCost = cost
        this.bestPacking = packing
      }
    }

    return cost
  }

  //  recursively searches a weakly unimodal function f(x) between x1 and x3 for the minimum.  It is assumed x2 \le x1 and x2 \le x3
  //  and x2-x1=a \lt b=x3-x2.  The recursion generates a fourth point x4-x1=b \gt a=x3-x4 where x4-x2=c and b=a+c and:
  //  if f(x4) \lt f(x2) we search in the range [x2, x3]
  //  else if f(x2) \lt f(x4) we search in the range [x1, x4]
  //  else
  //  f(x2)==f(x4) and we know that f is only weakly unimodal (not strongly unimodal) and we must search both branches.
  static GoldenSectionSearch(
    f: (x: number) => number,
    x1: number,
    x2: number,
    x3: number,
    precision: number,
  ): number {
    Assert.assert(
      (Math.abs(x3 - x1) - precision) / precision <=
        OptimalPacking.MaxSteps + 0.1,
      'precision would violate the limit imposed by MaxSteps',
    )
    //  check termination
    if (Math.abs(x1 - x3) < precision) {
      f(x1) < f(x3) ? x1 : x3
    }

    //  x2 must be between x1 and x3
    Assert.assert(
      (x1 < x2 && x2 < x3) || (x3 < x2 && x2 < x1),
      'x2 not bounded by x1 and x3',
    )
    //  x4 will be our new midpoint candidate
    const x4: number = OptimalPacking.GetGoldenSectionStep(x2, x3)
    //  now we have two candidates (x2,x4) both between x1 and x3: choose the bracket that most reduces f
    const fx2: number = f(x2)
    const fx4: number = f(x4)
    const leftSearch = () =>
      OptimalPacking.GoldenSectionSearch(f, x4, x2, x1, precision)
    const rightSearch = () =>
      OptimalPacking.GoldenSectionSearch(f, x2, x4, x3, precision)
    if (fx4 < fx2) {
      Assert.assert(
        Math.abs(x2 - x3) < Math.abs(x1 - x3),
        'Search region not narrowing!',
      )
      return rightSearch()
    }

    if (fx4 > fx2) {
      Assert.assert(
        Math.abs(x4 - x1) < Math.abs(x1 - x3),
        'Search region not narrowing!',
      )
      return leftSearch()
    }

    //  Doh! f(x2) == f(x4)!  Have to search both branches.
    const right: number = rightSearch()
    const left: number = leftSearch()
    return f(left) < f(right) ? left : right
  }

  static GetGoldenSectionStep(x1: number, x2: number): number {
    if (x1 < x2) {
      return x1 + PackingConstants.GoldenRatioRemainder * (x2 - x1)
    }

    return x1 - PackingConstants.GoldenRatioRemainder * (x1 - x2)
  }
}
