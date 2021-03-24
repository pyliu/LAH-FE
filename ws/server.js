try {
  require('dotenv').config()
  const utils = require('./utils.js')
  const Message = require('./message.js')
  const watched = []
  const announcementChannel = new Message('channel_announcement')

  watched.push(announcementChannel)

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

  // watch announcement DB file for new message
  const fs = require('fs')
  let debounce = false;
  fs.watch(announcementChannel.filepath, (event, filename) => {
    if (filename && event === 'change') {
      if (debounce) return
      debounce = setTimeout(() => {
        debounce = false
        announcementChannel.get(function(err, row) {
          err && console.warn(err)
          if (row) {
            utils.broadcast(wss, row)
          }
        })
      }, 100)
    }
  })

  wss.on('connection', function connection(ws, req) {
    
    ws.isAlive = true
    ws.on('pong', function heartbeat() {
      this.isAlive = true
      // console.log(utils.timestamp(), 'received pong from', ws.clientIp)
    })

    ws.on('message', function incoming(message) {
      const json = JSON.parse(message)

      !ws.clientIp && (ws.clientIp = json.ip)

      if (json.type === 'ip') {
        ws.clientIp = json.ip
        ws.send(utils.packMessage(`來自 ${ws.clientIp} 的朋友您好。`))
      } else if (utils.trim(json.message) === '@online') {

        const message = [...wss.clients].reduce(function(str, client) {
          return client.readyState === WebSocket.OPEN ? (str += `${client.clientIp}<br/>`) : str
        }, '目前連線使用者：<br/>')

        ws.send(utils.packMessage(message))
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
    announcementChannel.insert({
      $title: 'TEST HEADER',
      $content: 'This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.',
      $sender: '小猴子',
      $priority: (Math.random() * 1000) % 4
    })
  }, 20000)
  
  wss.on('close', function close() {
    clearInterval(interval)
    watched.forEach((item, idx, array) => {
      item.close()
    })
  })

  console.log(`ws伺服器已啟動 (${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('ws伺服器啟動失敗', e)
} finally {
}
