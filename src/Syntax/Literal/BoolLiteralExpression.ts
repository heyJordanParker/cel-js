import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class BoolLiteralExpression implements Node {
  readonly kind = ExpressionKind.BoolLiteral

  constructor(
    readonly value: boolean,
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
