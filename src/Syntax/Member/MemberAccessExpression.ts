import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { SelectorNode } from '../SelectorNode.js'

export class MemberAccessExpression implements Node {
  readonly kind = ExpressionKind.MemberAccess

  constructor(
    readonly operand: Expression,
    readonly dot: Span,
    readonly question: Span | null,
    readonly field: SelectorNode,
  ) {}

  isOptional(): boolean {
    return this.question !== null
  }

  getChildren(): Node[] {
    return [this.operand, this.field]
  }

  getSpan(): Span {
    return this.operand.getSpan().join(this.field.span)
  }
}
