export class AttrContainer {
  private attrs: any[] = []

  get length() {
    return this.attrs.length
  }

  clearAttr() {
    this.attrs = []
  }
  setAttr(position: number, val: any) {
    // todo : make it more JavaScript
    this.attrs[position] = val
  }
  getAttr(position: number): any {
    return this.attrs[position]
  }
}
