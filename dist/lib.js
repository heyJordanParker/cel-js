import { CELLexer } from './tokens.js';
import { CelParser } from './parser.js';
import { CelVisitor } from './visitor.js';
import { CelParseError } from './errors/CelParseError.js';
export { CelParseError } from './errors/CelParseError.js';
export { CelEvaluationError } from './errors/CelEvaluationError.js';
export { CelTypeError } from './errors/CelTypeError.js';
const parserInstance = new CelParser();
export function parse(expression) {
    const lexResult = CELLexer.tokenize(expression);
    parserInstance.input = lexResult.tokens;
    const cst = parserInstance.expr();
    if (parserInstance.errors.length > 0) {
        return {
            isSuccess: false,
            errors: parserInstance.errors.map((e) => e.message),
        };
    }
    return { isSuccess: true, cst };
}
export function evaluate(expression, context, functions) {
    const result = typeof expression === 'string'
        ? parse(expression)
        : { isSuccess: true, cst: expression };
    const toAstVisitorInstance = new CelVisitor(context, functions);
    if (!result.isSuccess) {
        throw new CelParseError('Given string is not a valid CEL expression: ' + result.errors.join(', '));
    }
    return toAstVisitorInstance.visit(result.cst);
}
