export function substructSets<T>(a: Set<T>, b: Set<T>): Set<T> {
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

export function addRange<T>(array: Array<T>, addedArray: Iterable<T>) {
  for (const t of addedArray) array.push(t)
}

export function setIntersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const ret = new Set<T>()
  if (a.size < b.size) {
    for (const t of a) {
      if (b.has(t)) ret.add(t)
    }
  } else {
    for (const t of b) {
      if (a.has(t)) ret.add(t)
    }
  }
  return ret
}

export function insertRange<T>(collection: Set<T>, addedArray: Iterable<T>) {
  for (const t of addedArray) collection.add(t)
}

export function setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size != b.size) return false
  for (const u of a) if (!b.has(u)) return false
  return true
}

export function flatMap<U, T>(
  arr: ReadonlyArray<T>,
  callback: (elem: T) => ReadonlyArray<U>,
): U[] {
  const ret = []
  for (const f of arr) {
    for (const u of callback(f)) ret.push(u)
  }
  return ret
}
