export class Assert {
  static assert(p: boolean, s: string = null) {
    if (!p) {
      if (s != null) console.log(s);
      throw 'condition does not hold';
    }
  }
}
