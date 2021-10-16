// if max is an integer then returns random in the range [0, max-1]
import {Random} from 'reliable-random'
let t: Random
export function randomInt(max: number) {
  if (t == null) {
    t = new Random(0, 0)
  }

  return t.randint(max)
}

export function initRandom(seed: number) {
  t = new Random(seed, 0)
}

export function random() {
  if (t == null) {
    t = new Random(0, 0)
  }

  return t.random()
}
