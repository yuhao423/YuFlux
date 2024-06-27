const http = require("http");
const EventEmitter = require("events");
const { URL } = require("url");
const { randomBytes, createHash } = require("crypto");

const { protocolVersions, readyStates, GUID, emptyBuffer } = require("./constant");

class YuFlux extends EventEmitter {
  constructor(address, protocols, options) {
    super();
    this._readyState = readyStates[0];

    if (address !== undefined) {
      this._isServer = false;
      this._redirect = 0;
      // 加入socket，tcp
      this._socket = null;
      this._protocol = "";
      if (protocols === undefined || null) {
        protocols = [];
      }

      initWebSocketClient(this, address, protocols, options);
    } else {
      this._isServer = true;
    }
  }

  /**
   * @private
   */
  emitClose() {}

  /**
   * @param {Duplex} socket
   * @param {Buffer} head
   * @param {Object} options
   *
   */
  setSocket(socket, head, option) {
    //1. receiver

    //2. sender

    //3.socket
    this._socket = socket;

    socket["kWebsocket"] = this;

    //socket相关
    if (socket.setTimeout) socket.setTimeout(0);
    if (socket.setNoDelay) socket.setNoDelay();

    if (head.length > 0) socket.unshift(head);

    //todo socket其他事件的监听
    socket.on("data", socketOnData);

    //内部状态
    this._readyState = readyStates[1];
    this.emit("open");
  }

  /**
   * @param {*} data
   * @param {Object} [options]
   * @param {Function} [cb]
   * @public
   */
  send(data, options, cb) {
    //1.
    if (this._readyState !== readyStates[1]) {
      throw new Error("yuflux 内部状态不是opening状态，不可发送消息");
    }

    //todo send after close

    if (typeof data === "number") data = data.toString();

    //利于交互
    if (typeof options === "function") {
      cb = options;
      options = {};
    }

    const opts = {
      binary: typeof data !== "string", //是不是
      mask: !this._isServer, //客户端必须要掩码
      fin: true, //是否是最后一个
      compress: true, //是否压缩，这里暂时为false
      ...options,
    };

    this._sender.send(data || emptyBuffer, opts, cb);
  }
}

module.exports = YuFlux;

const initWebSocketClient = (websocket, address, protocols, options) => {
  const opts = {
    //给options一些默认值
    autoPong: true,
    protocolVersion: protocolVersions[0],
    allowSynchronousEvents: true,
    maxPayload: 100 * 1024 * 1024, //100m
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,

    //下面的配置必须重写,即初始化为undefined
    hostName: undefined, //主机名
    protocol: undefined, //协议
    timeout: undefined, //超时时间
    method: "GET", //必须是get
    socketPath: undefined, //重定向相关的路径
    host: undefined, //
    path: undefined,
    port: undefined,
  };

  websocket._autoPong = opts.autoPong;

  //协议不是 8 或者 13
  if (!protocolVersions.includes(opts.protocolVersion)) {
    throw new Error("协议错误,你配置对象中的protocolVersion应该为13");
  }

  let parseUrl;
  if (address instanceof URL) {
    parseUrl = address;
  } else {
    try {
      parseUrl = new URL(address);
    } catch (error) {
      throw new Error(`不正确的url,${address}`);
    }
  }

  //路径必须是wss或者ws，这里我们可以将http，https转化成wss，ws，方便用户交互。
  if (parseUrl.protocol === "https:") {
    parseUrl.protocol = "wss:";
  } else if (parseUrl.protocol === "http:") {
    parseUrl.protocol = "ws:";
  }

  //完整的url给 websocket_url
  websocket._url = parseUrl.href;

  const isSecure = parseUrl.protocol === "wss:" ? true : false;
  //todo 考虑是不是wss，因为要使用tsl
  let invalidUrlMessage;
  if (parseUrl.protocol !== "wss:" && parseUrl.protocol !== "ws:") {
    invalidUrlMessage = "不正确的url，websocket支持";
  }
  if (invalidUrlMessage) {
    throw invalidUrlMessage;
  }
  //处理简单加密的Sec-WebSocket-Key，用于提供基本的防护, 比如无意的连接
  const key = randomBytes(16).toString("base64");
  //发送http请求，使用http模块的request
  const request = http.request;

  //把opts没有写好的配置写好
  const defaultPort = isSecure ? 443 : 80;
  opts.port = parseUrl.port || defaultPort;
  //处理ipv6
  opts.host = parseUrl.host.startsWith("[") ? parseUrl.hostName.slice(1, -1) : parseUrl.hostName;
  //请求头
  opts.headers = {
    ...opts.headers,
    "sec-websocket-Version": opts.protocolVersion,
    "sec-websocket-key": key,
    Connection: "Upgrade",
    Upgrade: "websocket",
  };
  opts.path = parseUrl.pathname + parseUrl.search; //ws协议的url是怎么写的？ 正确示例：ws://example.com/chat?name=yu
  opts.timeout = opts.handshakeTimeout;

  //todo 处理开启消息压缩
  if (opts.perMessageDeflate) {
    /* eslint-disable no-console */
    console.error("perMessageDeflate");
    /* eslint-enable no-console */
    // ...
  }

  //处理origin,请求来自一个浏览器，那么请求必须包含一个Origin header字段
  if (opts.origin) {
    opts.headers.origin = opts.option;
  }

  //处理auth
  if (parseUrl.username || parseUrl.password) {
    opts.auth = `${parseUrl.username}:${parseUrl.password}`;
  }

  let req;
  //todo 处理重定向
  if (opts.followRedirects) {
    /* eslint-enable no-console */
    console.error("followRedirects");
    /* eslint-enable no-console */
    // ...
  }

  req = websocket._req = request(opts);

  if (opts.timeout) {
    req.on("timeout", () => {
      //这里不能简单的抛出，一定要断开连接并抛出错误
      abortHandshake(websocket, req, "握手超时了");
    });
  }

  //error
  req.on("error", (err) => {
    req = websocket._req = null;

    emitErrorAndClose(websocket, err);
  });

  //todo respose 重定向

  req.on("upgrade", (res, socket, head) => {
    websocket.emit("upgrade", res);

    if (websocket._readyState !== readyStates[0]) {
      return;
    }
    //http请求回来了，就置空req
    req = websocket._req = null;

    const upgrade = res.headers.upgrade;
    // console.log(res.headers, "res.headers");
    //请求头不对
    if (upgrade === undefined || upgrade.toLowerCase() !== "websocket") {
      abortHandshake(websocket, socket, "不正确的请求头");
      return;
    }

    //解密,使用sha1算法
    //定义GUID（全局唯一标识符）摘要，可以是一个固定值或动态生成，从而生成摘要，最终转化成base64
    const digest = createHash("sha1")
      .update(key + GUID)
      .digest("base64");

    if (res.headers["sec-websocket-accept"] !== digest) {
      abortHandshake(websocket, socket, "不正确的 sec-websocket-key 请求头");
      return;
    }

    //子协议的处理
    const serverProtocol = res.headers["sec-websocket-protocol"];
    let protocolError;

    if (serverProtocol !== undefined) {
      //todo 更细的error划分
      protocolError = "暂不支持子协议";
    }

    if (protocolError) {
      abortHandshake(websocket, socket, protocolError);
      return;
    }

    if (serverProtocol) websocket._protocol = serverProtocol;

    //处理sec-websocket-extensions,扩展
    const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
    if (secWebSocketExtensions !== undefined) {
      //todo 更细的error划分
      const message = "暂不支持websocket扩展协议";
      abortHandshake(websocket, socket, message);
      return;
    }

    //握手结束，正式tcp连接（socket）
    //setSocket
    websocket.setSocket(socket, head, {
      allowSynchronousEvents: opts.allowSynchronousEvents,
      generateMask: opts.generateMask,
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation,
    });
  });

  if (opts.finishRequest) {
    opts.finishRequest(req, websocket);
  } else {
    req.end();
  }
};

//todo 完善 emitErrorAndClose 函数
/**
 * @param {websocket} websocket websocket实例
 * @param {*} err
 *
 */
const emitErrorAndClose = (websocket, err) => {
  //1. 改变websocket的状态
  websocket._readyState = readyStates[3];
  //2. emit error
  websocket.emit("error", err);
  //3. 真正的emitClose函数
  websocket.emitClose();
};

/**
 * @private
 */
function socketOnData(chunk) {
  //this 是socket实例
  //this['kWebsocket']是 websocket 实例
  if (!this["kWebsocket"]._receiver.write(chunk)) {
    this.pause();
  }
}
