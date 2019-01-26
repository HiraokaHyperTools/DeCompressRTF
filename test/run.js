const fs = require('fs');
const path = require('path');
const { decompressRTF } = require('../lib/index');

const inputArray = fs.readFileSync(path.join(__dirname, '/__substg1.0_10090102'));
const outputArray = decompressRTF(inputArray);

console.log(Buffer.from(outputArray).toString("ascii"));
