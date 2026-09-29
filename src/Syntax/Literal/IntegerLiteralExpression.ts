import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class IntegerLiteralExpression implements Node {
  readonly kind = ExpressionKind.IntLiteral

  constructor(
    readonly value: number,
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
