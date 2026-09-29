import { Parser } from './Parser/Parser.js'
import { Configuration } from './Runtime/Configuration.js'
import { Runtime } from './Runtime/Runtime.js'
import type { Value } from './Value/Value.js'

export function evaluate(
  expression: string,
  variables: Record<string, unknown> = {},
  configuration: Configuration = new Configuration(),
): Value {
  return new Runtime(configuration).run(new Parser().parse(expression), variables)
}
