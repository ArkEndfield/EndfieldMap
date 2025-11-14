export class NotInitializedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotInitializedError';
  }
}
