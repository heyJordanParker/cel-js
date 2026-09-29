import { EvaluationException } from './EvaluationException.js'

export class OverflowException extends EvaluationException {
  override name = 'OverflowException'
}
