export class JSONLoaderError extends Error {
  constructor(message: string, url: string) {
    super(`[JSONLoader] ${message} ${url}`);
    this.name = 'JSONLoaderError';
  }
}

export class ElectricPoleError extends Error {
  public i18nKey: string;
  public entityId: number;

  constructor(message: string, entityId: number) {
    super(`[ElectricPole] Entity ID: ${entityId}, ${message}`);
    this.name = 'ElectricPoleError';
    this.i18nKey = message;
    this.entityId = entityId;
  }
}