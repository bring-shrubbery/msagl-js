import {String} from 'typescript-string-operations'
import {Assert} from '../../utils/assert'
import {Constraint} from './Constraint'
import {ConstraintVector} from './ConstraintVector'
import {DfDvNode} from './DfDvNode'
import {Variable} from './Variable'
///  <summary>
///  variableDoneEval is NULL if we are starting an evaluation; if recursive, it's the variable
///  on that side from the parent call, which was already processed.
///  </summary>
export class DfDvNode {
  Parent: DfDvNode
  ConstraintToEval(): Constraint {}
  set ConstraintToEval(value: Constraint) {}

  get VariableToEval(): Variable {}
  set VariableToEval(value: Variable) {}

  get VariableDoneEval(): Variable {}
  set VariableDoneEval(value: Variable) {}

  //  For Solution.MaxConstraintTreeDepth
  get Depth(): number {}
  set Depth(value: number) {}

  get ChildrenHaveBeenPushed(): boolean {}
  set ChildrenHaveBeenPushed(value: boolean) {}

  constructor(
    parent: DfDvNode,
    constraintToEval: Constraint,
    variableToEval: Variable,
    variableDoneEval: Variable,
  ) {
    this.Set(parent, constraintToEval, variableToEval, variableDoneEval)
  }

  //  For DummyParentNode only.
  constructor(dummyConstraint: Constraint) {
    this.ConstraintToEval = dummyConstraint
    this.Depth = -1
    //  The first real node adds 1, so it starts at 0.
  }

  Set(
    parent: DfDvNode,
    constraintToEval: Constraint,
    variableToEval: Variable,
    variableDoneEval: Variable,
  ): DfDvNode {
    this.Parent = parent
    this.ConstraintToEval = constraintToEval
    this.VariableToEval = variableToEval
    this.VariableDoneEval = variableDoneEval
    this.Depth = 0
    this.ChildrenHaveBeenPushed = false
    constraintToEval.Lagrangian = 0
    return this
  }

  get IsLeftToRight(): boolean {
    return this.VariableToEval == this.ConstraintToEval.Right
  }

  ///  <summary>
  ///  </summary>
  toString(): string {
    return String.Format(
      '{0} {1}{2} - {3}{4} ({5})',
      '',
      this.IsLeftToRight ? '' : '*',
      this.ConstraintToEval.Left.Name,
      this.IsLeftToRight ? '*' : '',
      this.ConstraintToEval.Right.Name,
      this.Depth,
    )
  }
}
