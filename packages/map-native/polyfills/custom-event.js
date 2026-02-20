/**
 * CustomEvent polyfill for Hermes.
 * Must be imported AFTER event-target-polyfill which provides Event.
 */
if (typeof globalThis.CustomEvent !== 'function') {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, eventInitDict) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail ?? null;
    }
  };
}
