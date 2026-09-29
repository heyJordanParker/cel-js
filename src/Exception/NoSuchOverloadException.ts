import type { CallExpression } from '../Syntax/Member/CallExpression.js'
import type { ValueKind } from '../Value/ValueKind.js'
import { EvaluationException } from './EvaluationException.js'

const formatKinds = (kinds: ValueKind[]): string => `(${kinds.join(', ')})`

function formatSignatures(signatures: ValueKind[][]): string {
  const formatted = signatures.map(formatKinds)
  if (formatted.length === 1) {
    return '`' + formatted[0] + '`'
  }

  const last = formatted.pop()
  return `\`${formatted.join('`, `')}\`, or \`${last}\``
}

export class NoSuchOverloadException extends EvaluationException {
  override name = 'NoSuchOverloadException'

  static forCall(
    expression: CallExpression,
    availableSignatures: ValueKind[][],
    providedArgumentKinds: ValueKind[],
  ): NoSuchOverloadException {
    return new NoSuchOverloadException(
      `Invalid arguments for function "${expression.function.name}". Got \`${formatKinds(providedArgumentKinds)}\`, but expected one of: ${formatSignatures(availableSignatures)}`,
      expression.getSpan(),
    )
  }
}
