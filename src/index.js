"use strict";
const YuFlux = require("./websocket");

const yuFlux = new YuFlux("http://localhost:8000");

yuFlux.on("upgrade", (res) => {
  console.error(res.headers, "res.headers");
});

yuFlux.on("open", () => {
  console.error("open");
  yuFlux.send("yuyu", () => {
    console.error("我发送了");
  });
});
