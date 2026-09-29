import type { CallExpression } from '../../Syntax/Member/CallExpression.js'
import type { Value } from '../../Value/Value.js'
import type { MacroContextInterface } from './MacroContextInterface.js'
import type { MacroInterface } from './MacroInterface.js'

export class MacroRegistry {
  private readonly macros = new Map<string, MacroInterface>()

  register(macro: MacroInterface): void {
    this.macros.set(macro.getName(), macro)
  }

  tryExecute(call: CallExpression, context: MacroContextInterface): Value | null {
    const macro = this.macros.get(call.function.name)
    if (macro === undefined || !macro.canHandle(call)) {
      return null
    }

    return macro.execute(call, context)
  }

  has(name: string): boolean {
    return this.macros.has(name)
  }
}
