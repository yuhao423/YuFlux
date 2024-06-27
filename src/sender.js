const maskBuffer = Buffer.alloc(4);
class Sender {
  constructor() {}

  send(data, options, cb) {}

  /*
   * @param {(Buffer|String)} data 要进行帧处理的数据
   * @param {Object} options 选项对象
   * @param {Boolean} [options.fin=false] 指定是否设置 FIN 位
   * @param {Function} [options.generateMask] 用于生成掩码键的函数
   * @param {Boolean} [options.mask=false] 指定是否对 `data` 进行掩码处理
   * @param {Buffer} [options.maskBuffer] 用于存储掩码键的缓冲区
   * @param {Number} options.opcode 操作码
   * @param {Boolean} [options.readOnly=false] 指定 `data` 是否可以修改
   * @param {Boolean} [options.rsv1=false] 指定是否设置 RSV1 位
   * @return {(Buffer|String)[]} 帧处理后的数据
   */
  static frame(data, options) {
    let mask;
    //1. 客户端发送消息，必须掩码
    if (options.mask) {
      mask = options.maskBuffer || maskBuffer;
      //提供了生成 掩码键 masking-key 的函数
      if (options.generateMask) {
        options.generateMask(mask);
      }
    }
  }
}
