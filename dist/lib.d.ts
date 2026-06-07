import { CstNode } from 'chevrotain';
export { CelParseError } from './errors/CelParseError.js';
export { CelEvaluationError } from './errors/CelEvaluationError.js';
export { CelTypeError } from './errors/CelTypeError.js';
export type Success = {
    isSuccess: true;
    cst: CstNode;
};
export type Failure = {
    isSuccess: false;
    errors: string[];
};
export type ParseResult = Success | Failure;
export declare function parse(expression: string): ParseResult;
export declare function evaluate(expression: string | CstNode, context?: Record<string, unknown>, functions?: Record<string, CallableFunction>): unknown;
