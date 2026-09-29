import { InternalException } from '../Exception/InternalException.js'
import { Input } from '../Input/Input.js'
import { Lexer } from '../Lexer/Lexer.js'
import { Span } from '../Span/Span.js'
import { FieldInitializerNode } from '../Syntax/Aggregate/FieldInitializerNode.js'
import { ListElementNode } from '../Syntax/Aggregate/ListElementNode.js'
import { ListExpression } from '../Syntax/Aggregate/ListExpression.js'
import { MapEntryNode } from '../Syntax/Aggregate/MapEntryNode.js'
import { MapExpression } from '../Syntax/Aggregate/MapExpression.js'
import { MessageExpression } from '../Syntax/Aggregate/MessageExpression.js'
import { BinaryExpression } from '../Syntax/Binary/BinaryExpression.js'
import { BinaryOperator } from '../Syntax/Binary/BinaryOperator.js'
import { BinaryOperatorKind } from '../Syntax/Binary/BinaryOperatorKind.js'
import { ConditionalExpression } from '../Syntax/ConditionalExpression.js'
import type { Expression } from '../Syntax/Expression.js'
import { IdentifierNode } from '../Syntax/IdentifierNode.js'
import { BoolLiteralExpression } from '../Syntax/Literal/BoolLiteralExpression.js'
import { BytesLiteralExpression } from '../Syntax/Literal/BytesLiteralExpression.js'
import { FloatLiteralExpression } from '../Syntax/Literal/FloatLiteralExpression.js'
import { IntegerLiteralExpression } from '../Syntax/Literal/IntegerLiteralExpression.js'
import { NullLiteralExpression } from '../Syntax/Literal/NullLiteralExpression.js'
import { StringLiteralExpression } from '../Syntax/Literal/StringLiteralExpression.js'
import { UnsignedIntegerLiteralExpression } from '../Syntax/Literal/UnsignedIntegerLiteralExpression.js'
import { CallExpression } from '../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../Syntax/Member/IdentifierExpression.js'
import { IndexExpression } from '../Syntax/Member/IndexExpression.js'
import { MemberAccessExpression } from '../Syntax/Member/MemberAccessExpression.js'
import { ParenthesizedExpression } from '../Syntax/ParenthesizedExpression.js'
import { PunctuatedSequence } from '../Syntax/PunctuatedSequence.js'
import { SelectorNode } from '../Syntax/SelectorNode.js'
import { UnaryExpression } from '../Syntax/Unary/UnaryExpression.js'
import { UnaryOperator } from '../Syntax/Unary/UnaryOperator.js'
import { UnaryOperatorKind } from '../Syntax/Unary/UnaryOperatorKind.js'
import { Token } from '../Token/Token.js'
import { TokenKind, isLiteral } from '../Token/TokenKind.js'
import { fromBase } from '../Util/NumberBase.js'
import { UnexpectedEndOfFileException } from './Exception/UnexpectedEndOfFileException.js'
import { UnexpectedTokenException } from './Exception/UnexpectedTokenException.js'
import { unescapeBytes, unescapeString } from './Internal/StringUnescaper.js'
import { TokenStream } from './Internal/TokenStream.js'

const BINARY_OPERATORS: Partial<Record<TokenKind, BinaryOperatorKind>> = {
  [TokenKind.DoublePipe]: BinaryOperatorKind.Or,
  [TokenKind.DoubleAmpersand]: BinaryOperatorKind.And,
  [TokenKind.Equal]: BinaryOperatorKind.Equal,
  [TokenKind.NotEqual]: BinaryOperatorKind.NotEqual,
  [TokenKind.Less]: BinaryOperatorKind.LessThan,
  [TokenKind.LessOrEqual]: BinaryOperatorKind.LessThanOrEqual,
  [TokenKind.Greater]: BinaryOperatorKind.GreaterThan,
  [TokenKind.GreaterOrEqual]: BinaryOperatorKind.GreaterThanOrEqual,
  [TokenKind.In]: BinaryOperatorKind.In,
  [TokenKind.Plus]: BinaryOperatorKind.Plus,
  [TokenKind.Minus]: BinaryOperatorKind.Minus,
  [TokenKind.Asterisk]: BinaryOperatorKind.Multiply,
  [TokenKind.Slash]: BinaryOperatorKind.Divide,
  [TokenKind.Percent]: BinaryOperatorKind.Modulo,
}

const OR: ReadonlySet<TokenKind> = new Set([TokenKind.DoublePipe])

const AND: ReadonlySet<TokenKind> = new Set([TokenKind.DoubleAmpersand])

const RELATIONS: ReadonlySet<TokenKind> = new Set([
  TokenKind.Equal,
  TokenKind.NotEqual,
  TokenKind.Less,
  TokenKind.LessOrEqual,
  TokenKind.Greater,
  TokenKind.GreaterOrEqual,
  TokenKind.In,
])

const ADDITIVE: ReadonlySet<TokenKind> = new Set([TokenKind.Plus, TokenKind.Minus])

const MULTIPLICATIVE: ReadonlySet<TokenKind> = new Set([
  TokenKind.Asterisk,
  TokenKind.Slash,
  TokenKind.Percent,
])

const PREFIXES: Readonly<Record<string, number>> = { '0x': 16, '0o': 8, '0b': 2 }

function binaryOperatorKind(kind: TokenKind): BinaryOperatorKind {
  const operator = BINARY_OPERATORS[kind]
  if (operator === undefined) {
    throw InternalException.forMessage(`Not a binary operator token: ${kind}`)
  }

  return operator
}

function prefixedValue(body: string): number | null {
  const base = PREFIXES[body.slice(0, 2)]
  if (base === undefined) {
    return null
  }

  const digits = body.slice(2)
  return digits === '' ? 0 : fromBase(digits, base)
}

function integerLiteralValue(text: string): number {
  const negative = text.startsWith('-')
  const body = (negative ? text.slice(1) : text).toLowerCase()
  const magnitude = prefixedValue(body)
  let value = parseInt(text, 10)
  if (magnitude !== null) {
    value = negative ? -magnitude : magnitude
  }

  return value === 0 ? 0 : value
}

function unsignedIntegerLiteralValue(text: string): number | string {
  const body = text.toLowerCase()
  const prefixed = prefixedValue(body)
  if (prefixed !== null) {
    return prefixed
  }

  const digits = body.replace(/^0+/, '')
  if (digits === '') {
    return 0
  }

  const number = Number(digits)
  return Number.isSafeInteger(number) && String(number) === digits ? number : digits
}

function quoted(value: string, prefixLength: number): string {
  const quote = value.charAt(prefixLength)
  const quoteLength = value.slice(prefixLength, prefixLength + 3) === quote.repeat(3) ? 3 : 1
  const start = prefixLength + quoteLength
  const length = value.length - quoteLength - start

  return value.slice(start, start + Math.max(length, 0))
}

export class Parser {
  private stream!: TokenStream

  parse(source: string): Expression {
    this.stream = new TokenStream(new Lexer(new Input(source)))

    const expression = this.parseExpression()

    if (!this.stream.hasReachedEnd()) {
      throw new UnexpectedTokenException(this.stream.peek())
    }

    return expression
  }

  private parseExpression(): Expression {
    const expression = this.parseCoalesce()

    if (!this.stream.hasReachedEnd() && this.stream.isAt(TokenKind.Question)) {
      const question = this.stream.eat(TokenKind.Question)
      const then = this.parseCoalesce()
      const colon = this.stream.eat(TokenKind.Colon)
      const otherwise = this.parseExpression()

      return new ConditionalExpression(expression, question.span, then, colon.span, otherwise)
    }

    return expression
  }

  private parseBinary(
    operators: ReadonlySet<TokenKind>,
    operand: () => Expression,
  ): Expression {
    let left = operand()

    while (!this.stream.hasReachedEnd() && operators.has(this.stream.peek().kind)) {
      const token = this.stream.consume()
      const operator = new BinaryOperator(binaryOperatorKind(token.kind), token.span)
      left = new BinaryExpression(left, operator, operand())
    }

    return left
  }

  private parseCoalesce(): Expression {
    let left = this.parseConditionalOr()

    while (!this.stream.hasReachedEnd() && this.stream.isAt(TokenKind.DoubleQuestion)) {
      const token = this.stream.eat(TokenKind.DoubleQuestion)
      const operator = new BinaryOperator(BinaryOperatorKind.Coalesce, token.span)
      left = new BinaryExpression(left, operator, this.parseConditionalOr())
    }

    return left
  }

  private parseConditionalOr(): Expression {
    return this.parseBinary(OR, () => this.parseConditionalAnd())
  }

  private parseConditionalAnd(): Expression {
    return this.parseBinary(AND, () => this.parseRelation())
  }

  private parseRelation(): Expression {
    return this.parseBinary(RELATIONS, () => this.parseAddition())
  }

  private parseAddition(): Expression {
    return this.parseBinary(ADDITIVE, () => this.parseMultiplication())
  }

  private parseMultiplication(): Expression {
    return this.parseBinary(MULTIPLICATIVE, () => this.parseUnary())
  }

  private parseUnary(): Expression {
    if (this.stream.isAt(TokenKind.Bang) || this.stream.isAt(TokenKind.Minus)) {
      const token = this.stream.consume()
      const kind = token.kind === TokenKind.Bang ? UnaryOperatorKind.Not : UnaryOperatorKind.Negate

      return new UnaryExpression(new UnaryOperator(kind, token.span), this.parseUnary())
    }

    return this.parseMember()
  }

  private parseMember(): Expression {
    let expression = this.parsePrimary()

    while (!this.stream.hasReachedEnd()) {
      if (this.stream.isAt(TokenKind.Dot)) {
        const dot = this.stream.eat(TokenKind.Dot)
        const question = this.eatOptionalMarker()
        const field = this.stream.eat(TokenKind.Identifier)
        const selector = new SelectorNode(field.value, field.span)

        if (
          question === null &&
          !this.stream.hasReachedEnd() &&
          this.stream.isAt(TokenKind.LeftParenthesis)
        ) {
          const open = this.stream.eat(TokenKind.LeftParenthesis)
          const args = this.parsePunctuatedSequence(TokenKind.RightParenthesis, () =>
            this.parseExpression(),
          )
          const close = this.stream.eat(TokenKind.RightParenthesis)

          expression = new CallExpression(expression, dot.span, selector, open.span, args, close.span)
        } else {
          expression = new MemberAccessExpression(expression, dot.span, question, selector)
        }
      } else if (this.stream.isAt(TokenKind.LeftBracket)) {
        const open = this.stream.eat(TokenKind.LeftBracket)
        const question = this.eatOptionalMarker()
        const index = this.parseExpression()
        const close = this.stream.eat(TokenKind.RightBracket)

        expression = new IndexExpression(expression, open.span, question, index, close.span)
      } else {
        break
      }
    }

    return expression
  }

  private parsePrimary(): Expression {
    if (this.stream.hasReachedEnd()) {
      throw new UnexpectedEndOfFileException(this.stream.cursorPosition())
    }

    let token = this.stream.peek()

    if (token.kind === TokenKind.LeftParenthesis) {
      const left = this.stream.eat(TokenKind.LeftParenthesis)
      const expression = this.parseExpression()
      const right = this.stream.eat(TokenKind.RightParenthesis)
      return new ParenthesizedExpression(left.span, expression, right.span)
    }

    if (token.kind === TokenKind.LeftBracket) {
      return this.parseListLiteral()
    }

    if (token.kind === TokenKind.LeftBrace) {
      return this.parseMapLiteral()
    }

    if (isLiteral(token.kind)) {
      return this.parseLiteral()
    }

    let leadingDot: Token | null = null
    if (token.kind === TokenKind.Dot) {
      leadingDot = this.stream.eat(TokenKind.Dot)
      token = this.stream.peek()
    }

    if (token.kind === TokenKind.Identifier) {
      if (this.isAtMessageLiteral()) {
        return this.parseMessageLiteral(leadingDot?.span ?? null)
      }

      const identifier = this.stream.eat(TokenKind.Identifier)

      if (!this.stream.hasReachedEnd() && this.stream.isAt(TokenKind.LeftParenthesis)) {
        const selector = new SelectorNode(identifier.value, identifier.span)
        const open = this.stream.eat(TokenKind.LeftParenthesis)
        const args = this.parsePunctuatedSequence(TokenKind.RightParenthesis, () =>
          this.parseExpression(),
        )
        const close = this.stream.eat(TokenKind.RightParenthesis)

        return new CallExpression(
          null,
          leadingDot?.span ?? null,
          selector,
          open.span,
          args,
          close.span,
        )
      }

      return new IdentifierExpression(
        leadingDot?.span ?? null,
        new IdentifierNode(identifier.value, identifier.span),
      )
    }

    throw new UnexpectedTokenException(token)
  }

  private parseListLiteral(): ListExpression {
    const open = this.stream.eat(TokenKind.LeftBracket)
    const elements = this.parsePunctuatedSequence(TokenKind.RightBracket, () => {
      const question = this.eatOptionalMarker()
      return new ListElementNode(question, this.parseExpression())
    })
    const close = this.stream.eat(TokenKind.RightBracket)

    return new ListExpression(open.span, elements, close.span)
  }

  private eatOptionalMarker(): Span | null {
    return this.stream.isAt(TokenKind.Question) ? this.stream.eat(TokenKind.Question).span : null
  }

  private parseMapLiteral(): MapExpression {
    const open = this.stream.eat(TokenKind.LeftBrace)
    const entries = this.parsePunctuatedSequence(TokenKind.RightBrace, () => {
      const question = this.eatOptionalMarker()
      const key = this.parseExpression()
      const colon = this.stream.eat(TokenKind.Colon)
      return new MapEntryNode(question, key, colon.span, this.parseExpression())
    })
    const close = this.stream.eat(TokenKind.RightBrace)

    return new MapExpression(open.span, entries, close.span)
  }

  private parseMessageLiteral(leadingDot: Span | null): MessageExpression {
    const first = this.stream.eat(TokenKind.Identifier)
    const selector = new SelectorNode(first.value, first.span)

    const following: SelectorNode[] = []
    const dots: Span[] = []
    while (!this.stream.hasReachedEnd() && this.stream.isAt(TokenKind.Dot)) {
      if (this.stream.lookahead(1)?.kind !== TokenKind.Identifier) {
        break
      }

      dots.push(this.stream.eat(TokenKind.Dot).span)
      const identifier = this.stream.eat(TokenKind.Identifier)
      following.push(new SelectorNode(identifier.value, identifier.span))
    }

    const open = this.stream.eat(TokenKind.LeftBrace)
    const initializers = this.parsePunctuatedSequence(TokenKind.RightBrace, () => {
      const question = this.eatOptionalMarker()
      const field = this.stream.eat(TokenKind.Identifier)
      const colon = this.stream.eat(TokenKind.Colon)
      return new FieldInitializerNode(
        question,
        new SelectorNode(field.value, field.span),
        colon.span,
        this.parseExpression(),
      )
    })
    const close = this.stream.eat(TokenKind.RightBrace)

    return new MessageExpression(
      leadingDot,
      selector,
      new PunctuatedSequence(following, dots),
      open.span,
      initializers,
      close.span,
    )
  }

  private parseLiteral(): Expression {
    const token = this.stream.consume()
    switch (token.kind) {
      case TokenKind.LiteralInt:
        return new IntegerLiteralExpression(integerLiteralValue(token.value), token.value, token.span)
      case TokenKind.LiteralUInt:
        return new UnsignedIntegerLiteralExpression(
          unsignedIntegerLiteralValue(token.value.replace(/[uU]+$/, '')),
          token.value,
          token.span,
        )
      case TokenKind.LiteralFloat:
        return new FloatLiteralExpression(parseFloat(token.value), token.value, token.span)
      case TokenKind.LiteralString:
        return this.parseStringLiteral(token)
      case TokenKind.BytesSequence:
        return this.parseBytesLiteral(token)
      case TokenKind.True:
        return new BoolLiteralExpression(true, token.value, token.span)
      case TokenKind.False:
        return new BoolLiteralExpression(false, token.value, token.span)
      case TokenKind.Null:
        return new NullLiteralExpression(token.value, token.span)
      default:
        throw new UnexpectedTokenException(token)
    }
  }

  private parseStringLiteral(token: Token): StringLiteralExpression {
    try {
      const isRaw = token.value.charAt(0).toLowerCase() === 'r'
      const content = quoted(token.value, isRaw ? 1 : 0)

      return new StringLiteralExpression(
        isRaw ? content : unescapeString(content),
        token.value,
        token.span,
      )
    } catch (error) {
      if (!(error instanceof InternalException)) throw error
      throw InternalException.forMessage(`String literal parsing failed: ${error.message}`, error)
    }
  }

  private parseBytesLiteral(token: Token): BytesLiteralExpression {
    try {
      const prefix = token.value.slice(0, 2).toLowerCase()
      const isRaw = prefix === 'br' || prefix === 'rb'
      const content = quoted(token.value, isRaw ? 2 : 1)

      return new BytesLiteralExpression(
        isRaw ? new TextEncoder().encode(content) : unescapeBytes(content),
        token.value,
        token.span,
      )
    } catch (error) {
      if (!(error instanceof InternalException)) throw error
      throw InternalException.forMessage(`Bytes literal parsing failed: ${error.message}`, error)
    }
  }

  private parsePunctuatedSequence<T>(end: TokenKind, parse: () => T): PunctuatedSequence<T> {
    const elements: T[] = []
    const commas: Span[] = []

    if (this.stream.isAt(end)) {
      return new PunctuatedSequence(elements, commas)
    }

    for (;;) {
      elements.push(parse())

      if (this.stream.hasReachedEnd() || this.stream.isAt(end)) {
        break
      }

      commas.push(this.stream.eat(TokenKind.Comma).span)

      if (this.stream.hasReachedEnd() || this.stream.isAt(end)) {
        break
      }
    }

    return new PunctuatedSequence(elements, commas)
  }

  private isAtMessageLiteral(): boolean {
    let i = 0
    if (this.stream.lookahead(i)?.kind === TokenKind.Dot) {
      i++
    }

    if (this.stream.lookahead(i)?.kind !== TokenKind.Identifier) {
      return false
    }
    i++

    while (this.stream.lookahead(i)?.kind === TokenKind.Dot) {
      i++
      if (this.stream.lookahead(i)?.kind !== TokenKind.Identifier) {
        return false
      }
      i++
    }

    return this.stream.lookahead(i)?.kind === TokenKind.LeftBrace
  }
}
