///  just a convenient interface to the real solver

import {from, IEnumerable} from 'linq-to-typescript'
import {RealNumberSpan} from '../../utils/RealNumberSpan'
import {Solution} from './Solution'
import {Solver} from './Solver'
import {Variable} from './Variable'
import {Parameters} from './Parameters'
export class SolverShell {
  /* const */ static FixedVarWeight = 1000000000

  variables: Map<number, Variable> = new Map<number, Variable>()

  solver: Solver

  solution: Solution

  fixedVars: Map<number, number> = new Map<number, number>()

  ///  Constructor.

  public constructor() {
    this.InitSolver()
  }

  ///  Add a node that we would like as close to position i as possible, with the requested weight.

  ///  <param name="id">Caller's unique identifier for this node</param>
  ///  <param name="position">Desired position</param>
  ///  <param name="weight">The weight of the corresponding term in the goal function</param>
  public AddVariableWithIdealPositionNNN(
    id: number,
    position: number,
    weight: number,
  ) {
    //  This throws an ArgumentException if a variable with id is already there.
    this.variables.set(id, this.solver.AddVariableANN(id, position, weight))
  }

  ///  Add a node that we would like as close to position i as possible, with the requested weight.

  ///  <param name="id"></param>
  ///  <param name="position"></param>
  public AddVariableWithIdealPositionNN(id: number, position: number) {
    this.AddVariableWithIdealPositionNNN(id, position, 1)
  }

  ///  Add a constraint that leftNode+gap eq|leq RightNode.

  ///  <param name="idLeft">Caller's unique identifier for the left node</param>
  ///  <param name="idRight">Caller's unique identifier for the right node</param>
  ///  <param name="gap">Required gap</param>
  ///  <param name="isEquality">Gap is exact rather than minimum</param>
  public AddLeftRightSeparationConstraintNNNB(
    idLeft: number,
    idRight: number,
    gap: number,
    isEquality: boolean,
  ) {
    //  The variables must already have been added by AddNodeWithDesiredPosition.
    const varLeft = this.GetVariable(idLeft)
    if (varLeft == null) {
      return
    }

    const varRight = this.GetVariable(idRight)
    if (varRight == null) {
      return
    }

    this.solver.AddConstraintVVNB(varLeft, varRight, gap, isEquality)
  }

  ///  Add a constraint that leftNode+gap leq RightNode.

  ///  <param name="idLeft">Caller's unique identifier for the left node</param>
  ///  <param name="idRight">Caller's unique identifier for the right node</param>
  ///  <param name="gap">Required minimal gap</param>
  public AddLeftRightSeparationConstraintNNN(
    idLeft: number,
    idRight: number,
    gap: number,
  ) {
    this.AddLeftRightSeparationConstraintNNNB(idLeft, idRight, gap, false)
  }

  ///  Add a goal that minimizes the distance between two nodes, i.e. weight*((id1-id2)^2).

  ///  <param name="id1">Caller's unique identifier for the first node.</param>
  ///  <param name="id2">Caller's unique identifier for the second node.</param>
  ///  <param name="weight">The weight of the corresponding term in the goal function</param>
  public AddGoalTwoVariablesAreCloseNNN(
    id1: number,
    id2: number,
    weight: number,
  ) {
    const var1 = this.GetVariable(id1)
    if (var1 == null) {
      return
    }

    const var2 = this.GetVariable(id2)
    if (var2 == null) {
      return
    }

    this.solver.AddNeighborPair(var1, var2, weight)
  }

  ///

  ///  <param name="id1"></param>
  ///  <param name="id2"></param>
  public AddGoalTwoVariablesAreClose(id1: number, id2: number) {
    this.AddGoalTwoVariablesAreCloseNNN(id1, id2, 1)
  }

  GetVariable(i: number): Variable {
    return this.variables.get(i)
  }

  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.

  public Solve() {
    this.SolveP(null)
  }

  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.

  ///  <param name="parameters">Parameter object class specific to the underlying solver</param>
  ///  <returns>Pass or fail</returns>
  public SolveP(parameters: any) {
    const t = {executionLimitExceeded: false}
    this.SolvePNS(parameters, t)
  }

  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.

  ///  <param name="parameters">Parameter object class specific to the underlying solver</param>
  ///  <param name="executionLimitExceeded">if true, one or more limits such as iteration count
  ///          or timeout were exceeded</param>
  ///  <returns>Pass or fail</returns>
  public SolvePNS(
    parameters: any,
    t: {executionLimitExceeded: boolean},
  ): boolean {
    let fixedVarsMoved: boolean
    do {
      this.solution = null
      //  Remove any stale solution in case parameters validation or Solve() throws.
      let solverParameters: Parameters = null
      if (null != parameters) {
        solverParameters = <Parameters>parameters
        if (solverParameters == null) {
          throw new Error('parameters')
        }
      }

      this.solution = this.solver.SolvePar(solverParameters)
      t.executionLimitExceeded = this.solution.ExecutionLimitExceeded
      fixedVarsMoved = this.AdjustConstraintsForMovedFixedVars()
    } while (fixedVarsMoved && this.solution.ExecutionLimitExceeded == false)

    return this.solution.ExecutionLimitExceeded == false
  }

  //         void DumpToFile(string fileName) {
  //             var file = new StreamWriter(fileName);
  //             file.WriteLine("digraph {");
  //             foreach (var v in solver.Variables) {
  //                 var s = v.Weight > 100 ? "color=\"red\"" : "";
  //                 file.WriteLine(v.UserData + " [ label=" + "\"" + v.UserData +"\\n" +
  //                                v.DesiredPos + "\" " +s+ "]");
  //
  //             }
  //
  //             foreach (var cs in solver.Constraints) {
  //                 file.WriteLine(cs.Left.UserData + " -> " + cs.Right.UserData + " [ label=\"" + cs.Gap + "\"]");
  //             }
  //             file.WriteLine("}");
  //             file.Close();
  //         }
  AdjustConstraintsForMovedFixedVars(): boolean {
    const movedFixedVars = new Set<number>(
      from(this.fixedVars.entries())
        .where(
          ([k, v]) =>
            !SolverShell.Close(v, this.GetVariableResolvedPosition(k)),
        )
        .select(([k, _]) => k)
        .toArray(),
    )
    if (movedFixedVars.size == 0) {
      return false
    }

    return this.AdjustConstraintsForMovedFixedVarSet(movedFixedVars)
  }

  static Close(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.0005
    // so if a fixed variable moved less than 0.0001 we do not care!
  }

  AdjustConstraintsForMovedFixedVarSet(movedFixedVars: Set<number>): boolean {
    while (movedFixedVars.size > 0) {
      const fixedVar = from(movedFixedVars).first()

      if (!this.AdjustSubtreeOfFixedVar(fixedVar, /* ref */ movedFixedVars)) {
        return false
      }
    }

    return true
  }

  AdjustSubtreeOfFixedVar(
    fixedVar: number,
    movedFixedVars: Set<number>,
  ): boolean {
    const t = {successInAdjusting: false}
    const neighbors = this.AdjustConstraintsOfNeighborsOfFixedVariable(
      fixedVar,
      t,
    )
    if (!t.successInAdjusting) {
      return false
    }

    if (!neighbors.any()) {
      return false
    }

    for (const i of neighbors) {
      movedFixedVars.delete(i)
    }

    return true
  }

  ///  returns the block of the fixed variable

  ///  <param name="fixedVar"></param>
  ///  <param name="successInAdjusing"></param>
  ///  <returns></returns>
  AdjustConstraintsOfNeighborsOfFixedVariable(
    fixedVar: number,
    t: {successInAdjusting: boolean},
  ): IEnumerable<number> {
    const nbs = this.variables.get(fixedVar).Block.Variables
    const currentSpan = new RealNumberSpan()
    const idealSpan = new RealNumberSpan()
    let scale = 1
    for (const u of nbs) {
      if (!this.fixedVars.has(<number>u.UserData)) {
        continue
      }

      currentSpan.AddValue(u.ActualPos)
      idealSpan.AddValue(u.DesiredPos)
      if (idealSpan.length > 0) {
        scale = Math.max(scale, currentSpan.length / idealSpan.length)
      }
    }

    if (scale == 1) {
      scale = 2
    }

    // just relax the constraints
    t.successInAdjusting = this.FixActiveConstraints(from(nbs), scale)
    return from(nbs).select((u) => <number>u.UserData)
  }

  ///  if all active constraint gaps are less than this epsilon we should stop trying adjusting

  readonly FailToAdjustEpsilon = 0.001

  FixActiveConstraints(neighbs: IEnumerable<Variable>, scale: number): boolean {
    let ret = false
    for (const c of neighbs
      .selectMany((v) => v.LeftConstraints)
      .where((c) => c.IsActive)) {
      if (c.Gap > this.FailToAdjustEpsilon) ret = true
      this.solver.SetConstraintUpdate(c, c.Gap / scale)
    }

    return ret
  }

  ///  Obtain the solved position for a node.

  ///  <param name="id">Caller's unique identifier for the node.</param>
  ///  <returns>The node's solved position.</returns>
  public GetVariableResolvedPosition(id: number): number {
    const v = this.GetVariable(id)
    return v == null ? 0 : v.ActualPos
  }

  ///

  public InitSolver() {
    this.solver = new Solver()
    this.variables.clear()
  }

  ///  Add a variable with a known and unchanging position.

  ///  <param name="id">Caller's unique identifier for the node</param>
  ///  <param name="position">Desired position.</param>
  public AddFixedVariable(id: number, position: number) {
    this.AddVariableWithIdealPositionNNN(
      id,
      position,
      SolverShell.FixedVarWeight,
    )
    this.fixedVars.set(id, position)
  }

  ///

  ///  <param name="v"></param>
  ///  <returns></returns>
  public ContainsVariable(v: number): boolean {
    return this.variables.has(v)
  }

  ///  returns the ideal position of the node that had been set at the variable construction

  ///  <param name="v"></param>
  ///  <returns></returns>
  public GetVariableIdealPosition(v: number): number {
    return this.variables.get(v).DesiredPos
  }

  ///  Returns the solution object class specific to the underlying solver, or null if there has
  ///  been no call to Solve() or it threw an exception.

  public get Solution(): Solution {
    return this.solution
  }
}
