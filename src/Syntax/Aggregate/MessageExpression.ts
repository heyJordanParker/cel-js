import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { PunctuatedSequence } from '../PunctuatedSequence.js'
import { SelectorNode } from '../SelectorNode.js'
import { FieldInitializerNode } from './FieldInitializerNode.js'

export class MessageExpression implements Node {
  readonly kind = ExpressionKind.Message

  constructor(
    readonly dot: Span | null,
    readonly selector: SelectorNode,
    readonly followingSelectors: PunctuatedSequence<SelectorNode>,
    readonly openingBrace: Span,
    readonly initializers: PunctuatedSequence<FieldInitializerNode>,
    readonly closingBrace: Span,
  ) {}

  getChildren(): Node[] {
    return [this.selector, ...this.followingSelectors.elements, ...this.initializers.elements]
  }

  getSpan(): Span {
    return (this.dot ?? this.selector.span).join(this.closingBrace)
  }
}
