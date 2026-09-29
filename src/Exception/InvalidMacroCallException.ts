import { EvaluationException } from './EvaluationException.js'

export class InvalidMacroCallException extends EvaluationException {
  override name = 'InvalidMacroCallException'
}
