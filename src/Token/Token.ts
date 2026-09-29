import { Span } from '../Span/Span.js'
import { TokenKind } from './TokenKind.js'

export class Token {
  constructor(
    readonly span: Span,
    readonly kind: TokenKind,
    readonly value: string,
  ) {}
}
