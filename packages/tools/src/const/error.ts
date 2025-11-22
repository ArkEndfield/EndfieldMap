export class JSONLoaderError extends Error {
  constructor(message: string, url: string) {
    super(`[JSONLoader] ${message} ${url}`);
    this.name = 'JSONLoaderError';
  }
}
