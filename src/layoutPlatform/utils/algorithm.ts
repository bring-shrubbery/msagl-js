import {CancelToken} from './cancelToken'

export abstract class Algorithm {
  constructor(cancelToken: CancelToken) {
    this.cancelToken = cancelToken
  }
  abstract run(): void
  cancelToken: CancelToken
}
