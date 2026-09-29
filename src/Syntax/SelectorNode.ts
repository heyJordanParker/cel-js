import { Span } from '../Span/Span.js'
import type { Node } from './Node.js'

export class SelectorNode implements Node {
  constructor(
    readonly name: string,
    readonly span: Span,
  ) {}

  getChildren(): Node[] {
    return []
  }

  getSpan(): Span {
    return this.span
  }
}
