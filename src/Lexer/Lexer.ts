import { Input, isSpace } from '../Input/Input.js'
import { Span } from '../Span/Span.js'
import { Token } from '../Token/Token.js'
import { TokenKind } from '../Token/TokenKind.js'
import {
  isAtIdentifier,
  isAtNumberLiteral,
  isAtStringLiteral,
  readIdentifier,
  readNumberLiteral,
  readStringLiteral,
} from './Internal/Utils.js'

const DOUBLE: Readonly<Record<string, TokenKind>> = {
  '&&': TokenKind.DoubleAmpersand,
  '||': TokenKind.DoublePipe,
  '??': TokenKind.DoubleQuestion,
  '==': TokenKind.Equal,
  '!=': TokenKind.NotEqual,
  '<=': TokenKind.LessOrEqual,
  '>=': TokenKind.GreaterOrEqual,
}

const SINGLE: Readonly<Record<string, TokenKind>> = {
  '(': TokenKind.LeftParenthesis,
  ')': TokenKind.RightParenthesis,
  '[': TokenKind.LeftBracket,
  ']': TokenKind.RightBracket,
  '{': TokenKind.LeftBrace,
  '}': TokenKind.RightBrace,
  '.': TokenKind.Dot,
  ',': TokenKind.Comma,
  ':': TokenKind.Colon,
  '?': TokenKind.Question,
  '+': TokenKind.Plus,
  '-': TokenKind.Minus,
  '*': TokenKind.Asterisk,
  '/': TokenKind.Slash,
  '%': TokenKind.Percent,
  '!': TokenKind.Bang,
  '<': TokenKind.Less,
  '>': TokenKind.Greater,
}

export class Lexer {
  constructor(private readonly input: Input) {}

  cursorPosition(): number {
    return this.input.cursorPosition()
  }

  hasReachedEnd(): boolean {
    return this.input.hasReachedEnd()
  }

  advance(): Token | null {
    if (this.hasReachedEnd()) {
      return null
    }

    const start = this.cursorPosition()
    const char = this.input.read(1)

    if (isSpace(char)) {
      const value = this.input.consumeWhiteSpace()
      return new Token(new Span(start, this.cursorPosition()), TokenKind.Whitespace, value)
    }

    if (char === '/' && this.input.peek(1, 1) === '/') {
      let value = this.input.consumeUntil('\n')
      if (!this.hasReachedEnd()) {
        value += this.input.consume(1)
      }

      return new Token(new Span(start, this.cursorPosition()), TokenKind.Comment, value)
    }

    const [kind, value] = this.read(char)

    return new Token(new Span(start, this.cursorPosition()), kind, value)
  }

  private read(char: string): [TokenKind, string] {
    if (isAtNumberLiteral(this.input)) {
      return readNumberLiteral(this.input)
    }

    if (isAtStringLiteral(this.input)) {
      return readStringLiteral(this.input)
    }

    if (isAtIdentifier(this.input)) {
      return readIdentifier(this.input)
    }

    const pair = this.input.peek(0, 2)
    if (Object.hasOwn(DOUBLE, pair)) {
      return [DOUBLE[pair], this.input.consume(2)]
    }

    if (Object.hasOwn(SINGLE, char)) {
      return [SINGLE[char], this.input.consume(1)]
    }

    return [TokenKind.Unrecognized, this.input.consume(1)]
  }
}
