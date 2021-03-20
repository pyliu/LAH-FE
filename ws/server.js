let ip = require('ip').address()
// get all ip addresses by node.js os module 
const nets = require('os').networkInterfaces()
const results = []
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      ip = net.address
    }
  }
}

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

const packMessage = (text, who = '小桃子') => {
  return JSON.stringify({
    type: 'remote',
    who: who,
    ip: ip,
    date: timestamp('date'),
    time: timestamp('time'),
    message: text
  })
}

const broadcast = (wss, message) => {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      const json = packMessage(`${from} 送出 「${message}」(${client.clientIp})`)
      client.send(json)
    }
  })
}


try {
  require('dotenv').config()
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
    })

    ws.on('message', function incoming(message) {
      const json = JSON.parse(message)
      !ws.clientIp && (ws.clientIp = json.ip || req.socket.remoteAddress)
      console.log('received: %s', json.message, json.ip)

      setTimeout(() => {
        ws.send(packMessage(`Hey ${json.ip} ${json.message}`))
      }, 1000)
      
    })

  })
  // remove dead connection
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping(function noop() {})
    })
  }, 30000)
  
  wss.on('close', function close() {
    clearInterval(interval)
  })

  console.log(`ws伺服器已啟動 (${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('ws伺服器啟動失敗', e)
} finally {
}
