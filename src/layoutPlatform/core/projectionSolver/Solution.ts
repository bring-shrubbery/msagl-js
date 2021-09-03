///  Per-instance results from ProjectionSolver.Solver.Solve().

export class Solution {
  ///  The only failure condition is if there are one or more unsatisfiable constraints, such as cycles
  ///  or mutually exclusive equality constraints.

  public get NumberOfUnsatisfiableConstraints(): number {}
  public set NumberOfUnsatisfiableConstraints(value: number) {}

  ///  The number of times the outer Project/Split loop was run.

  public get OuterProjectIterations(): Int32 {}
  public set OuterProjectIterations(value: Int32) {}

  ///  The number of times Project iterated internally; divide by OuterProjectIterations to get the average
  ///  inner iterations per outer iteration; see also MinInnerProjectIterations and MaxInnerProjectIterations.

  public get InnerProjectIterationsTotal(): Int64 {}
  public set InnerProjectIterationsTotal(value: Int64) {}

  ///  The minimum number of times Project iterated internally for any outer Project iterations.

  public get MinInnerProjectIterations(): Int32 {}
  public set MinInnerProjectIterations(value: Int32) {}

  ///  The maximum number of times Project iterated internally for any outer Project iterations.

  public get MaxInnerProjectIterations(): Int32 {}
  public set MaxInnerProjectIterations(value: Int32) {}

  ///  The maximum depth of a constraint tree.

  public get MaxConstraintTreeDepth(): Int32 {}
  public set MaxConstraintTreeDepth(value: Int32) {}

  ///  The final value of the goal function.

  public get GoalFunctionValue(): number {}
  public set GoalFunctionValue(value: number) {}

  ///  Whether Solve() used the full Qpsc (Quadratic Programming for Separation Constraints) algorithm,
  ///  either by default or because UsedParameters.ForceQpsc was set.

  public get AlgorithmUsed(): SolverAlgorithm {}
  public set AlgorithmUsed(value: SolverAlgorithm) {}

  ///  If true, the function ended due to TimeLimit being exceeded.

  public get TimeLimitExceeded(): boolean {}
  public set TimeLimitExceeded(value: boolean) {}

  ///  If true, the function ended due to OuterProjectIterationsLimit being exceeded.

  public get OuterProjectIterationsLimitExceeded(): boolean {}
  public set OuterProjectIterationsLimitExceeded(value: boolean) {}

  ///  If true, a call to Project ended early due to InnerProjectIterationsLimit being exceeded.
  ///  The result may be nonfeasible.

  public get InnerProjectIterationsLimitExceeded(): boolean {}
  public set InnerProjectIterationsLimitExceeded(value: boolean) {}

  ///  Indicates whether one or more execution limits were exceeded.

  public get ExecutionLimitExceeded(): boolean {
    return (
      this.TimeLimitExceeded ||
      this.OuterProjectIterationsLimitExceeded ||
      this.InnerProjectIterationsLimitExceeded
    )
  }

  ///  Shallow-copy everything, including the contained list.

  ///  <returns></returns>
  public Clone(): Object {
    return this.MemberwiseClone()
  }
}
