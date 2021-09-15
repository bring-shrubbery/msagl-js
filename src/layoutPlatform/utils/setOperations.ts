export function subSets<T>(a: Set<T>, b: Set<T>): Set<T> {
  const ret = new Set<T>()
  for (const u of a) {
    if (!b.has(u)) ret.add(u)
  }
  return ret
}
export function addSets<T>(a: Set<T>, b: Set<T>): Set<T> {
  const ret = new Set<T>(a)
  for (const v of b) ret.add(v)

  return ret
}
