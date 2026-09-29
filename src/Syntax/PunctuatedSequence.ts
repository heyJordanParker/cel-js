import { Span } from '../Span/Span.js'

export class PunctuatedSequence<T> {
  constructor(
    readonly elements: T[],
    readonly commas: Span[],
  ) {}

  count(): number {
    return this.elements.length
  }
}
