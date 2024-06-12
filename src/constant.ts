export const protocolVersions: number[] = [13];

export interface InitOptions {
  allowSynchronousEvents: boolean; //指定是否允许 'message'、'ping' 和 'pong' 事件在同一个 tick 中多次触发
  autoPong: boolean; //指定是否自动响应 ping 消息。
  finishRequest: (headers: Record<string, string>) => void; //自定义函数，用于在每个 HTTP 请求发送前定制请求头。
  followRedirects: boolean; //是否重定向
  generateMask: () => Buffer; //用于生成掩码键的函数
  handshakeTimeout: number; //握手请求的超时时间毫秒
  maxPayload: number; //允许的最大消息大小
  maxRedirects: number;
  perMessageDeflate: boolean | Object; //启用/禁用 permessage-deflate 压缩扩展
  protocolVersion: number;
  skipUTF8Validation: boolean; //指定是否跳过对文本和关闭消息的 UTF-8 验证
}
