import assert from 'node:assert';
import { suite, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decompressRTF } from './index.mts';


suite('decompressRTF', () => {
  test('short buffer', () => {
    assert.throws(() => decompressRTF(Buffer.alloc(0)), {
      message: `Invalid inputBuffer! Buffer should be at least 16 bytes long, but it is 0 bytes!`,
    });
  });

  test('uncompressed ok', () => {
    const expectedString: string = 'test';
    const headerBuffer: Buffer = Buffer.alloc(16);
    const textBuffer: Buffer = Buffer.from(expectedString, 'ascii');
    headerBuffer.writeInt32LE(69, 0); // fileSize
    headerBuffer.writeInt32LE(4, 4); // rawSize
    headerBuffer.writeInt32LE(0x414C454D, 8); // UNCOMPRESSED
    const inputBuffer: Buffer = Buffer.concat([headerBuffer, textBuffer]);

    const outputBuffer: Buffer = decompressRTF(inputBuffer);

    assert.strictEqual(
      outputBuffer.toString('utf8'),
      expectedString,
    );
  });

  test('rawSize too large', () => {
    const expectedString: string = 'test';
    const headerBuffer: Buffer = Buffer.alloc(16);
    const textBuffer: Buffer = Buffer.from(expectedString, 'ascii');
    headerBuffer.writeInt32LE(69, 0); // fileSize
    headerBuffer.writeInt32LE(999, 4); // rawSize
    headerBuffer.writeInt32LE(0x414C454D, 8); // UNCOMPRESSED
    const inputBuffer: Buffer = Buffer.concat([headerBuffer, textBuffer]);

    assert.throws(() => decompressRTF(inputBuffer), {
      message: `Invalid inputBuffer! Raw size 999 is larger than the remaining buffer size 4!`,
    });
  });

  test('invalid compression type', () => {
    const expectedString: string = 'test';
    const headerBuffer: Buffer = Buffer.alloc(16);
    const textBuffer: Buffer = Buffer.from(expectedString, 'ascii');
    headerBuffer.writeInt32LE(69, 0); // fileSize
    headerBuffer.writeInt32LE(4, 4); // rawSize
    headerBuffer.writeInt32LE(0x12345678, 8); // invalid compression type
    const inputBuffer: Buffer = Buffer.concat([headerBuffer, textBuffer]);

    assert.throws(() => decompressRTF(inputBuffer), {
      message: `Invalid inputBuffer! Invalid compression type 0x12345678! Expected COMPRESSED (0x75465A4C) or UNCOMPRESSED (0x414C454D).`,
    });
  });

  test('sample1.bin', async () => {
    const inputPath: string = join(import.meta.dirname, '..', 'test-data', 'sample1.bin');
    const outputPath: string = join(import.meta.dirname, '..', 'test-data', 'sample1.txt');
    const inputBuffer: Buffer = await readFile(inputPath);
    const outputBuffer: Buffer = decompressRTF(inputBuffer);
    const expectedBuffer: Buffer = await readFile(outputPath);

    assert.strictEqual(
      outputBuffer.toString('utf8'),
      expectedBuffer.toString('utf8'),
    );
  });
});
