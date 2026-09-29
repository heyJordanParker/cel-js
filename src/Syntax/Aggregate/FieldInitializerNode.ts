import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import type { Node } from '../Node.js'
import { SelectorNode } from '../SelectorNode.js'

export class FieldInitializerNode implements Node {
  constructor(
    readonly question: Span | null,
    readonly field: SelectorNode,
    readonly colon: Span,
    readonly value: Expression,
  ) {}

  isOptional(): boolean {
    return this.question !== null
  }

  getChildren(): Node[] {
    return [this.field, this.value]
  }
}
