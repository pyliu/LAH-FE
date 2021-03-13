const ws = require("nodejs-websocket")
console.log("啟動WEBSOCKET伺服器")
try {
  ws.createServer(function(conn) {
    conn.on("text", function(str) {
      console.log("收到的資訊為", str)
      conn.send(`${str}（機器人）`)
    })
    conn.on("close", function(code, reason) {
      console.log(code, reason, "關閉連線")
    })
    conn.on("error", function(code, reason) {
      console.log(code, reason, "異常關閉")
    })
  }).listen(8001)
} catch (e) {
  console.error(e)
} finally {
  console.log("WEBSOCKET伺服器已啟動")
}
