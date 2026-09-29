import { NumberFormatException } from '../Exception/NumberFormatException.js'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function digitValue(digit: string): number | null {
  const ordinal = digit.charCodeAt(0)
  if (ordinal >= 48 && ordinal <= 57) return ordinal - 48
  if (ordinal >= 97 && ordinal <= 122) return ordinal - 87
  if (ordinal >= 65 && ordinal <= 90) return ordinal - 55
  return null
}

export function fromBase(number: string, base: number): number {
  const limit = Math.floor(Number.MAX_SAFE_INTEGER / base)
  let result = 0
  for (const digit of number) {
    const value = digitValue(digit)
    if (value === null || base <= value) {
      throw NumberFormatException.forInvalidDigit(digit, base)
    }

    if (result > limit) {
      throw NumberFormatException.forOverflow(number, base)
    }

    result = base * result + value
    if (!Number.isSafeInteger(result)) {
      throw NumberFormatException.forOverflow(number, base)
    }
  }

  return result
}

export function toBase(number: number, base: number): string {
  let result = ''
  let remaining = number
  do {
    const quotient = Math.trunc(remaining / base)
    result = ALPHABET[remaining - quotient * base] + result
    remaining = quotient
  } while (remaining !== 0)

  return result
}

export function baseConvert(value: string, from: number, to: number): string {
  const fromAlphabet = ALPHABET.slice(0, from).toLowerCase()
  let decimal = 0n
  for (const digit of value) {
    const index = fromAlphabet.indexOf(digit.toLowerCase())
    if (index === -1) {
      throw NumberFormatException.forInvalidDigit(digit, from)
    }

    decimal = decimal * BigInt(from) + BigInt(index)
  }

  const toAlphabet = ALPHABET.slice(0, to)
  let result = ''
  do {
    result = toAlphabet[Number(decimal % BigInt(to))] + result
    decimal = decimal / BigInt(to)
  } while (decimal !== 0n)

  return result
}
