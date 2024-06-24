
const ws = require('ws')

const weServer = new ws.WebSocketServer({port:8000})

module.exports = weServer

