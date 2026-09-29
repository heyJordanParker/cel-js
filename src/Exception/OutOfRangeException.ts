import { Exception } from './Exception.js'

export class OutOfRangeException extends Exception {
  override name = 'OutOfRangeException'

  static forOffset(offset: number): OutOfRangeException {
    return new OutOfRangeException(`Offset ${offset} is out of bounds`)
  }
}
