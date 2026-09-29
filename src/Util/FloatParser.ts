const FLOAT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

export function tryParse(value: string): number | null {
  return FLOAT.test(value) ? parseFloat(value) : null
}
