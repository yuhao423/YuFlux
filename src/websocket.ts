/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex|Readable$", "caughtErrors": "none" }] */

import { URL } from "url";
import EventEmitter from "events";
import { randomBytes } from "crypto";
import http from "http";

import { InitOptions, protocolVersions } from "./constant";
import { ReadyState } from "./constant";

const kAborted = Symbol("kAborted");

class Websocket extends EventEmitter {
  _isServer: boolean;
  _redirects: number;
  _url: string;
  _autoPong: boolean;
  _req: http.ClientRequest | null;
  _readyState: ReadyState;
  constructor(address: URL | null, protocols: string[] | null, options: unknown) {
    super();
    this._readyState = "CONNECTING";
    //给options一些默认值

    if (address !== null) {
      this._isServer = false;
      this._redirects = 0;

      //处理子协议
      if (protocols === undefined || null) {
        protocols = [];
      }

      //主函数，init websocket
      initSocketClient(this, address, protocols, options);
    } else {
      this._isServer = true;
    }
  }
}
module.exports = Websocket;

function initSocketClient(
  websocket: Websocket,
  address: URL,
  protocols: string[],
  options: InitOptions,
) {
  //1.处理协议 protocolVersion，必须是 8 或者13，w我们使用13

  const opts: Record<string, any> = {
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

  //处理url路径的问题
  let parseUrl: URL;

  if (address instanceof URL) {
    parseUrl = address;
  } else {
    try {
      parseUrl = new URL(address);
    } catch (e) {
      throw new Error(`不正确的url,${address}`);
    }
  }

  //路径必须是wss或者ws，这里我们可以将http，https转化成wss，ws，方便用户交互。
  if (parseUrl.protocol === "https") {
    parseUrl.protocol = "wss";
  } else if (parseUrl.protocol === "http") {
    parseUrl.protocol = "ws";
  }
  //完整的url给 websocket_url
  websocket._url = parseUrl.href;
  const isSecure: boolean = parseUrl.protocol === "wss" ? true : false;
  //todo 考虑是不是wss，因为要使用tsl
  let invalidUrlMessage;
  if (parseUrl.protocol !== "wss" && parseUrl.protocol !== "ws") {
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
  opts.host = parseUrl.host.startsWith("[") ? parseUrl.host.slice(1, -1) : parseUrl.host;
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

  let req: http.ClientRequest | null;

  //todo 处理重定向
  if (opts.followRedirects) {
    /* eslint-enable no-console */
    console.error("followRedirects");
    /* eslint-enable no-console */
    // ...
  }
  req = websocket._req = request(opts);

  //握手超时时间
  if (opts.timeout) {
    req.on("timeout", () => {
      //这里不能简单的抛出，一定要断开连接并抛出错误
      abortHandshake(websocket, req, "握手超时了");
    });
  }
}

//中断握手
function abortHandshake(websocket: Websocket, stream: http.ClientRequest, message: string) {
  //1. 将内部的状态设置为正在关闭中
  websocket._readyState = "CLOSING";

  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake);

  //如果是http
  if (stream.setHeader) {
    stream[kAborted] = true;
    stream.abort();

    stream.destroy();

    // process.nextTick(emitErrorAndClose, websocket, err);
  }
}
