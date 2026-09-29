import { EvaluationException } from './EvaluationException.js'

export class InvalidConditionTypeException extends EvaluationException {
  override name = 'InvalidConditionTypeException'
}
