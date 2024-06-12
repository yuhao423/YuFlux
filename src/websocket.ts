/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex|Readable$", "caughtErrors": "none" }] */

import { URL } from "url";

// const EventEmitter = require('events')
import EventEmitter from "events";
import { randomBytes } from "crypto";
// import http from "http";

import { InitOptions, protocolVersions } from "./constant";
/**
 *
 *
 */

class Websocket extends EventEmitter {
  _isServer: boolean;
  _redirects: number;
  _url: string;
  constructor(address: URL | null, protocols: string[] | null, options: InitOptions) {
    super();

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
function initSocketClient(websocket: Websocket, address: URL, protocols: string[], options: any) {
  //1.处理协议 protocolVersion，必须是 8 或者13，w我们使用13

  const opts = {
    autoPong: true,
    protocolVersion: protocolVersions[0],
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
  if (parseUrl.protocol !== "wss" || "ws") {
    invalidUrlMessage = "不正确的url，websocket支持";
  }
  if (invalidUrlMessage) {
    throw invalidUrlMessage;
  }

  //处理简单加密的Sec-WebSocket-Key，用于提供基本的防护, 比如无意的连接
  const key = randomBytes(16).toString("base64");
  //发送http请求，使用http模块的request
//   const request = http.request;
  const defaultPort = isSecure ? 443 : 80;
  opts.port = parseUrl.port || defaultPort;
  //处理ipv6
  opts.host = parseUrl.host.startsWith("[") ? parseUrl.host.slice(1, -1) : parseUrl.host;

  opts.headers = {
    ...opts.headers,
    "sec-websocket-Version": opts.protocolVersion,
    "sec-websocket-key": key,
    Connection: "Upgrade",
    Upgrade: "websocket",
  };
}
