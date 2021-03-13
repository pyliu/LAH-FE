let ws = require("nodejs-websocket");
console.log("開始建立連結");
ws.createServer(function (conn) {
  conn.on("text", function (str) {
    console.log("收到的資訊為", str);
      conn.send(`${str}（機器人`)
  });
  conn.on("close", function (code, reason) {
    console.log("關閉連線")
  });
  conn.on("error", function (code, reason) {
    console.log("異常關閉")
  })
}).listen(8001);
console.log("連結建立完畢");