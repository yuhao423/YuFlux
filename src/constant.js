const protocolVersions = [13];

const readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];

//Buffer.alloc(size[, fill[, encoding]])： 返回一个指定大小的 Buffer 实例，如果没有设置 fill，则默认填满 0
const emptyBuffer = Buffer.alloc(0);

module.exports = {
  protocolVersions,
  readyStates,
  //这个GUID只能是这个，不能是其他值
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
  //空的buffer
  emptyBuffer,
};
