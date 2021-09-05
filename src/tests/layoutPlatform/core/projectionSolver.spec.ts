import {Solver} from '../../../layoutPlatform/core/projectionSolver/Solver'
test('two vars test', () => {
  const s = new Solver()
  expect(5).toBe(5)
  const v0 = s.AddVariableAN('v0', 0)
  const v1 = s.AddVariableAN('v1', 1)
  s.Solve()
})
