import { Exception } from './Exception.js'

export class InternalException extends Exception {
  override name = 'InternalException'

  static forMessage(message: string, previous?: unknown): InternalException {
    return new InternalException(message, { cause: previous })
  }
}
