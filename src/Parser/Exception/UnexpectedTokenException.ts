import { Exception } from '../../Exception/Exception.js'
import { Token } from '../../Token/Token.js'
import { TokenKind } from '../../Token/TokenKind.js'

export class UnexpectedTokenException extends Exception {
  override name = 'UnexpectedTokenException'

  constructor(
    readonly found: Token,
    readonly expected: TokenKind[] = [],
  ) {
    const expecting =
      expected.length > 0 ? ', expected one of: `' + expected.join('`, `') + '`' : ''
    super(
      `Unexpected token \`${found.kind}\` with value '${found.value}'${expecting} at span [${found.span.start}, ${found.span.end}].`,
    )
  }
}
