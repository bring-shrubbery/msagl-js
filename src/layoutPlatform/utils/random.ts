// if max is an integer then returns random in the range [0, max-1]
export function randomInt(max: number) {
  return Math.floor(Math.random()) % Math.floor(max)
}
