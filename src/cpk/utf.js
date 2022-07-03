export function findZero(buffer, start) {
  while (buffer[start] !== 0x0) start++;
  return start;
}

export default function parseUtf(buffer, toString) {
  if (!buffer || buffer.length < 4) return null;

  let pos = 0;
  const config = {};
  config.magic = buffer.slice(pos, 4).toString();
  pos += 4;
  if (config.magic !== "@UTF") return null;
  config.dataSize = buffer.readUInt32BE(pos);
  pos += 4;
  buffer = buffer.slice(pos);

  pos = 0;
  config.unknown = buffer.readUInt16BE(pos);
  pos += 2;
  config.valueOffset = buffer.readUInt16BE(pos);
  pos += 2;
  config.stringOffset = buffer.readUInt32BE(pos);
  pos += 4;
  config.dataOffset = buffer.readUInt32BE(pos);
  pos += 4;
  config.nameOffset = buffer.readUInt32BE(pos);
  pos += 4;
  config.elementCount = buffer.readUInt16BE(pos);
  pos += 2;
  config.valueSize = buffer.readUInt16BE(pos);
  pos += 2;
  config.pageCount = buffer.readUInt32BE(pos);
  pos += 4;

  let stringEnd = findZero(buffer, config.stringOffset);
  config.name = buffer.slice(config.stringOffset, stringEnd).toString();
  let valuePos = config.valueOffset;
  const pages = [];
  config.types = [];
  let firstPos = pos;

  for (let i = 0; i < config.pageCount; i++) {
    let page = {};
    pos = firstPos;

    for (let j = 0; j < config.elementCount; j++) {
      let type = buffer.readUInt8(pos);
      pos = pos + 1;

      if (i === 0) config.types[j] = type;

      let stringOffset = config.stringOffset + buffer.readUInt32BE(pos);
      pos += 4;
      stringEnd = findZero(buffer, stringOffset);

      const key = buffer.slice(stringOffset, stringEnd).toString();
      const method = type >>> 5;
      type = type & 0x1f;

      let value = null;
      if (method > 0) {
        let offset = method === 1 ? pos : valuePos;
        switch (type) {
          case 0x10:
            value = buffer.readInt8(offset);
            offset += 1;
            break;
          case 0x11:
            value = buffer.readUInt8(offset);
            offset += 1;
            break;
          case 0x12:
            value = buffer.readInt16BE(offset);
            offset += 2;
            break;
          case 0x13:
            value = buffer.readUInt16BE(offset);
            offset += 2;
            break;
          case 0x14:
            value = buffer.readInt32BE(offset);
            offset += 4;
            break;
          case 0x15:
            value = buffer.readUInt32BE(offset);
            offset += 4;
            break;
          case 0x16:
            value = buffer.readBigInt64BE(offset);
            offset += 8;
            break;
          case 0x17:
            value = buffer.readBigUInt64BE(offset);
            offset += 8;
            break;
          case 0x18:
            value = buffer.readFloatBE(offset);
            offset += 4;
            break;
          case 0x19:
            debugger;
            value = buffer.readDoubleBE(offset);
            offset += 8;
            break;
          case 0x1a:
            stringOffset = config.stringOffset + buffer.readUInt32BE(offset);
            offset += 4;
            stringEnd = findZero(buffer, stringOffset);
            value = buffer.slice(stringOffset, stringEnd).toString();
            break;
          case 0x1b:
            const bufferStart = config.dataOffset + buffer.readUInt32BE(offset);
            offset += 4;
            const bufferLen = buffer.readUInt32BE(offset);
            offset += 4;
            value = buffer.slice(bufferStart, bufferStart + bufferLen);
            let temp = parseUtf(value, toString);
            if (temp) value = temp;
            else if (toString)
              value = buffer
                .slice(bufferStart, bufferStart + bufferLen)
                .toString("hex");
            break;
          default:
            console.log(`unknown type: ${type}`);
            break;
        }

        if (method === 1) pos = offset;
        else valuePos = offset;
      }

      page[key] = value;
    }

    pages.push(page);
  }

  pages.config = config;

  return pages;
}
