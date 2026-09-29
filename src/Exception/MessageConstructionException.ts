import { EvaluationException } from './EvaluationException.js'

export class MessageConstructionException extends EvaluationException {
  override name = 'MessageConstructionException'
}
