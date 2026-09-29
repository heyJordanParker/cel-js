const checked = (result: number): number | null => (Number.isSafeInteger(result) ? result + 0 : null)

export const add = (left: number, right: number): number | null => checked(left + right)

export const subtract = (left: number, right: number): number | null => checked(left - right)

export const multiply = (left: number, right: number): number | null => checked(left * right)

export const negate = (value: number): number | null => checked(-value)
