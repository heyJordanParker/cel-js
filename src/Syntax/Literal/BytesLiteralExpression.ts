import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class BytesLiteralExpression implements Node {
  readonly kind = ExpressionKind.BytesLiteral

  constructor(
    readonly value: Uint8Array,
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
