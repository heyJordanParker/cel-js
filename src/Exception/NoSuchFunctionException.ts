import { EvaluationException } from './EvaluationException.js'

export class NoSuchFunctionException extends EvaluationException {
  override name = 'NoSuchFunctionException'
}
