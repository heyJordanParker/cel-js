export class Span {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {}

  static zero(): Span {
    return new Span(0, 0)
  }

  join(other: Span): Span {
    return new Span(this.start, other.end)
  }

  length(): number {
    return this.end - this.start
  }

  toString(): string {
    return `[${this.start}..${this.end}]`
  }
}
