

const INITIAL_DICTIONARY: string =
  "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswi"
  + "ss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New Ro"
  + "manCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\"
  + "b\\i\\u\\tab\\tx";
const INITIAL_DICTIONARY_LENGTH: number = INITIAL_DICTIONARY.length; // 207
const HEADER_LENGTH = 16 as const;
const WINDOW_LENGTH = 4096 as const;
const WINDOW_MASK: number = ~(WINDOW_LENGTH - 1);
const COMPRESSED = 0x75465A4C as const;
const UNCOMPRESSED = 0x414C454D as const;

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
export function decompressRTF(inputBuffer: Buffer): Buffer {
  if (inputBuffer.length < HEADER_LENGTH) {
    throw new Error(`Invalid inputBuffer! Buffer should be at least ${HEADER_LENGTH} bytes long, but it is ${inputBuffer.length} bytes!`);
  }
  const fileSize: number = inputBuffer.readInt32LE(0);
  const rawSize: number = inputBuffer.readInt32LE(4);
  const compType: number = inputBuffer.readInt32LE(8);
  if (compType === UNCOMPRESSED) {
    const leftBytes: number = inputBuffer.length - HEADER_LENGTH;
    if (rawSize > leftBytes) {
      throw new Error(`Invalid inputBuffer! Raw size ${rawSize} is larger than the remaining buffer size ${leftBytes}!`);
    }
    return inputBuffer.subarray(HEADER_LENGTH, HEADER_LENGTH + rawSize);
  }
  if (compType !== COMPRESSED) {
    throw new Error(`Invalid inputBuffer! Invalid compression type 0x${compType.toString(16).toUpperCase()}! Expected COMPRESSED (0x${COMPRESSED.toString(16).toUpperCase()}) or UNCOMPRESSED (0x${UNCOMPRESSED.toString(16).toUpperCase()}).`);
  }
  const output = Buffer.alloc(INITIAL_DICTIONARY_LENGTH + rawSize, INITIAL_DICTIONARY, 'ascii');

  let outPos: number = INITIAL_DICTIONARY_LENGTH;
  let inPos: number = HEADER_LENGTH;
  let control: number = 0;
  const inEnd: number = fileSize + 4;
  for (let run: number = 0; inPos < inEnd; run = (run + 1) & 7) {
    if (!run) {
      control = inputBuffer[inPos++];
    }
    if ((1 << run) & control) {
      // dictionary
      const token: number = inputBuffer.readUInt16BE(inPos);
      inPos += 2;

      const offset: number = token >> 4;
      const length: number = (token & 15) + 2;

      let readPos: number = (outPos & WINDOW_MASK) + offset;
      if (readPos === outPos) {
        break;
      }
      if (readPos > outPos) {
        readPos -= WINDOW_LENGTH;
      }
      const readPosEnd: number = readPos + length;
      while (readPos < readPosEnd) {
        output[outPos++] = output[readPos++];
      }
    } else {
      // literal
      output[outPos++] = inputBuffer[inPos++];
    }
  }
  return output.subarray(INITIAL_DICTIONARY_LENGTH, outPos);
}
