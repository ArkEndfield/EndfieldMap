/**
 * Complete Web Crypto API polyfill for React Native / Hermes.
 *
 * react-native-get-random-values (imported before this file) provides
 * crypto.getRandomValues. This file adds the remaining APIs that RxDB
 * and other libraries expect:
 *   - crypto.subtle.digest   (via expo-crypto native SHA)
 *   - crypto.randomUUID      (v4 UUID from getRandomValues)
 */
import { digest, CryptoDigestAlgorithm } from 'expo-crypto';

const algorithmMap = {
  'SHA-1': CryptoDigestAlgorithm.SHA1,
  'SHA-256': CryptoDigestAlgorithm.SHA256,
  'SHA-384': CryptoDigestAlgorithm.SHA384,
  'SHA-512': CryptoDigestAlgorithm.SHA512,
};

if (!globalThis.crypto) globalThis.crypto = {};

if (!globalThis.crypto.subtle) {
  globalThis.crypto.subtle = {
    digest: (algo, data) => {
      const name = typeof algo === 'string' ? algo : algo?.name;
      return digest(algorithmMap[name] || name, data);
    },
  };
}

if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
}
