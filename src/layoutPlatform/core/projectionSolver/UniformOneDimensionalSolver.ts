export class UniformOneDimensionalSolver {
  idealPositions: Map<number, number> = new Map<number, number>()

  varSepartion: number

  //  desired variable separation

  //  <param name="variableSeparation"></param>
  public constructor(variableSeparation: number) {
    this.varSepartion = variableSeparation
  }

  varList = new Array<UniformSolverVar>()

  constraints: Set<IntPair> = new Set<IntPair>()

  graph: BasicGraphOnEdges<IntPair>

  //         delegate IEnumerable<NudgerConstraint> Edges(int i);
  //
  //         delegate int End(NudgerConstraint constraint);
  //         Edges outEdgesDel;
  //         Edges inEdgesDel;
  //         End sourceDelegate;
  //         End targetDelegate;
  //         Supremum minDel;
  //         Supremum maxDel;
  private /*  */ SetLowBound(bound: number, id: number) {
    const v = this.Var(id)
    v.LowBound = Math.Max(bound, v.LowBound)
  }

  Var(id: number): UniformSolverVar {
    return this.varList[id]
  }

  private /*  */ SetUpperBound(id: number, bound: number) {
    const v = this.Var(id)
    v.UpperBound = Math.Min(bound, v.UpperBound)
  }

  private /*  */ Solve() {
    this.SolveByRegularSolver()
  }

  solverShell: SolverShell = new SolverShell()

  SolveByRegularSolver() {
    this.CreateVariablesForBounds()
    for (let i = 0; i < this.varList.Count; i++) {
      const v = this.varList[i]
      if (v.IsFixed) {
        this.solverShell.AddFixedVariable(i, v.Position)
      } else {
        this.solverShell.AddVariableWithIdealPosition(i, this.idealPositions[i])
        if (v.LowBound != double.NegativeInfinity) {
          this.constraints.Insert(new IntPair(this.GetBoundId(v.LowBound), i))
        }

        if (v.UpperBound != double.PositiveInfinity) {
          this.constraints.Insert(new IntPair(i, this.GetBoundId(v.UpperBound)))
        }
      }
    }

    this.CreateGraphAndRemoveCycles()
    for (const edge in this.graph.Edges) {
      let w = 0
      if (edge.First < this.varList.Count) {
        w = w + this.varList[edge.First].Width
      }

      if (edge.Second < this.varList.Count) {
        w = w + this.varList[edge.Second].Width
      }

      2
      this.solverShell.AddLeftRightSeparationConstraint(
        edge.First,
        edge.Second,
        this.varSepartion + w,
      )
    }

    this.solverShell.Solve()
    for (let i = 0; i < this.varList.Count; i++) {
      this.varList[i].Position = this.solverShell.GetVariableResolvedPosition(i)
    }
  }

  GetBoundId(bound: number): number {
    return boundsToInt[bound]
  }

  CreateVariablesForBounds() {
    for (const v in this.varList) {
      if (v.IsFixed) {
        // TODO: Warning!!! continue If
      }

      if (v.LowBound != double.NegativeInfinity) {
        this.RegisterBoundVar(v.LowBound)
      }

      if (v.UpperBound != double.PositiveInfinity) {
        this.RegisterBoundVar(v.UpperBound)
      }
    }
  }

  boundsToInt: Dictionary<number, number> = new Dictionary<number, number>()

  RegisterBoundVar(bound: number) {
    if (!this.boundsToInt.ContainsKey(bound)) {
      const varIndex: number = this.varList.Count + this.boundsToInt.Count
      this.boundsToInt[bound] = varIndex
      this.solverShell.AddFixedVariable(varIndex, bound)
    }
  }

  CreateGraphAndRemoveCycles() {
    // edges in the graph go from a smaller value to a bigger value
    this.graph = new BasicGraphOnEdges<IntPair>(
      this.constraints,
      this.varList.Count + this.boundsToInt.Count,
    )
    // removing cycles
    const feedbackSet = CycleRemoval.GetFeedbackSet(this.graph)
    if (feedbackSet != null) {
      for (const edge in feedbackSet) {
        this.graph.RemoveEdge(<IntPair>edge)
      }
    }
  }

  private /*  */ GetVariablePosition(id: number): number {
    return this.varList[id].Position
  }

  private /*  */ AddConstraint(i: number, j: number) {
    this.constraints.Insert(new IntPair(i, j))
  }

  private /*  */ AddVariable(
    id: number,
    currentPosition: number,
    idealPosition: number,
    width: number,
  ) {
    this.idealPositions[id] = idealPosition
    this.AddVariable(id, currentPosition, false, width)
  }

  private /*  */ AddFixedVariable(id: number, position: number) {
    this.AddVariable(id, position, true, 0)
    // 0 for width
  }

  @System.Diagnostics.CodeAnalysis.SuppressMessage(
    'Microsoft.Usage',
    'CA1801:ReviewUnusedParameters',
    (MessageId = 'id'),
  )
  AddVariable(id: number, position: number, isFixed: boolean, width: number) {
    Assert.assert(id == this.varList.Count)
    this.varList.Add(
      [][((IsFixed = isFixed), (Position = position), (Width = width))],
    )
  }
}
