const writeTestMessage = function () {
  // for testing purpose
  const MessageDB = require('./message-db.js')
  const fs = require('fs')
  const utils = require('./utils.js')
  const news = JSON.parse(fs.readFileSync(__dirname+'/news.json', 'utf8'))
  const newsLen = news.length

  setTimeout(() => {
    const announcementChannel = new MessageDB('announcement')
    const seed = parseInt(Math.random() * 1000)
    const pick = seed % newsLen
    announcementChannel.insertMessage({
      $title: news[pick].title,
      $content: news[pick].description,
      $sender: news[pick].source,
      $priority: seed % 4,
      $from_ip: utils.ip
    })
    announcementChannel.close()
  }, Math.random() * 1000 * 5)

  setTimeout(() => {
    const seed = parseInt(Math.random() * 1000)
    const pick = seed % newsLen
    utils.insertMessageChannel(process.env['USERNAME'], {
      message: news[pick].title,
      sender: news[pick].source,
      from: utils.ip,
      priority: 2,
      flag: 0
    })
  }, Math.random() * 1000 * 5)
}
try {
  require('dotenv').config()

  const utils = require('./utils.js')
  const RequestHandler = require('./request-handler.js')
  const MessageWatcher = require('./message-watcher.js')

  // initialize WS server
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

  const watcher = new MessageWatcher(wss)
  const handler = new RequestHandler(wss, watcher)

  // new connection handler for remote client
  wss.on('connection', function connection(ws, req) {
    
    ws.isAlive = true
    ws.on('pong', function heartbeat() {
      this.isAlive = true
    })

    ws.on('message', function incoming(message) {
      console.log(message)
      const processedMessage = handler.handle(this, message)
      if (processedMessage === false) {
        this.send(utils.packMessage(`WS伺服器無法處理您的請求 ${message}`))
      } else if (processedMessage === true) {
        
      } else {
        this.send(utils.packMessage(processedMessage))
      }
    })

    ws.on('close', function close() {
      if (this.user) {
        console.log(`${this.user.userid} 連線已中斷`)
      } else {
        console.warn('WebSocket內沒有使用者資訊')
      }
    });

  })

  // remove dead connection every 20s
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        console.log(`偵測到 ${ws.user.dept} / ${ws.user.userid} 的連線已中斷。`)
        return ws.terminate()
      }
      ws.isAlive = false
      ws.ping(function noop() {})
    })

    // test purpose
    writeTestMessage()


  }, 20000)
  
  wss.on('close', function close() {
    clearInterval(interval)
    watcher.close()
  })

  console.log(`ws伺服器已啟動 (${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('ws伺服器啟動失敗', e)
} finally {
}
