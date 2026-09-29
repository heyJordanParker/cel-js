import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class NullLiteralExpression implements Node {
  readonly kind = ExpressionKind.NullLiteral
  readonly value = null

  constructor(
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
