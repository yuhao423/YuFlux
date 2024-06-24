"use strict";
const YuFlux = require("./websocket");

const yuFlux = new YuFlux("http://localhost:8000");
yuFlux.on("upgrade", (res, socket, head) => {
  console.error("res.headers");
});
