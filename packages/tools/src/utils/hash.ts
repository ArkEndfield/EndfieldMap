/**
 * 纯 TS MD5（RFC 1321）。
 *
 * 用途仅为 ID 对齐：森空岛地图接口以 md5(游戏 markInstId) 下发标点 id，
 * 而本站实体数据的 levelLogicId 就是 markInstId，故需要在前端复算同一哈希。
 * 这不是安全用途（WebCrypto 也不提供 MD5），不要用于密码学场景。
 *
 * 输入按 UTF-8 编码；本站输入均为 ASCII 十进制数字串。
 */

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4,
  11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function utf8Bytes(input: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input);
  }
  // 无 TextEncoder 的运行时（部分 RN 环境）按 code unit 展开
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(bytes);
}

function rotl(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

const HEX = '0123456789abcdef';

/** 计算字符串的 MD5 十六进制小写摘要。 */
export function md5(input: string): string {
  const source = utf8Bytes(input);
  const bitLength = source.length * 8;
  // 填充：0x80 + 若干 0，使长度 ≡ 56 (mod 64)，末尾 8 字节存原始比特长度（小端）
  const paddedLength = (((source.length + 8) >> 6) + 1) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(source);
  buffer[source.length] = 0x80;
  const view = new DataView(buffer.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 4294967296), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const m = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      m[i] = view.getUint32(offset + i * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const tmp = d;
      d = c;
      c = b;
      const sum = (a + f + K[i] + m[g]) >>> 0;
      b = (b + rotl(sum, S[i])) >>> 0;
      a = tmp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  let out = '';
  for (const word of [a0, b0, c0, d0]) {
    for (let i = 0; i < 4; i++) {
      const byte = (word >>> (i * 8)) & 0xff;
      out += HEX[byte >> 4] + HEX[byte & 0xf];
    }
  }
  return out;
}
