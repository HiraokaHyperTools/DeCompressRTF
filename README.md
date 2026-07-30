# DeCompressRTF

[![npm](https://img.shields.io/npm/v/@kenjiuno/decompressrtf)](https://www.npmjs.com/package/@kenjiuno/decompressrtf)

CompressedRTF is a compressed entity found in Outlook Item File (.msg).

DeCompressRTF is a decompressor in JavaScript npm module

## How to use

```typescript
import { readFile } from 'node:fs/promises';
import { decompressRTF } from '@kenjiuno/decompressrtf';

const inputBuffer: Buffer = await readFile('./test-data/sample1.bin');
const outputBuffer: Buffer = decompressRTF(inputBuffer);

console.log(outputBuffer.toString('ascii'));
```

## Reference

- The Compressed RTF Format
  https://www.freeutils.net/source/jtnef/rtfcompressed

- 2.1.3.1 RTF Compression Format
  https://msdn.microsoft.com/en-us/library/ee159164(v=exchg.80).aspx

- 1009-PidTagRtfCompressed
  https://github.com/HiraokaHyperTools/OXPROPS/blob/master/JSON/1009-PidTagRtfCompressed.md
