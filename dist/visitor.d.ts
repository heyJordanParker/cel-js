import { AdditionCstChildren, AtomicExpressionCstChildren, ConditionalAndCstChildren, ConditionalOrCstChildren, ExprCstChildren, MacrosExpressionCstChildren, ICstNodeVisitor, IdentifierDotExpressionCstChildren, IdentifierExpressionCstChildren, IndexExpressionCstChildren, ListExpressionCstChildren, MultiplicationCstChildren, ParenthesisExpressionCstChildren, RelationCstChildren, UnaryExpressionCstChildren, MapKeyValuesCstChildren, MapExpressionCstChildren } from './cst-definitions.js';
declare const BaseCelVisitor: new (...args: any[]) => import("chevrotain").ICstVisitor<any, any>;
export declare class CelVisitor extends BaseCelVisitor implements ICstNodeVisitor<void, unknown> {
    constructor(context?: Record<string, unknown>, functions?: Record<string, CallableFunction>);
    private context;
    /**
     * Tracks the current mode of the visitor to handle special cases.
     */
    private mode;
    private functions;
    /**
     * Checks if the given identifier is a collection macro.
     */
    private isCollectionMacro;
    /**
     * Checks if the given value is a map (object).
     */
    private isMap;
    /**
     * Handles collection macro calls like collection.filter(item, predicate).
     */
    private handleCollectionMacroCall;
    /**
     * Extracts the variable name from a variable expression, ensuring it's a simple identifier.
     * Reuses the existing visitor infrastructure with a special mode.
     */
    private extractVariableName;
    /**
     * Evaluates an expression with a bound variable in the context.
     */
    private evaluateWithBinding;
    /**
     * Handles the filter collection macro.
     */
    private handleFilter;
    /**
     * Handles the map collection macro (with transform or filter+transform).
     */
    private handleMap;
    /**
     * Handles the all collection macro.
     */
    private handleAll;
    /**
     * Handles the exists collection macro.
     */
    private handleExists;
    /**
     * Handles the exists_one collection macro.
     */
    private handleExistsOne;
    /**
     * Evaluates the expression including conditional ternary expressions in the form: condition ? trueExpr : falseExpr
     *
     * @param ctx - The expression context containing the condition and optional ternary branches
     * @returns The result of evaluating the expression
     */
    expr(ctx: ExprCstChildren): unknown;
    /**
     * Handles the special 'has' macro which checks for the existence of a field.
     *
     * @param ctx - The macro expression context containing the argument to check
     * @returns boolean indicating if the field exists
     * @throws CelEvaluationError if argument is missing or invalid
     */
    private handleHasMacro;
    /**
     * Handles execution of generic macro functions by evaluating and passing their arguments.
     *
     * @param fn - The macro function to execute
     * @param ctx - The macro expression context containing the arguments
     * @returns The result of executing the macro function with the evaluated arguments
     */
    private handleGenericMacro;
    conditionalOr(ctx: ConditionalOrCstChildren): boolean;
    /**
     * Evaluates a logical AND expression by visiting left and right hand operands.
     *
     * @param ctx - The conditional AND context containing left and right operands
     * @returns The boolean result of evaluating the AND expression
     *
     * This method implements short-circuit evaluation - if the left operand is false,
     * it returns false immediately without evaluating the right operand. This is required
     * for proper handling of the has() macro.
     *
     * For multiple right-hand operands, it evaluates them sequentially, combining results
     * with logical AND operations.
     */
    conditionalAnd(ctx: ConditionalAndCstChildren): boolean;
    relation(ctx: RelationCstChildren): boolean;
    addition(ctx: AdditionCstChildren): unknown;
    multiplication(ctx: MultiplicationCstChildren): any;
    unaryExpression(ctx: UnaryExpressionCstChildren): unknown;
    parenthesisExpression(ctx: ParenthesisExpressionCstChildren): any;
    listExpression(ctx: ListExpressionCstChildren): any;
    mapExpression(ctx: MapExpressionCstChildren): unknown;
    private getIndexSection;
    mapKeyValues(children: MapKeyValuesCstChildren): [string, unknown];
    /**
     * Evaluates a macros expression by executing the corresponding macro function.
     *
     * @param ctx - The macro expression context containing the macro identifier and arguments
     * @returns The result of executing the macro function
     * @throws Error if the macro function is not recognized
     *
     * This method handles two types of macros:
     * 1. The special 'has' macro which checks for field existence
     * 2. Generic macros that take evaluated arguments
     */
    macrosExpression(ctx: MacrosExpressionCstChildren): unknown;
    /**
     * Evaluates an atomic expression node in the AST.
     *
     * @param ctx - The atomic expression context containing the expression type and value
     * @returns The evaluated value of the atomic expression
     * @throws CelEvaluationError if invalid atomic expression is used in has() macro
     * @throws Error if reserved identifier is used or expression type not recognized
     *
     * Handles the following atomic expression types:
     * - Null literals
     * - Parenthesized expressions
     * - String literals
     * - Boolean literals
     * - Float literals
     * - Integer literals
     * - Identifier expressions
     * - List expressions
     * - Map expressions
     * - Macro expressions
     */
    atomicExpression(ctx: AtomicExpressionCstChildren): any;
    identifierExpression(ctx: IdentifierExpressionCstChildren): unknown;
    identifierDotExpression(ctx: IdentifierDotExpressionCstChildren, param: unknown): unknown;
    indexExpression(ctx: IndexExpressionCstChildren): unknown;
    getIdentifier(searchContext: unknown, identifier: string): unknown;
}
export {};
