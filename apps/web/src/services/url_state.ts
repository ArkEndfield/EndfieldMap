export interface URLParamHandler<T = unknown> {
  key: string;
  parse: (value: string) => T;
  serialize: (value: T) => string;
}

export class URLStateManager {
  private handlers = new Map<string, URLParamHandler>();

  register(handler: URLParamHandler): void {
    this.handlers.set(handler.key, handler);
  }

  getParam<T>(key: string): T | null {
    const handler = this.handlers.get(key);
    if (!handler) return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return null;
    return handler.parse(raw) as T;
  }

  setParam(key: string, value: unknown): void {
    this.setParams({ [key]: value });
  }

  setParams(updates: Record<string, unknown>): void {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      const handler = this.handlers.get(key);
      if (!handler) continue;
      if (value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, handler.serialize(value));
      }
    }
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : '');
    history.replaceState(null, '', url);
  }

  removeParam(key: string): void {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : '');
    history.replaceState(null, '', url);
  }

  readInitialParams(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const params = new URLSearchParams(window.location.search);
    for (const [key, handler] of this.handlers) {
      const raw = params.get(key);
      if (raw !== null) {
        result[key] = handler.parse(raw);
      }
    }
    return result;
  }
}

export const urlStateManager = new URLStateManager();
