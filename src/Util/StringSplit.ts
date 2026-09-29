function chunk(value: string, bytes: boolean): string[] {
  return bytes ? value.split('') : Array.from(value)
}

export function characters(value: string, limit: number | null, bytes: boolean): string[] {
  const units = chunk(value, bytes)
  if (limit === null || limit >= units.length) {
    return units
  }

  return [...units.slice(0, limit - 1), units.slice(limit - 1).join('')]
}
