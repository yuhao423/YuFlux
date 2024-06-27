
const ws = require('ws')

const wsServer = new ws.WebSocketServer({port:8000})
wsServer.on('connection',(ws)=>{
    ws.on('error', console.error);

    ws.on('message', function message(data) {
      console.error('received: %s', data);
    });
  
    // ws.send('something');
})

module.exports = wsServer



