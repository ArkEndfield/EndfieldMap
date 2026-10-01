import { describe, expect, it } from 'vitest';

import { md5 } from './hash';

describe('md5', () => {
  it('matches RFC 1321 test vectors', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
    expect(md5('abcdefghijklmnopqrstuvwxyz')).toBe('c3fcd3d76192e4007dfb496cca67e13b');
    expect(md5('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe(
      '57edf4a22be3c955ac49da2e2107b67a'
    );
  });

  it('pads correctly across the 56-byte block boundary', () => {
    expect(md5('a'.repeat(55))).toBe('ef1772b6dff9a122358552954ad0df65');
    expect(md5('a'.repeat(56))).toBe('3b0c8ac703f828b04c6c197006d17218');
    expect(md5('a'.repeat(57))).toBe('652b906d60af96844ebd21b674f35e93');
    expect(md5('a'.repeat(64))).toBe('014842d480b571495a4a0363793f7367');
  });

  it('hashes the decimal levelLogicId form used by Senkong Island ids', () => {
    // 森空岛地图接口 id = md5(游戏 markInstId)；站点 levelLogicId 即 markInstId。
    expect(md5('26800001153')).toBe('0c4b425bce01e330e7d24b162eb6f5e1');
    expect(md5('2100010185')).toBe('d7c32157fd1618c378c93c26d2ec585e');
    expect(md5('mark_sp_campfire')).toBe('e4401c255103bfe0bf976cc5511f5612');
  });

  it('encodes non-ASCII input as UTF-8', () => {
    expect(md5('中文')).toBe('a7bac2239fcdcb3a067903d8077c4a07');
  });
});
