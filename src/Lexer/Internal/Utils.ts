import { Input } from '../../Input/Input.js'
import { TokenKind } from '../../Token/TokenKind.js'

const KEYWORDS: Readonly<Record<string, TokenKind>> = {
  true: TokenKind.True,
  false: TokenKind.False,
  null: TokenKind.Null,
  in: TokenKind.In,
  as: TokenKind.As,
  break: TokenKind.Break,
  const: TokenKind.Const,
  continue: TokenKind.Continue,
  else: TokenKind.Else,
  for: TokenKind.For,
  function: TokenKind.Function,
  if: TokenKind.If,
  import: TokenKind.Import,
  let: TokenKind.Let,
  loop: TokenKind.Loop,
  package: TokenKind.Package,
  namespace: TokenKind.Namespace,
  return: TokenKind.Return,
  var: TokenKind.Var,
  void: TokenKind.Void,
  while: TokenKind.While,
}

export const isDigit = (char: string): boolean => /^[0-9]$/.test(char)

export const isAlpha = (char: string): boolean => /^[A-Za-z]$/.test(char)

const isAlnum = (char: string): boolean => /^[A-Za-z0-9]$/.test(char)

const isHexDigit = (char: string): boolean => /^[0-9A-Fa-f]$/.test(char)

export function isAtNumberLiteral(input: Input): boolean {
  const char = input.peek(0, 1)
  if (char === '-' || char === '.') {
    return isDigit(input.peek(1, 1))
  }

  return isDigit(char)
}

export function isAtStringLiteral(input: Input): boolean {
  const c1 = input.peek(0, 1).toLowerCase()

  if (c1 === "'" || c1 === '"') {
    return true
  }

  if (c1 === 'r' || c1 === 'b') {
    const c2 = input.peek(1, 1).toLowerCase()
    if (c2 === "'" || c2 === '"') {
      return true
    }

    if ((c1 === 'r' && c2 === 'b') || (c1 === 'b' && c2 === 'r')) {
      const c3 = input.peek(2, 1)
      return c3 === "'" || c3 === '"'
    }
  }

  return false
}

export function isAtIdentifier(input: Input): boolean {
  const char = input.peek(0, 1)
  return isAlpha(char) || char === '_'
}

export function readNumberLiteral(input: Input): [TokenKind, string] {
  let length = 0
  let isFloat = false

  if (input.peek(length, 1) === '-') {
    length++
  }

  if (input.peek(length, 1) === '0' && isAlpha(input.peek(length + 1, 1))) {
    const prefix = input.peek(length + 1, 1).toLowerCase()
    const consumed = readPrefixedInteger(input, prefix, length)
    if (consumed > 0) {
      length = consumed
    } else {
      ;[length, isFloat] = readDecimalOrFloat(input, length)
    }
  } else {
    ;[length, isFloat] = readDecimalOrFloat(input, length)
  }

  let kind = isFloat ? TokenKind.LiteralFloat : TokenKind.LiteralInt

  if (!isFloat && input.peek(length, 1).toLowerCase() === 'u') {
    length++
    kind = TokenKind.LiteralUInt
  }

  return [kind, input.consume(length)]
}

export function readStringLiteral(input: Input): [TokenKind, string] {
  const char = input.peek(0, 1).toLowerCase()
  const prefix = char === 'r' || char === 'b' ? char : null

  const scanOffset = prefix !== null ? 1 : 0
  const quote = input.peek(scanOffset, 1)
  const isTriple = input.peek(scanOffset + 1, 2) === quote + quote
  const terminator = isTriple ? quote.repeat(3) : quote
  const isRaw = prefix === 'r'

  const [finalOffset, terminated] = consumeLiteralString(
    input,
    terminator,
    isRaw,
    scanOffset + terminator.length,
  )

  const value = input.consume(finalOffset)
  if (!terminated) {
    return [TokenKind.Unrecognized, value]
  }

  return [prefix === 'b' ? TokenKind.BytesSequence : TokenKind.LiteralString, value]
}

export function readIdentifier(input: Input): [TokenKind, string] {
  let length = 1
  for (;;) {
    const char = input.peek(length, 1)
    if (char === '' || (!isAlnum(char) && char !== '_')) {
      break
    }

    length++
  }

  const value = input.consume(length)
  return [Object.hasOwn(KEYWORDS, value) ? KEYWORDS[value] : TokenKind.Identifier, value]
}

function consumeLiteralString(
  input: Input,
  terminator: string,
  isRaw: boolean,
  offset: number,
): [number, boolean] {
  let scanOffset = offset
  for (;;) {
    const peeked = input.peek(scanOffset, 1)

    if (peeked === '') {
      return [scanOffset, false]
    }

    if (input.peek(scanOffset, terminator.length) === terminator) {
      return [scanOffset + terminator.length, true]
    }

    if (peeked === '\\' && !isRaw) {
      if (input.peek(scanOffset + 1, 1) === '') {
        return [scanOffset + 1, false]
      }

      scanOffset += 2
      continue
    }

    scanOffset++
  }
}

function readDecimalOrFloat(input: Input, start: number): [number, boolean] {
  let length = start
  let isFloat = false

  while (isDigit(input.peek(length, 1))) {
    length++
  }

  if (input.peek(length, 1) === '.' && isDigit(input.peek(length + 1, 1))) {
    isFloat = true
    length++
    while (isDigit(input.peek(length, 1))) {
      length++
    }
  }

  if (length > start || isFloat) {
    const peekedE = input.peek(length, 1)
    if (peekedE === 'e' || peekedE === 'E') {
      isFloat = true
      length++
      const peekedSign = input.peek(length, 1)
      if (peekedSign === '+' || peekedSign === '-') {
        length++
      }

      while (isDigit(input.peek(length, 1))) {
        length++
      }
    }
  }

  return [length, isFloat]
}

const PREFIX_DIGITS: Readonly<Record<string, (char: string) => boolean>> = {
  x: isHexDigit,
  o: (char) => char >= '0' && char <= '7',
  b: (char) => char === '0' || char === '1',
}

function readPrefixedInteger(input: Input, prefix: string, start: number): number {
  if (!Object.hasOwn(PREFIX_DIGITS, prefix)) {
    return 0
  }

  const accepts = PREFIX_DIGITS[prefix]
  let length = start + 2
  while (accepts(input.peek(length, 1))) {
    length++
  }

  return length
}
