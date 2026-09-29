import { EvaluationException } from './EvaluationException.js'

export class NoSuchVariableException extends EvaluationException {
  override name = 'NoSuchVariableException'
}
