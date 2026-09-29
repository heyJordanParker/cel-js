import { EvaluationException } from './EvaluationException.js'

export class InvalidOptionalConstructionException extends EvaluationException {
  override name = 'InvalidOptionalConstructionException'
}
