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

export function AddRange<T>(array: Array<T>, addedArray: Iterable<T>) {
  for (const t of addedArray) array.push(t)
}

export function InsertRange<T>(collection: Set<T>, addedArray: Iterable<T>) {
  for (const t of addedArray) collection.add(t)
}
