import {Assert} from '../../utils/assert'
import {IntPairSet} from '../../utils/IntPairSet'
import {randomInt} from '../../utils/random'

xtest('IntPairSet', () => {
  const m = new IntPairSet(3)
  m.addNN(0, 0)
  m.addNN(1, 1)
  m.addNN(2, 2)
  m.addNN(2, 1)

  const p = Array.from(m.values())
  expect(p.length).toBe(4)
  expect(p[0].y < 3).toBe(true)
})

xtest('IntPairSet perf', () => {
  const n = 10000
  const m = new IntPairSet(n)
  for (let i = 0; i < n; i++) {
    const j = randomInt(10)
    Assert.assert(j >= 0 && j < 10)
    for (let k = 0; k < j; k++) m.addNN(i, k)
  }
})
