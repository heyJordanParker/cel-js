export class CelParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CelParseError';
    }
}
