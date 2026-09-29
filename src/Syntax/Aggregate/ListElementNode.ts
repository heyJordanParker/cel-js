import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import type { Node } from '../Node.js'

export class ListElementNode implements Node {
  constructor(
    readonly question: Span | null,
    readonly value: Expression,
  ) {}

  isOptional(): boolean {
    return this.question !== null
  }

  getChildren(): Node[] {
    return [this.value]
  }
}
