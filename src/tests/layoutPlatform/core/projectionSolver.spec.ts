import {Solver} from '../../../layoutPlatform/core/projectionSolver/Solver'
import {closeDistEps} from '../../../layoutPlatform/utils/compare'
test('two vars test', () => {
  const s = new Solver()
  const v0 = s.AddVariableAN('v0', 0)
  const v1 = s.AddVariableAN('v1', 1)
  s.AddConstraint(v0, v1, 1)
  s.Solve()
  expect(v0.ActualPos).toBe(v0.DesiredPos)
  expect(v1.ActualPos).toBe(v1.DesiredPos)
})
test('two vars test, one real constr', () => {
  const s = new Solver()
  const v0 = s.AddVariableAN('v0', 0)
  const v1 = s.AddVariableAN('v1', 1)
  s.AddConstraint(v0, v1, 2)
  s.Solve()
  expect(v0.ActualPos).toBeLessThan(v1.ActualPos)
})

test('three vars test, one real constr', () => {
  const s = new Solver()
  const v0 = s.AddVariableAN('v0', 0)
  const v1 = s.AddVariableAN('v1', 1)
  const v2 = s.AddVariableAN('v2', 2)
  s.AddConstraint(v0, v1, 2)
  s.AddConstraint(v1, v2, 2)
  s.Solve()
  expect(v0.ActualPos).toBeLessThan(v1.ActualPos)
  expect(v1.ActualPos).toBeLessThan(v2.ActualPos)
  expect(
    closeDistEps(v0.ActualPos - v1.ActualPos, v1.ActualPos - v2.ActualPos),
  ).toBe(true)
})
