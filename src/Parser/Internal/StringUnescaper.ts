import { InternalException } from '../../Exception/InternalException.js'

const SIMPLE: Readonly<Record<string, string>> = {
  '\\': '\\',
  '?': '?',
  '"': '"',
  "'": "'",
  '`': '`',
  a: '\x07',
  b: '\x08',
  f: '\x0C',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\x0B',
}

const HEX = /^[0-9A-Fa-f]+$/

const encoder = new TextEncoder()

type Escape = { codePoint: number; octet: boolean; length: number }

function readEscape(value: string, position: number, context: string): Escape {
  if (position + 1 >= value.length) {
    throw InternalException.forMessage(`Incomplete escape sequence at end of ${context}`)
  }

  const next = value[position + 1]

  if (Object.hasOwn(SIMPLE, next)) {
    return { codePoint: SIMPLE[next].charCodeAt(0), octet: false, length: 2 }
  }

  if (next === 'u' || next === 'U') {
    const digits = next === 'u' ? 4 : 8
    const hex = value.slice(position + 2, position + 2 + digits)
    if (hex.length < digits) {
      throw InternalException.forMessage(
        `Invalid Unicode escape: expected ${digits} hex digits after \\${next}`,
      )
    }

    if (!HEX.test(hex)) {
      throw InternalException.forMessage(
        `Invalid Unicode escape: expected valid hex digits after \\${next}`,
      )
    }

    const codePoint = parseInt(hex, 16)
    const label = codePoint.toString(16).toUpperCase()
    if (codePoint > 0x10ffff) {
      throw InternalException.forMessage(
        `Invalid Unicode code point: U+${label} is out of range`,
      )
    }

    if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      throw InternalException.forMessage(`Invalid Unicode code point: U+${label} is a surrogate`)
    }

    return { codePoint, octet: false, length: 2 + digits }
  }

  if (next === 'x' || next === 'X') {
    const hex = value.slice(position + 2, position + 4)
    if (hex.length !== 2) {
      throw InternalException.forMessage('Invalid hex escape: expected 2 hex digits after \\x')
    }

    if (!HEX.test(hex)) {
      throw InternalException.forMessage(
        'Invalid hex escape: expected valid hex digits after \\x',
      )
    }

    return { codePoint: parseInt(hex, 16), octet: true, length: 4 }
  }

  if (next >= '0' && next <= '7') {
    const octal = /^[0-7]{1,3}/.exec(value.slice(position + 1))![0]
    const codePoint = parseInt(octal, 8)
    if (codePoint > 255) {
      throw InternalException.forMessage(`Invalid octal escape: \\${octal} exceeds 377`)
    }

    return { codePoint, octet: true, length: 1 + octal.length }
  }

  const suffix = context === 'string' ? '' : ' in bytes literal'
  throw InternalException.forMessage(`Invalid escape sequence \\${next}${suffix}`)
}

export function unescapeString(value: string): string {
  let result = ''
  let position = 0

  while (position < value.length) {
    const char = value[position]
    if (char !== '\\') {
      result += char
      position++
      continue
    }

    const escape = readEscape(value, position, 'string')
    result += String.fromCodePoint(escape.codePoint)
    position += escape.length
  }

  return result
}

export function unescapeBytes(value: string): Uint8Array {
  const octets: number[] = []
  let position = 0
  let run = ''

  while (position < value.length) {
    const char = value[position]
    if (char !== '\\') {
      run += char
      position++
      continue
    }

    const escape = readEscape(value, position, 'bytes literal')
    if (escape.octet) {
      octets.push(...encoder.encode(run), escape.codePoint)
    } else {
      octets.push(...encoder.encode(run + String.fromCodePoint(escape.codePoint)))
    }

    run = ''
    position += escape.length
  }

  octets.push(...encoder.encode(run))
  return Uint8Array.from(octets)
}
