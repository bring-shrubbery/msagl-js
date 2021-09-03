///  <summary>
///  Per-instance results from ProjectionSolver.Solver.Solve().
///  </summary>
export class Solution {
  ///  <summary>
  ///  The only failure condition is if there are one or more unsatisfiable constraints, such as cycles
  ///  or mutually exclusive equality constraints.
  ///  </summary>
  public get NumberOfUnsatisfiableConstraints(): number {}
  public set NumberOfUnsatisfiableConstraints(value: number) {}

  ///  <summary>
  ///  The number of times the outer Project/Split loop was run.
  ///  </summary>
  public get OuterProjectIterations(): Int32 {}
  public set OuterProjectIterations(value: Int32) {}

  ///  <summary>
  ///  The number of times Project iterated internally; divide by OuterProjectIterations to get the average
  ///  inner iterations per outer iteration; see also MinInnerProjectIterations and MaxInnerProjectIterations.
  ///  </summary>
  public get InnerProjectIterationsTotal(): Int64 {}
  public set InnerProjectIterationsTotal(value: Int64) {}

  ///  <summary>
  ///  The minimum number of times Project iterated internally for any outer Project iterations.
  ///  </summary>
  public get MinInnerProjectIterations(): Int32 {}
  public set MinInnerProjectIterations(value: Int32) {}

  ///  <summary>
  ///  The maximum number of times Project iterated internally for any outer Project iterations.
  ///  </summary>
  public get MaxInnerProjectIterations(): Int32 {}
  public set MaxInnerProjectIterations(value: Int32) {}

  ///  <summary>
  ///  The maximum depth of a constraint tree.
  ///  </summary>
  public get MaxConstraintTreeDepth(): Int32 {}
  public set MaxConstraintTreeDepth(value: Int32) {}

  ///  <summary>
  ///  The final value of the goal function.
  ///  </summary>
  public get GoalFunctionValue(): number {}
  public set GoalFunctionValue(value: number) {}

  ///  <summary>
  ///  Whether Solve() used the full Qpsc (Quadratic Programming for Separation Constraints) algorithm,
  ///  either by default or because UsedParameters.ForceQpsc was set.
  ///  </summary>
  public get AlgorithmUsed(): SolverAlgorithm {}
  public set AlgorithmUsed(value: SolverAlgorithm) {}

  ///  <summary>
  ///  If true, the function ended due to TimeLimit being exceeded.
  ///  </summary>
  public get TimeLimitExceeded(): boolean {}
  public set TimeLimitExceeded(value: boolean) {}

  ///  <summary>
  ///  If true, the function ended due to OuterProjectIterationsLimit being exceeded.
  ///  </summary>
  public get OuterProjectIterationsLimitExceeded(): boolean {}
  public set OuterProjectIterationsLimitExceeded(value: boolean) {}

  ///  <summary>
  ///  If true, a call to Project ended early due to InnerProjectIterationsLimit being exceeded.
  ///  The result may be nonfeasible.
  ///  </summary>
  public get InnerProjectIterationsLimitExceeded(): boolean {}
  public set InnerProjectIterationsLimitExceeded(value: boolean) {}

  ///  <summary>
  ///  Indicates whether one or more execution limits were exceeded.
  ///  </summary>
  public get ExecutionLimitExceeded(): boolean {
    return (
      this.TimeLimitExceeded ||
      this.OuterProjectIterationsLimitExceeded ||
      this.InnerProjectIterationsLimitExceeded
    )
  }

  ///  <summary>
  ///  Shallow-copy everything, including the contained list.
  ///  </summary>
  ///  <returns></returns>
  public Clone(): Object {
    return this.MemberwiseClone()
  }
}
