# DeCompressRTF

CompressedRTF in Outlook Item File (.msg) decoder in JavaScript npm module

## How to use

```javascript
const fs = require('fs');
const { decompressRTF } = require('@kenjiuno/decompressrtf');

const inputArray = fs.readFileSync('test/__substg1.0_10090102');
const outputArray = decompressRTF(inputArray);

console.log(Buffer.from(outputArray).toString("ascii"));
```
