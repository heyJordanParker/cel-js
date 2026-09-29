import { OutOfRangeException } from '../Exception/OutOfRangeException.js'

export function normalize(offset: number, length: number): number {
  const normalized = offset < 0 ? offset + length : offset
  if (normalized < 0 || normalized > length) {
    throw OutOfRangeException.forOffset(offset)
  }

  return normalized
}
