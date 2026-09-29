import { Exception } from '../../Exception/Exception.js'
import { TokenKind } from '../../Token/TokenKind.js'

export class UnexpectedEndOfFileException extends Exception {
  override name = 'UnexpectedEndOfFileException'

  constructor(
    readonly position: number,
    readonly expected: TokenKind[] = [],
  ) {
    const expecting =
      expected.length > 0 ? ', expected one of: `' + expected.join('`, `') + '`' : ''
    super(`Unexpected end of file${expecting} at position ${position}.`)
  }
}
