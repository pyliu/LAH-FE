const ws = require("nodejs-websocket")

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

console.log("啟動WEBSOCKET伺服器")

try {
  ws.createServer(function(conn) {

    conn.on("text", function(str) {
      console.log("收到的資訊為", str)
      conn.send(JSON.stringify({
        time: timestamp(),
        text: `${str}（機器人）`
      }))
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
