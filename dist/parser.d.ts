import { CstParser } from 'chevrotain';
export declare class CelParser extends CstParser {
    constructor();
    expr: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private coalesce;
    private conditionalAnd;
    private conditionalOr;
    private relation;
    private addition;
    private multiplication;
    private unaryExpression;
    private parenthesisExpression;
    private listExpression;
    private mapExpression;
    private mapKeyValues;
    private macrosExpression;
    private identifierExpression;
    private identifierDotExpression;
    private indexExpression;
    private atomicExpression;
}
