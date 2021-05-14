// if max is an integer then returns random in the range [0, max-1]
class foo {
  static count = 0
}
export function randomInt(max: number) {
  return foo.count++ % Math.floor(max)
  //Math.floor(Math.random() * Math.floor(max))
}
