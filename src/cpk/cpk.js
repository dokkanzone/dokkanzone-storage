import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, parse } from "path";
import parseUtf from "./utf.js";

export function parseTag(buffer, tag) {
  if (tag !== buffer.slice(0, 4).toString()) return null;

  const size = buffer.readUInt32LE(0x8);

  if (!size) return null;

  const offset = 0x10;

  return parseUtf(buffer.slice(offset, offset + size));
}

export function parseCpk(cpkPath) {
  const buffer = readFileSync(cpkPath);
  let utfs = parseTag(buffer, "CPK ");

  if (!utfs || utfs.length !== 1) return null;

  const cpk = { buffer };
  cpk.info = utfs[0];
  let offset, size;

  offset = Number(cpk.info.HtocOffset);
  size = Number(cpk.info.HtocSize);
  if (offset && size) {
    cpk.htoc = parseTag(buffer.subarray(offset, offset + size), "HTOC");
  }

  offset = Number(cpk.info.TocOffset);
  size = Number(cpk.info.TocSize);
  if (offset && size) {
    cpk.toc = parseTag(buffer.subarray(offset, offset + size), "TOC ");
  }

  offset = Number(cpk.info.EtocOffset);
  size = Number(cpk.info.EtocSize);
  if (offset && size) {
    cpk.etoc = parseTag(buffer.subarray(offset, offset + size), "ETOC");
  }
  return cpk;
}

export default function extractCpk(cpkPath, output) {
  const cpk = parseCpk(cpkPath);

  if (!cpk) return;

  if (output === undefined) {
    output = parse(cpkPath).dir;
  }

  for (let i = 0; i < cpk.toc.length; i++) {
    const item = cpk.toc[i];
    let buffer = cpk.buffer;
    const offset = Number(cpk.info.TocOffset + item.FileOffset);
    let fileBuffer = buffer.subarray(offset, offset + item.FileSize);
    fileBuffer = extract(fileBuffer);
    const dir = join(output, item.DirName);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(join(dir, item.FileName), fileBuffer);
  }
}

export function extract(buffer) {
  if ("CRILAYLA" !== buffer.slice(0, 0x8).toString()) return buffer;

  const uncompressSize = buffer.readUInt32LE(0x8);
  const headerOffset = buffer.readUInt32LE(0xc);
  const result = Buffer.allocUnsafe(uncompressSize + 0x100);

  for (let i = 0; i < 0x100; i++) {
    result[i] = buffer[0x10 + headerOffset + i];
  }

  let output = 0;
  const end = 0x100 + uncompressSize - 1;
  const lens = [2, 3, 5, 8];
  const reader = new BitReader(buffer.slice(0, buffer.length - 0x100));

  while (output < uncompressSize) {
    if (reader.getBits(1) > 0) {
      let offset = end - output + reader.getBits(13) + 3;
      let length = 3;
      let level;

      for (level = 0; level < lens.length; level++) {
        const lv = reader.getBits(lens[level]);
        length += lv;
        if (lv != (1 << lens[level]) - 1) break;
      }

      if (level === lens.length) {
        let lv;
        do {
          lv = reader.getBits(8);
          length += lv;
        } while (lv === 0xff);
      }

      for (let i = 0; i < length; i++) {
        result[end - output] = result[offset--];
        output++;
      }
    } else {
      result[end - output] = reader.getBits(8);
      output++;
    }
  }
  return result;
}

class BitReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = buffer.length - 1;
    this.pool = 0;
    this.left = 0;
  }
  getBits(count) {
    let result = 0;
    let produced = 0;
    let round;
    while (produced < count) {
      if (this.left == 0) {
        this.pool = this.buffer[this.offset];
        this.left = 8;
        this.offset--;
      }
      if (this.left > count - produced) {
        round = count - produced;
      } else {
        round = this.left;
      }
      result <<= round;
      result |= (this.pool >>> (this.left - round)) & ((1 << round) - 1);
      this.left -= round;
      produced += round;
    }
    return result;
  }
}
