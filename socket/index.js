
require('dotenv').config();

const timestamp = (date = 'time') => {
  const now = new Date()
  const full = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2)
  if (date === 'full') {
    // e.g. 2021-03-14 16:03:00
    return full
  } else if (date === 'date') {
    return full.split(' ')[0]
  } else {
    // e.g. 16:03:00
    return full.split(' ')[1]
  }
}

const packMessage = (text, who = 'robot') => {
  return JSON.stringify({
    type: 'remote',
    who: who,
    date: timestamp('date'),
    time: timestamp('time'),
    message: text
  })
}


const broadcast = (connections, message) => {
  connections.forEach((client, idx) => {
    const json = packMessage(`哈囉 ${idx}: someone sends 「${message}」（機器人）`)
    client.send(json);
  });
}
try {
  const ws = require("nodejs-websocket")
  const server = ws.createServer(function(conn) {
    conn.on("text", function(str) {
      console.log("收到的資訊為", str)
      const json = JSON.parse(str)

      broadcast(server.connections, json.message)
      
      setTimeout(() => {
        conn.send(packMessage(`現在連線數 => ${server.connections.length}（機器人）`))
      }, 1000)
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
