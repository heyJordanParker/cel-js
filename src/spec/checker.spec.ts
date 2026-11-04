import { describe, expect, it } from 'vitest'
import { Checker, Parser, Type, TypeKind, type TypeProvider } from '../index.js'
import table from './checker.json'

/**
 * The checker contract.
 *
 * `checker.json` is the one case table every implementation of this checker
 * runs, so an expression is refused the same in every host that checks it.
 */

type Encoded =
  | string
  | { list: Encoded }
  | { map: Encoded }
  | { object: string }
  | { union: Encoded[] }

function type(encoded: Encoded): Type {
  if (typeof encoded === 'string') {
    return encoded === 'dyn' ? Type.dyn() : Type.scalar(encoded)
  }

  if ('list' in encoded) {
    return Type.list(type(encoded.list))
  }

  if ('map' in encoded) {
    return Type.map(type(encoded.map))
  }

  if ('object' in encoded) {
    return Type.object(encoded.object)
  }

  const [first = Type.dyn(), ...rest] = encoded.union.map(type)
  return Type.union([first, ...rest])
}

function encode(checked: Type): Encoded {
  switch (checked.kind) {
    case TypeKind.Dyn:
      return 'dyn'
    case TypeKind.Scalar:
      return checked.name
    case TypeKind.List:
      return { list: encode(checked.element ?? Type.dyn()) }
    case TypeKind.Map:
      return { map: encode(checked.element ?? Type.dyn()) }
    case TypeKind.Object:
      return { object: checked.name }
    case TypeKind.Union:
      return { union: checked.members.map(encode) }
  }
}

const objects = table.objects as Record<string, Record<string, Encoded>>

const provider: TypeProvider = {
  fieldType: (object, field) => {
    const declared = objects[object]?.[field]
    return declared === undefined ? null : type(declared)
  },
}

const variables = Object.fromEntries(
  Object.entries(table.variables as Record<string, Encoded>).map(
    ([name, declared]) => [name, type(declared)],
  ),
)

describe('checking an expression against its declarations', () => {
  it.each(table.cases)(
    '$expression',
    ({ expression, issues, type: produced }) => {
      const check = new Checker(provider).check(
        new Parser().parse(expression),
        variables,
      )

      expect(
        check.issues.map((issue) => [issue.kind, issue.path, issue.name]),
      ).toStrictEqual(issues)
      expect(encode(check.type)).toStrictEqual(produced)
    },
  )
})
