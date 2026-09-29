import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import { IdentifierNode } from '../IdentifierNode.js'
import type { Node } from '../Node.js'

export class IdentifierExpression implements Node {
  readonly kind = ExpressionKind.Identifier

  constructor(
    readonly leadingDot: Span | null,
    readonly identifier: IdentifierNode,
  ) {}

  getChildren(): Node[] {
    return [this.identifier]
  }

  getSpan(): Span {
    return this.leadingDot === null
      ? this.identifier.span
      : this.leadingDot.join(this.identifier.span)
  }
}
