export class Assert {
  static assert(p: boolean) {
    if (!p) {
      throw 'condition does not hold';
    }
  }
}
