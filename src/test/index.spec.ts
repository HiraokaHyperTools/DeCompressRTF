import assert from 'assert';

import fs from 'fs';
import path from 'path';
import { decompressRTF } from '..';

const createExpected = false;

function use(inputFile: string, outputFile: string): void {
    const inputPath = path.join(__dirname, '/' + inputFile);
    const outputPath = path.join(__dirname, '/' + outputFile);
    const inputArray = fs.readFileSync(inputPath);
    const outputArray = decompressRTF(Array.prototype.slice.call(inputArray, 0));
    if (createExpected) {
        fs.writeFileSync(
            outputPath,
            Buffer.from(outputArray)
        );
    }
    else {
        const expected = fs.readFileSync(outputPath);
        assert.strictEqual(
            Buffer.from(outputArray).toString("utf8"),
            Buffer.from(expected).toString("utf8")
        );
    }
}

describe('decompressRTF', () => {
    it("sample1.bin", () => {
        use("sample1.bin", "sample1.txt");
    });
});
