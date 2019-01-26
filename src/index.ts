
class Stream {
    buf: number[];

    constructor(buf: number[]) {
        this.buf = buf;
    }

    readInt32LE(offset: number): number {
        const value = (this.buf[offset] & 255)
            | ((this.buf[offset + 1] & 255) << 8)
            | ((this.buf[offset + 2] & 255) << 16)
            | ((this.buf[offset + 3] & 255) << 24);
        return value;
    }

    readUInt16BE(offset: number): number {
        const value = ((this.buf[offset] & 255) << 8)
            | (this.buf[offset + 1] & 255);
        return value;
    }

    readUInt8(offset: number): number {
        const value = this.buf[offset] & 255;
        return value;
    }

    writeUInt8(value: number, offset: number): void {
        this.buf[offset] = value & 255;
    }
}

/**
 * Decompress PR_RTF_COMPRESSED (PidTagRtfCompressed) data
 * 
 * Check these:
 * 
 * - The Compressed RTF Format
 *   https://www.freeutils.net/source/jtnef/rtfcompressed
 * 
 * - 2.1.3.1 RTF Compression Format
 *   https://msdn.microsoft.com/en-us/library/ee159164(v=exchg.80).aspx
 * 
 */
export function decompressRTF(inputArray: number[]): number[] {
    if (inputArray.length < 16) {
        throw new Error("At least 16 bytes");
    }
    const input = new Stream(inputArray);
    const fileSize = input.readInt32LE(0);
    const rawSize = input.readInt32LE(4);
    const compType = input.readInt32LE(8);
    const crc = input.readInt32LE(12);
    const COMPRESSED = 0x75465A4C;
    const UNCOMPRESSED = 0x414C454D;
    if (compType == COMPRESSED) {
        const initialDictionary =
            "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswi"
            + "ss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New Ro"
            + "manCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\"
            + "b\\i\\u\\tab\\tx";

        //if (initialDictionary.length != 207) throw new Error("Fix initialDictionary!");

        const outputArray = []; // automatically expanded
        const output = new Stream(outputArray);

        let outPos = 0;
        let inPos = 16;
        let control;

        for (let x = 0; x < initialDictionary.length; x += 1) {
            output.writeUInt8(initialDictionary.charCodeAt(x), outPos);
            outPos += 1;
        }

        const inEnd = fileSize + 4;
        for (let run = 0; inPos < inEnd; run = (run + 1) & 7) {
            if (0 == run) {
                control = input.readUInt8(inPos);
                inPos += 1;
            }
            if (0 != ((1 << run) & control)) {
                // dictionary
                const token = input.readUInt16BE(inPos);
                inPos += 2;

                const offset = token >> 4;
                const length = (token & 15) + 2;

                let readPos = (outPos & (~4095)) + offset;
                if (readPos == outPos) {
                    break;
                }
                if (readPos > outPos) {
                    readPos -= 4096;
                }

                for (let x = 0; x < length; x += 1) {
                    const octet = output.readUInt8(readPos);
                    output.writeUInt8(octet, outPos);
                    readPos += 1;
                    outPos += 1;
                }
            }
            else {
                // literal
                const octet = input.readUInt8(inPos);
                output.writeUInt8(octet, outPos);
                inPos += 1;
                outPos += 1;
            }
        }
        return outputArray.slice(initialDictionary.length);
    }
    else if (compType == UNCOMPRESSED) {
        return inputArray.slice(16, 16 + rawSize);
    }
    else {
        throw new Error("Either COMPRESSED or UNCOMPRESSED");
    }
}
