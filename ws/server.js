try {
  require('dotenv').config()
  const utils = require('./utils.js')
  const SQLiteDB = require('./sqlite.js')
  const announcementDb = new SQLiteDB('channel_announcement')

  const WebSocket = require('ws')
  const wss = new WebSocket.Server({
    port: process.env.WEBSOCKET_PORT,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed.
    }
  })

  wss.on('connection', function connection(ws, req) {
    
    ws.isAlive = true
    ws.on('pong', function heartbeat() {
      this.isAlive = true
      // client is still connected, check the announcement channel db for unread message
      announcementDb.get(function(err, row) {
        err && console.warn(err)
        if (row) {
          ws.send(utils.packMessage(Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')))
        }
      })
      console.log(utils.timestamp(), this.clientIp)
    })

    ws.on('message', function incoming(message) {
      const json = JSON.parse(message)
      !ws.clientIp && (ws.clientIp = json.ip || req.socket.remoteAddress)
      
      if (json.message === '@online') {
        const message = [...wss.clients].reduce(function(str, client) {
          return client.readyState === WebSocket.OPEN ? (str += `${client.clientIp}<br/>`) : str
        }, '目前連線使用者：<br/>')
        ws.send(utils.packMessage(message))
      } else {
        const delay = parseInt(Math.random() * 1000)
        setTimeout(() => {
          ws.send(utils.packMessage(`${json.ip} 送出「${json.message}」訊息 (${delay}ms)`))
        }, delay)
      }
      
    })

  })
  // remove dead connection every 20s
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping(function noop() {})
    })
    announcementDb.insert({
      $title: 'test',
      $content: 'test...',
      $expire_datetime: utils.timestamp('full'),
      $sender: '小猴子'
    })
  }, 20000)
  
  wss.on('close', function close() {
    clearInterval(interval)
    announcementDb.close()
  })

  console.log(`ws伺服器已啟動 (${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('ws伺服器啟動失敗', e)
} finally {
}
