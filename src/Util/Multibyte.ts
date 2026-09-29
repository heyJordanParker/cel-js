const unitOffset = (value: string, offset: number): number => Array.from(value).slice(0, offset).join('').length

const codePointOffset = (value: string, unit: number): number => Array.from(value.slice(0, unit)).length

export function length(value: string): number {
  return Array.from(value).length
}

export function indexOf(haystack: string, needle: string, offset: number): number {
  const unit = haystack.indexOf(needle, unitOffset(haystack, offset))
  return unit === -1 ? -1 : codePointOffset(haystack, unit)
}

export function lastIndexOf(haystack: string, needle: string, offset: number): number {
  const unit = haystack.lastIndexOf(needle)
  if (unit === -1) {
    return -1
  }

  const position = codePointOffset(haystack, unit)
  return position >= offset ? position : -1
}
