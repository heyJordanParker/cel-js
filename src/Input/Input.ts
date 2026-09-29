export function isSpace(char: string): boolean {
  return char !== '' && ' \t\n\r\v\f'.includes(char)
}

export class Input {
  private cursor = 0

  constructor(private readonly text: string) {}

  cursorPosition(): number {
    return this.cursor
  }

  hasReachedEnd(): boolean {
    return this.cursor >= this.text.length
  }

  consume(count: number): string {
    const slice = this.read(count)
    this.cursor = Math.min(this.cursor + slice.length, this.text.length)
    return slice
  }

  consumeUntil(search: string): string {
    const position = this.text.indexOf(search, this.cursor)
    if (position === -1) {
      const remaining = this.text.slice(this.cursor)
      this.cursor = this.text.length
      return remaining
    }

    const slice = this.text.slice(this.cursor, position)
    this.cursor = position
    return slice
  }

  consumeWhiteSpace(): string {
    const start = this.cursor
    while (
      this.cursor < this.text.length &&
      isSpace(this.text.charAt(this.cursor))
    ) {
      this.cursor++
    }

    return this.text.slice(start, this.cursor)
  }

  read(count: number): string {
    return this.text.slice(this.cursor, this.cursor + count)
  }

  peek(offset: number, count: number): string {
    const from = this.cursor + offset
    return this.text.slice(from, from + count)
  }
}
