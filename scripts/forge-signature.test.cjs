const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');

const nativeRequire = createRequire(path.resolve(__dirname, '../apps/native/package.json'));
const expoRequire = createRequire(nativeRequire.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
const forge = cliRequire('node-forge');

test('RSA verification rejects unconsumed DigestAlgorithm elements', () => {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 1024 });
  const digest = forge.md.sha256.create().update('signature regression');
  assert.equal(keys.publicKey.verify(digest.digest().bytes(), keys.privateKey.sign(digest)), true);

  const { asn1 } = forge;
  const node = (type, constructed, value) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const malformed = node(asn1.Type.SEQUENCE, true, [
    node(asn1.Type.SEQUENCE, true, [
      node(asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.sha256).getBytes()),
      node(asn1.Type.NULL, false, ''),
      node(asn1.Type.OCTETSTRING, false, 'unconsumed'),
    ]),
    node(asn1.Type.OCTETSTRING, false, digest.digest().bytes()),
  ]);
  const signature = forge.pki.rsa.encrypt(asn1.toDer(malformed).getBytes(), keys.privateKey, 0x01);
  assert.throws(() => keys.publicKey.verify(digest.digest().bytes(), signature), /DigestInfo/);
});
