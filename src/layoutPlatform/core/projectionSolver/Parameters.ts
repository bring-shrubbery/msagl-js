///  Per-instance parameters for ProjectionSolver.Solver.Solve().

export class Parameters {
  ///  GapTolerance is the amount of violation of constraint gaps we will accept as a
  ///  perf/accuracy tradeoff. Anything greater than this is a violation; equal or below is not.
  ///  PerfAcc: setting it to a larger value yields less violations/accuracy.

  public get GapTolerance(): number {}
  public set GapTolerance(value: number) {}

  ///  When the absolute difference in Qpsc function value from the previous iteration to the current
  ///  iteration is below this absolute-difference threshold, or when the QpscConvergenceQuotient
  ///  condition is met, the function is considered converged.
  ///  PerfAcc: setting it to a larger value yields less iterations and thus potentially lower accuracy.

  public get QpscConvergenceEpsilon(): number {}
  public set QpscConvergenceEpsilon(value: number) {}

  ///  When the absolute difference in Qpsc function value from the previous iteration to the current
  ///  iteration is divided by the previous iteration's function value, if the quotient is below
  ///  this value, or the QpscConvergenceEpsilon condition is met, the function is considered converged.
  ///  PerfAcc: setting it to a larger value yields less iterations and thus potentially lower accuracy;
  ///  a lower value yields more iterations and potentially greater accuracy.

  public get QpscConvergenceQuotient(): number {}
  public set QpscConvergenceQuotient(value: number) {}

  ///  The maximum number of times the outer Project/Split loop should be run.  If this is less than 0
  ///  (the default) it becomes a function based upon the number of variables; if it is 0, there is no limit.
  ///  Termination due to this limit will result in a feasible solution.
  ///  PerfAcc:  Primarily intended to mitigate nonconvergence scenarios; modify GapTolerance instead.

  public get OuterProjectIterationsLimit(): number {}
  public set OuterProjectIterationsLimit(value: number) {}

  ///  Within any Project/Split loop iteration (see OuterProjectIterationsLimit), this is the maximum number
  ///  of times Project should iterate internally.  If this is less than 0 (the default) it becomes a function
  ///  based upon the number of constraints; if it is 0, there is no limit.
  ///  Termination due to this limit may result in a nonfeasible solution.
  ///  PerfAcc:  Primarily intended to mitigate nonconvergence scenarios; modify GapTolerance instead.

  public get InnerProjectIterationsLimit(): number {}
  public set InnerProjectIterationsLimit(value: number) {}

  ///  The maximum time (in milliseconds) allowed for ProjectionSolver.Solver.Solve(). If less than or equal
  ///  to 0 (the default) there is no limit.  The cutoff is approximate since it is only examined on the outer
  ///  Project iteration, for performance and to ensure a feasible result in the event of early termination.
  ///  Termination due to this limit will result in a feasible solution.
  ///  PerfAcc:  Primarily intended to mitigate nonconvergence scenarios; modify GapTolerance instead.

  public get TimeLimit(): number {}
  public set TimeLimit(value: number) {}

  ///  Parameters for advanced options.

  public get Advanced(): AdvancedParameters {}
  public set Advanced(value: AdvancedParameters) {}

  ///  Constructor.

  public constructor() {
    this.GapTolerance = 0.0001
    this.QpscConvergenceEpsilon = 1e-5
    this.QpscConvergenceQuotient = 1e-6
    this.OuterProjectIterationsLimit = -1
    this.InnerProjectIterationsLimit = -1
    this.TimeLimit = -1
    this.Advanced = new AdvancedParameters()
  }

  ///  Deep-copy the AdvancedParameters.

  ///  <returns></returns>
  public Clone(): Object {
    const newParams = <Parameters>this.MemberwiseClone()
    newParams.Advanced = <AdvancedParameters>this.Advanced.Clone()
    return newParams
  }
}
//  end struct Parameters

///  Parameter specification for advanced options.

export class AdvancedParameters extends ICloneable {
  ///  Whether Solve() should use the full Qpsc (Quadratic Programming for Separation Constraints; see paper)
  ///  algorithm even if there are no neighbour pairs specified (neighbour pairs will always use Qpsc).
  ///  Currently this is primarily for debugging and result verification.

  public get ForceQpsc(): boolean {}
  public set ForceQpsc(value: boolean) {}

  ///  Whether the full Qpsc (Quadratic Programming for Separation Constraints; see paper) algorithm
  ///  should use Diagonal Scaling (see the other paper).

  public get ScaleInQpsc(): boolean {}
  public set ScaleInQpsc(value: boolean) {}

  ///  Any Lagrangian Multiple less than (more negative than) this causes a block split.
  ///  PerfAcc: setting it to a larger negative value yields less splits/accuracy.

  public get MinSplitLagrangianThreshold(): number {}
  public set MinSplitLagrangianThreshold(value: number) {}

  ///  Whether to use the violation cache. PerfOnly: if false, other ViolationCache settings are ignored.

  public get UseViolationCache(): boolean {}
  public set UseViolationCache(value: boolean) {}

  ///  Violation cache divisor for block count; the minimum of (number of initial blocks / ViolationCacheMinBlocksDivisor)
  ///  and ViolationCacheMinBlocksCount is used as the minimum number of blocks that enables the violation cache.
  ///  PerfOnly:  Modifies the number of cached violated constraints.

  public get ViolationCacheMinBlocksDivisor(): number {}
  public set ViolationCacheMinBlocksDivisor(value: number) {}

  ///  Violation cache minimum; the minimum of (number of initial blocks / ViolationCacheMinBlocksDivisor)
  ///  and ViolationCacheMinBlocksCount is used as the minimum number of blocks that enables the violation cache.
  ///  PerfOnly:  Modifies the number of cached violated constraints.

  //  PerfOnly:  Modifies the number of cached violated constraints.
  public get ViolationCacheMinBlocksCount(): number {}
  public set ViolationCacheMinBlocksCount(value: number) {}

  ///  Constructor.

  public constructor() {
    this.ForceQpsc = false
    this.ScaleInQpsc = true
    this.MinSplitLagrangianThreshold = -1e-7
    this.UseViolationCache = true
    this.ViolationCacheMinBlocksDivisor = 10
    this.ViolationCacheMinBlocksCount = 100
  }

  ///  Shallow-copy the object (there is nothing requiring deep-copy).

  ///  <returns></returns>
  public Clone(): Object {
    return this.MemberwiseClone()
  }
}
