const { randomFillSync } = require("crypto");

const maskBuffer = Buffer.alloc(4);
const kByteLength = Symbol("kByteLength");
const { toBuffer, _mask } = require("./utils");
const RANDOM_POOL_SIZE = 1024 * 8;
let randomPool;
let randomPoolPointer = RANDOM_POOL_SIZE;

class Sender {
  constructor(socket, extensions, generateMask) {
    this._socket = socket;
    this._extensions = extensions || {};

    //提供了生成mask的函数
    if (generateMask) {
      this._generateMask = generateMask;
      this._maskBuffer = Buffer.alloc(4);
    }

    this._firstFragment = true; //是不是第一个数据帧
    this._compress = false; //是否压缩

    //todo 扩展，压缩使用的
    this._bufferedBytes = 0;
    this._deflating = false;
    this._dequeue = [];
  }

  send(data, options, cb) {
    //1.fin
    //2.compass
    //3.binary
    //4.mask

    //1.流程
    let opcode;
    let byteLength;
    let readOnly;
    let offset;
    //特殊处理的rsv1
    let rsv1 = options.compass; //将rsv1 和是否压缩绑定，默认是不压缩的，就是rsv1为false
    options.binary ? (opcode = 2) : (opcode = 1); //1是文本帧 2是二进制帧

    const perMessageDeflate = this._extensions["extensionName"];

    if (data === "string") {
      byteLength = Buffer.byteLength(data);
      //加一个readonly
      readOnly = false;
    } else {
      data = toBuffer(data);
      byteLength = data.length;
      readOnly = toBuffer.readOnly;
      //转化为buffer，并且获取长度
      //...
    }

    //是不是第一个帧，和后面的扩展有关，很难
    if (this._firstFragment) {
      this._firstFragment = false;
      //...
      this._compress = rsv1; //rsv1还是设置为0，后面再扩展
    } else {
      //不是第一个帧，那就是一个持续帧,持续帧opcode为0，看文档
      opcode = 0;
      rsv1 = 0;
    }

    //如果设置了options.fin,就是说这个是最后一个，需要重置this._firstFragment为true
    //这里很关键啊
    if (options.fin) this._firstFragment = true;

    //todo 压缩的扩展，队列及dispatch
    if (perMessageDeflate) {
      console.error("perMessageDeflate");
    } else {
      this.sendFrame(
        Sender.frame(data, {
          [kByteLength]: byteLength, //字节长度
          fin: options.fin, //是不是最后一个
          generateMask: this._generateMask, //是否提供generateMask函数
          mask: options.mask, //是否需要掩码
          maskBuffer: this._maskBuffer, //提供了maskBuffer吗？
          opcode, //数据类型
          readOnly, //是否只读
          rsv1: false, //写死的rsv1
        }),
        cb,
      );
    }
  }

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
    let offset = 2;
    let skipMasking = false;
    let merge = false;
    //1. 客户端发送消息，必须掩码,如果用户提供掩码，则不需要处理，否则需要掩码处理
    if (options.mask) {
      mask = options.maskBuffer || maskBuffer;
      //提供了生成 掩码键 masking-key 的函数
      if (options.generateMask) {
        options.generateMask(mask);
      } else {
        //生成随机的buffer用来掩码
        if (randomPoolPointer === RANDOM_POOL_SIZE) {
          if (randomPool === undefined) {
            randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
          }

          //crypto 导入这个函数,buffer全变成随机
          randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
          randomPoolPointer = 0;
        }

        mask[0] = randomPool[randomPoolPointer++];
        mask[1] = randomPool[randomPoolPointer++];
        mask[2] = randomPool[randomPoolPointer++];
        mask[3] = randomPool[randomPoolPointer++];

        //跳过掩码，有特殊情况可以跳过掩码
        skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;

        //申请buffer长度为6
        offset = 6;
      }
    }

    //data的长度 - payloadLen
    let dataLength;

    if (typeof data === "string") {
      if ((!options.mask || skipMasking) && options[kByteLength] !== undefined) {
        dataLength = options[kByteLength];
      } else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
    } else {
      dataLength = data.length;
      //todo merge的判断
      merge = false;
    }

    //确定载荷的长度
    let payloadLength = dataLength;

    if (payloadLength >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (payloadLength > 125) {
      offset += 2;
      payloadLength = 126;
    }

    //生成buffer了
    const target = Buffer.allocUnsafe(offset);
    //fin为true，则必须为1，采用位运算来
    target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
    target[1] = payloadLength;

    //改变数据帧的第二个字节
    if (payloadLength === 126) {
      target.writeUInt16BE(dataLength, 2);
    } else if (payloadLength === 127) {
      target[2] = target[3] = 0;
      target.writeUIntBE(dataLength, 4, 6);
    }

    if (!options.mask) return [target, data];

    //需要mask
    target[1] |= 0x80;
    target[offset - 4] = mask[0];
    target[offset - 3] = mask[1];
    target[offset - 2] = mask[2];
    target[offset - 1] = mask[3];

    if (skipMasking) return [target, data];

    _mask(data, mask, data, 0, dataLength);

    console.error([target, data]);
    return [target, data];
  }

  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
}

module.exports = Sender;
