
require('dotenv').config()
const timestamp = (date = false) => {
  const now = new Date()
  if (date) {
    // e.g. 2021-03-14 16:03:00
    return now.getFullYear() + '-' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
      ('0' + now.getDate()).slice(-2) + ' ' +
      ('0' + now.getHours()).slice(-2) + ':' +
      ('0' + now.getMinutes()).slice(-2) + ':' +
      ('0' + now.getSeconds()).slice(-2)
  } else {
    // e.g. 16:03:00
    return ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2)
  }
}

try {
  const ws = require("nodejs-websocket")
  const server = ws.createServer(function(conn) {
    conn.on("text", function(str) {
      console.log("收到的資訊為", str)
      conn.send(JSON.stringify({
        time: timestamp(),
        text: `${str}（機器人）`
      }))
      setTimeout(() => {
        conn.send(JSON.stringify({
          time: timestamp(),
          text: `${str}（機器人）`
        }))
      }, 3000)
    })
    conn.on("close", function(code, reason) {
      console.log(code, reason, "關閉連線")
    })
    conn.on("error", function(code, reason) {
      console.log(code, reason, "異常關閉")
    })
  })
  
  server.listen(process.env.WEBSOCKET_PORT)
  console.log(`WebSocket伺服器已啟動(${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('WebSocket伺服器啟動失敗', e)
} finally {
}
