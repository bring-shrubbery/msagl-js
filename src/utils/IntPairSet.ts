
export class IntPairSet {
    set: Set<number>[]
    has(x: number, y: number):boolean {
        if (x < 0 || x >= this.set.length) {
            return false
        }
        return this.set[x].has(y)
    }
    constructor(n: number) {
        this.set = new Array<Set<number>>(n)
        for (let i = 0; i < n; i++) this.set[i] = new Set<number>()
    }
}
