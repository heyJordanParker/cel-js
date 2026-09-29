import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class StringLiteralExpression implements Node {
  readonly kind = ExpressionKind.StringLiteral

  constructor(
    readonly value: string,
    readonly raw: string,
    readonly span: Span,
  ) {}

  getChildren(): Node[] {
    return []
  }

  getSpan(): Span {
    return this.span
  }
}
