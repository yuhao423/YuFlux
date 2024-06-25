const protocolVersions = [13];

const readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];

module.exports = {
  protocolVersions,
  readyStates,
  //这个GUID只能是这个，不能是其他值
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
};
