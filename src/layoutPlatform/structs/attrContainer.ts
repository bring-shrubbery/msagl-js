export class AttrContainer {
  private attrs: any[]
  constructor() {
    this.attrs = []
  }

  get length() {
    return this.attrs.length
  }

  clearAttr() {
    this.attrs = []
  }
  setAttr(position: number, val: any) {
    if (this.attrs.length < position) {
      do {
        this.attrs.push(null)
      } while (this.attrs.length < position)
      this.attrs.push(val)
    } else if (this.attrs.length == position) {
      this.attrs.push(val)
    } else {
      this.attrs[position] = val
    }
  }
  getAttr(position: number): any {
    if (this.attrs.length > position) {
      return this.attrs[position]
    }
    return null
  }
}
