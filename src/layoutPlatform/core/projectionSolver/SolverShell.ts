///  <summary>
///  just a convenient interface to the real solver

import {IEnumerable} from 'linq-to-typescript'
import {Variable} from './Variable'

///  </summary>
export class SolverShell {
  /* const */ static FixedVarWeight = 1000000000

  variables: Map<number, Variable> = new Map<number, Variable>()

  solver: Solver

  solution: Solution

  fixedVars: Map<number, number> = new Map<number, number>()

  ///  <summary>
  ///  Constructor.
  ///  </summary>
  public constructor() {
    this.InitSolver()
  }

  ///  <summary>
  ///  Add a node that we would like as close to position i as possible, with the requested weight.
  ///  </summary>
  ///  <param name="id">Caller's unique identifier for this node</param>
  ///  <param name="position">Desired position</param>
  ///  <param name="weight">The weight of the corresponding term in the goal function</param>
  public AddVariableWithIdealPositionNNN(
    id: number,
    position: number,
    weight: number,
  ) {
    //  This throws an ArgumentException if a variable with id is already there.
    this.variables.Add(id, this.solver.AddVariable(id, position, weight))
  }

  ///  <summary>
  ///  Add a node that we would like as close to position i as possible, with the requested weight.
  ///  </summary>
  ///  <param name="id"></param>
  ///  <param name="position"></param>
  public AddVariableWithIdealPositionNN(id: number, position: number) {
    this.AddVariableWithIdealPositionNNN(id, position, 1)
  }

  ///  <summary>
  ///  Add a constraint that leftNode+gap eq|leq RightNode.
  ///  </summary>
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

    this.solver.AddConstraint(varLeft, varRight, gap, isEquality)
  }

  ///  <summary>
  ///  Add a constraint that leftNode+gap leq RightNode.
  ///  </summary>
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

  ///  <summary>
  ///  Add a goal that minimizes the distance between two nodes, i.e. weight*((id1-id2)^2).
  ///  </summary>
  ///  <param name="id1">Caller's unique identifier for the first node.</param>
  ///  <param name="id2">Caller's unique identifier for the second node.</param>
  ///  <param name="weight">The weight of the corresponding term in the goal function</param>
  public AddGoalTwoVariablesAreClose(id1: number, id2: number, weight: number) {
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

  ///  <summary>
  ///
  ///  </summary>
  ///  <param name="id1"></param>
  ///  <param name="id2"></param>
  public AddGoalTwoVariablesAreClose(id1: number, id2: number) {
    this.AddGoalTwoVariablesAreClose(id1, id2, 1)
  }

  GetVariable(i: number): Variable {
    let v: Variable
    return this.variables.TryGetValue(i, /* out */ v)
    // TODO: Warning!!!, inline IF is not supported ?
    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
  }

  ///  <summary>
  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.
  ///  </summary>
  public Solve() {
    this.Solve(null)
  }

  ///  <summary>
  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.
  ///  </summary>
  ///  <param name="parameters">Parameter object class specific to the underlying solver</param>
  ///  <returns>Pass or fail</returns>
  public Solve(parameters: Object) {
    let executionLimitExceeded: boolean
    this.Solve(parameters, /* out */ executionLimitExceeded)
  }

  ///  <summary>
  ///  Execute the solver, filling in the Solution object and the values to be returned by GetVariableResolvedPosition.
  ///  </summary>
  ///  <param name="parameters">Parameter object class specific to the underlying solver</param>
  ///  <param name="executionLimitExceeded">if true, one or more limits such as iteration count
  ///          or timeout were exceeded</param>
  ///  <returns>Pass or fail</returns>
  @SuppressMessage('Microsoft.Usage', 'CA2208')
  public Solve(
    parameters: Object,
    /* out */ executionLimitExceeded: boolean,
  ): boolean {
    let fixedVarsMoved: boolean
    for (; fixedVarsMoved && this.solution.ExecutionLimitExceeded == false; ) {
      this.solution = null
      //  Remove any stale solution in case parameters validation or Solve() throws.
      let solverParameters: Parameters = null
      if (null != parameters) {
        solverParameters = <Parameters>parameters
        if (solverParameters == null) {
          throw new ArgumentException('parameters')
        }
      }

      this.solution = this.solver.Solve(solverParameters)
      executionLimitExceeded = this.solution.ExecutionLimitExceeded
      fixedVarsMoved = this.AdjustConstraintsForMovedFixedVars()
    }

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
      this.fixedVars
        .Where(() => {},
        !SolverShell.Close(kv.Value, this.GetVariableResolvedPosition(kv.Key)))
        .Select(() => {}, p.Key),
    )
    if (movedFixedVars.Count == 0) {
      return false
    }

    return this.AdjustConstraintsForMovedFixedVarSet(movedFixedVars)
  }

  static Close(a: number, b: number): boolean {
    return Math.Abs(a - b) < 0.0005
    // so if a fixed variable moved less than 0.0001 we do not care!
  }

  AdjustConstraintsForMovedFixedVarSet(movedFixedVars: Set<number>): boolean {
    while (movedFixedVars.Count > 0) {
      const fixedVar = movedFixedVars.First()
      if (!this.AdjustSubtreeOfFixedVar(fixedVar, /* ref */ movedFixedVars)) {
        return false
      }
    }

    return true
  }

  AdjustSubtreeOfFixedVar(
    fixedVar: number,
    /* ref */ movedFixedVars: Set<number>,
  ): boolean {
    let successInAdjusting: boolean
    const neighbors = this.AdjustConstraintsOfNeighborsOfFixedVariable(
      fixedVar,
      /* out */ successInAdjusting,
    )
    if (!successInAdjusting) {
      return false
    }

    if (!neighbors.Any()) {
      return false
    }

    for (const i of neighbors) {
      movedFixedVars.Remove(i)
    }

    return true
  }

  ///  <summary>
  ///  returns the block of the fixed variable
  ///  </summary>
  ///  <param name="fixedVar"></param>
  ///  <param name="successInAdjusing"></param>
  ///  <returns></returns>
  AdjustConstraintsOfNeighborsOfFixedVariable(
    fixedVar: number,
    /* out */ successInAdjusing: boolean,
  ): IEnumerable<number> {
    const nbs = this.variables[fixedVar].Block.Variables
    const currentSpan = new RealNumberSpan()
    const idealSpan = new RealNumberSpan()
    let scale = 1
    for (const u of nbs) {
      if (!this.fixedVars.ContainsKey(<number>u.UserData)) {
        // TODO: Warning!!! continue If
      }

      currentSpan.AddValue(u.ActualPos)
      idealSpan.AddValue(u.DesiredPos)
      if (idealSpan.Length > 0) {
        scale = Math.Max(scale, currentSpan.Length / idealSpan.Length)
      }
    }

    if (scale == 1) {
      scale = 2
    }

    // just relax the constraints
    successInAdjusing = this.FixActiveConstraints(nbs, scale)
    return nbs.Select(() => {}, <number>u.UserData)
  }

  ///  <summary>
  ///  if all active constraint gaps are less than this epsilon we should stop trying adjusting
  ///  </summary>
  /* const */ static FailToAdjustEpsilon = 0.001

  FixActiveConstraints(neighbs: IEnumerable<Variable>, scale: number): boolean {
    let ret = false
    for (const c of from) {
      v
    }

    let from: neighbs
    c
    let where: v.LeftConstraints
    let select: c.IsActive
    c
    if (c.Gap > FailToAdjustEpsilon) {
      ret = true
    }

    this.solver.SetConstraintUpdate(c, c.Gap / scale)
    return ret
  }

  ///  <summary>
  ///  Obtain the solved position for a node.
  ///  </summary>
  ///  <param name="id">Caller's unique identifier for the node.</param>
  ///  <returns>The node's solved position.</returns>
  public GetVariableResolvedPosition(id: number): number {
    const v = this.GetVariable(id)
    return 0
    // TODO: Warning!!!, inline IF is not supported ?
    v == null
    v.ActualPos
  }

  ///  <summary>
  ///
  ///  </summary>
  public InitSolver() {
    this.solver = new Solver()
    this.variables.Clear()
  }

  ///  <summary>
  ///  Add a variable with a known and unchanging position.
  ///  </summary>
  ///  <param name="id">Caller's unique identifier for the node</param>
  ///  <param name="position">Desired position.</param>
  public AddFixedVariable(id: number, position: number) {
    this.AddVariableWithIdealPosition(id, position, FixedVarWeight)
    this.fixedVars[id] = position
  }

  ///  <summary>
  ///
  ///  </summary>
  ///  <param name="v"></param>
  ///  <returns></returns>
  public ContainsVariable(v: number): boolean {
    return this.variables.ContainsKey(v)
  }

  ///  <summary>
  ///  returns the ideal position of the node that had been set at the variable construction
  ///  </summary>
  ///  <param name="v"></param>
  ///  <returns></returns>
  public GetVariableIdealPosition(v: number): number {
    return this.variables[v].DesiredPos
  }

  ///  <summary>
  ///  Returns the solution object class specific to the underlying solver, or null if there has
  ///  been no call to Solve() or it threw an exception.
  ///  </summary>
  public get Solution(): Object {
    return this.solution
  }
}
