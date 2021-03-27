const { BIconChevronCompactLeft } = require('bootstrap-vue')

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

  // watch announcement channel for broadcasting
  watcher.subscribe('announcement', true)

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
      } else {
        this.send(utils.packMessage(processedMessage))
      }
    })

    ws.on('close', function close() {
      if (this.user) {
        console.log(`連線已中斷 ${this.user.userid} 頻道將被移除。`)
        watcher.unsubscribe(this.user.userid)
      } else {
        console.warn('WebSocket內沒有使用者資訊')
      }
    });

  })

  // remove dead connection every 20s
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        console.log(`偵測到 ${ws.user.userid} 的連線已中斷。`)
        if (ws.user) {
          // remove client channel fs watcher
          watcher.unsubscribe(ws.user.userid)
        }
        return ws.terminate()
      }
      ws.isAlive = false
      ws.ping(function noop() {})
    })

    // for testing purpose
    const MessageDB = require('./message-db.js')

    setTimeout(() => {
      const announcementChannel = new MessageDB('announcement')
      announcementChannel.insertMessage({
        $title: '長榮超大型貨櫃輪「長賜號」',
        $content: `長榮超大型貨櫃輪「長賜號」（Ever Given）23日因意外擱淺卡在蘇伊士運河，至今卡在運河中已3天，導致後方交通全面阻塞，最新畫面指出，外界關注的「小小挖土機」，在清淤工作中也有了進展。`,
        $sender: process.env['USERNAME'],
        $priority: (Math.random() * 1000) % 4
      })
      announcementChannel.close()
    }, Math.random() * 1000 * 5)

    setTimeout(() => {
      const o541 = new MessageDB('yihome')
      o541.insertMessage({
        $title: 'dontcare',
        $content: '美譴責飛彈試射 北韓高官：侵犯自衛權形同挑釁',
        $sender: process.env['USERNAME'],
        $priority: (Math.random() * 1000) % 4
      })
      o541.close()
    }, Math.random() * 1000 * 5)

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
