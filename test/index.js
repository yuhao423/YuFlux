const weServer = require('./websocketServer')

weServer.on('connection',()=>{
    console.error('websocket-server connected');
})