///  Per-instance results from ProjectionSolver.Solver.Solve().

import {SolverAlgorithm} from './SolverAlgorithm'

export class Solution {
  ///  The only failure condition is if there are one or more unsatisfiable constraints, such as cycles
  ///  or mutually exclusive equality constraints.

  NumberOfUnsatisfiableConstraints: number

  ///  The number of times the outer Project/Split loop was run.

  OuterProjectIterations: number

  ///  The number of times Project iterated internally; divide by OuterProjectIterations to get the average
  ///  inner iterations per outer iteration; see also MinInnerProjectIterations and MaxInnerProjectIterations.

  InnerProjectIterationsTotal: number

  ///  The minimum number of times Project iterated internally for any outer Project iterations.

  MinInnerProjectIterations: number

  ///  The maximum number of times Project iterated internally for any outer Project iterations.

  MaxInnerProjectIterations: number

  ///  The maximum depth of a constraint tree.

  MaxConstraintTreeDepth: number

  ///  The final value of the goal function.

  GoalFunctionValue: number

  ///  Whether Solve() used the full Qpsc (Quadratic Programming for Separation Constraints) algorithm,
  ///  either by default or because UsedParameters.ForceQpsc was set.

  AlgorithmUsed: SolverAlgorithm

  ///  If true, the function ended due to TimeLimit being exceeded.

  TimeLimitExceeded: boolean

  ///  If true, the function ended due to OuterProjectIterationsLimit being exceeded.

  OuterProjectIterationsLimitExceeded: boolean

  ///  If true, a call to Project ended early due to InnerProjectIterationsLimit being exceeded.
  ///  The result may be nonfeasible.

  InnerProjectIterationsLimitExceeded: boolean

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
  public Clone(): Solution {
    const r = new Solution()
    r.GoalFunctionValue = this.GoalFunctionValue
    r.InnerProjectIterationsLimitExceeded =
      this.InnerProjectIterationsLimitExceeded
    r.InnerProjectIterationsTotal = this.InnerProjectIterationsTotal
    r.MaxConstraintTreeDepth = this.MaxConstraintTreeDepth
    r.OuterProjectIterations = this.OuterProjectIterations
    r.OuterProjectIterationsLimitExceeded =
      this.OuterProjectIterationsLimitExceeded
    r.AlgorithmUsed = this.AlgorithmUsed
    r.NumberOfUnsatisfiableConstraints = this.NumberOfUnsatisfiableConstraints
    r.MaxInnerProjectIterations = this.MaxInnerProjectIterations
    return r
  }
}
