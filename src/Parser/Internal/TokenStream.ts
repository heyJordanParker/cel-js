import { Lexer } from '../../Lexer/Lexer.js'
import { Token } from '../../Token/Token.js'
import { TokenKind } from '../../Token/TokenKind.js'
import { UnexpectedEndOfFileException } from '../Exception/UnexpectedEndOfFileException.js'
import { UnexpectedTokenException } from '../Exception/UnexpectedTokenException.js'

export class TokenStream {
  private cursor = 0
  private readonly buffer: Token[] = []

  constructor(private readonly lexer: Lexer) {}

  cursorPosition(): number {
    return this.cursor
  }

  hasReachedEnd(): boolean {
    this.fillBuffer(1)
    return this.buffer.length === 0
  }

  consume(): Token {
    this.fillBuffer(1)
    const token = this.buffer.shift()
    if (token === undefined) {
      throw new UnexpectedEndOfFileException(this.cursorPosition())
    }

    this.cursor = token.span.end
    return token
  }

  eat(kind: TokenKind): Token {
    const token = this.peek()
    if (token.kind !== kind) {
      throw new UnexpectedTokenException(token, [kind])
    }

    return this.consume()
  }

  isAt(kind: TokenKind): boolean {
    return this.lookahead(0)?.kind === kind
  }

  peek(): Token {
    const token = this.lookahead(0)
    if (token === null) {
      throw new UnexpectedEndOfFileException(this.cursorPosition())
    }

    return token
  }

  lookahead(n: number): Token | null {
    this.fillBuffer(n + 1)
    return this.buffer[n] ?? null
  }

  private fillBuffer(n: number): void {
    while (this.buffer.length < n) {
      const token = this.lexer.advance()
      if (token === null) {
        return
      }

      if (token.kind === TokenKind.Whitespace || token.kind === TokenKind.Comment) {
        continue
      }

      this.buffer.push(token)
    }
  }
}
