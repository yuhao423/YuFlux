
const ws = require('ws')

const wsClient = new ws.WebSocket('http://localhost:8000')

wsClient.on('error', console.error);

wsClient.on('open', function open() {
    console.error('open');
  const array = new Float32Array(5);

  for (var i = 0; i < array.length; ++i) {
    array[i] = i / 2;
  }

  wsClient.send('yuyu',()=>{
    console.error('我发送了');
  });
});

wsClient.on('message',(message)=>{
    console.error('received: %s', message);
    console.error(message,'message');
})
module.exports = wsClient