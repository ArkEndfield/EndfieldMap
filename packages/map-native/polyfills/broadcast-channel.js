/**
 * Minimal BroadcastChannel polyfill for React Native.
 * RxDB's leader-election plugin requires BroadcastChannel, but native environments
 * don't support any of the methods (native, idb, localstorage).
 * This provides a no-op single-tab implementation that prevents the error.
 */
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class BroadcastChannelPolyfill {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      this.onmessageerror = null;
      this._closed = false;
    }

    postMessage(_message) {
      // single-process: no cross-tab messaging needed
    }

    close() {
      this._closed = true;
    }

    addEventListener(_type, _listener) {
      // no-op
    }

    removeEventListener(_type, _listener) {
      // no-op
    }

    dispatchEvent(_event) {
      return true;
    }
  }

  globalThis.BroadcastChannel = BroadcastChannelPolyfill;
}
