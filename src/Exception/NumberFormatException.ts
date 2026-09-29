import { Exception } from './Exception.js'

export class NumberFormatException extends Exception {
  override name = 'NumberFormatException'

  static forInvalidDigit(digit: string, base: number): NumberFormatException {
    return new NumberFormatException(`Invalid digit ${digit} in base ${base}`)
  }

  static forOverflow(number: string, base: number): NumberFormatException {
    return new NumberFormatException(
      `Unexpected integer overflow parsing ${number} from base ${base}`,
    )
  }
}
