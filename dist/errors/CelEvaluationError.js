export class CelEvaluationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CelEvaluationError';
    }
}
