import { EvaluationException } from './EvaluationException.js'

export class UnexpectedMapKeyTypeException extends EvaluationException {
  override name = 'UnexpectedMapKeyTypeException'
}
