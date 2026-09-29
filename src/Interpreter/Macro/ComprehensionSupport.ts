import { InvalidMacroCallException } from '../../Exception/InvalidMacroCallException.js'
import type { Expression } from '../../Syntax/Expression.js'
import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../../Syntax/Member/IdentifierExpression.js'
import { keyToValue } from '../../Util/MapKeyUtil.js'
import { IntegerValue } from '../../Value/IntegerValue.js'
import { ListValue } from '../../Value/ListValue.js'
import { MapValue } from '../../Value/MapValue.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'

export type Bindings = Map<string, Value>

export function iterationVariable(macro: string, argument: Expression): string {
  if (!(argument instanceof IdentifierExpression)) {
    throw new InvalidMacroCallException(
      `The \`${macro}\` macro requires its iteration variables to be identifiers.`,
      argument.getSpan(),
    )
  }

  return argument.identifier.name
}

export function comprehensionBindings(
  macro: string,
  call: CallExpression,
  context: MacroContextInterface,
  variableCount: number,
): Bindings[] {
  const target = call.target!
  const first = iterationVariable(macro, call.arguments.elements[0])
  const second = variableCount === 2 ? iterationVariable(macro, call.arguments.elements[1]) : null

  const value = context.evaluate(target)
  if (!(value instanceof ListValue) && !(value instanceof MapValue)) {
    throw new InvalidMacroCallException(
      `The \`${macro}\` macro requires a list or map target, got \`${value.getType()}\``,
      target.getSpan(),
    )
  }

  const bind = (key: Value, element: Value): Bindings =>
    second === null
      ? new Map([[first, value instanceof ListValue ? element : key]])
      : new Map([
          [first, key],
          [second, element],
        ])

  if (value instanceof ListValue) {
    return value.value.map((element, index) => bind(new IntegerValue(index), element))
  }

  return Array.from(value.value, ([key, element]) => bind(keyToValue(key), element))
}

export function bindAll(context: MacroContextInterface, variables: Bindings): void {
  const environment = context.getEnvironment()
  for (const [name, value] of variables) {
    environment.addVariable(name, value)
  }
}

export function iterationItems(target: ListValue | MapValue): Value[] {
  return target instanceof ListValue ? target.value : Array.from(target.value.keys(), keyToValue)
}
