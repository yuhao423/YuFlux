/**
 *
 * @param {*} data
 * @returns {Buffer} buffer
 */
function toBuffer(data) {
  toBuffer.readOnly = true;

  if (Buffer.isBuffer(data)) return data;

  let buf;
  buf = Buffer.from(data);
  toBuffer.readOnly = false;

  return buf;
}

function _mask(source, mask, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[i + offset] = source[i] ^ mask[i & 3];
  }
}

module.exports = {
  toBuffer,
  _mask,
};
