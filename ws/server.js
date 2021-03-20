
'use strict'

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

const ip = require('ip').address()

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
      client.send(json);
    }
  });
}


try {

  const WebSocket = require('ws');

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
  });

  wss.on('connection', function connection(ws, req) {

    ws.on('message', function incoming(message) {
      const json = JSON.parse(message)
      ws.clientIp = json.ip || req.socket.remoteAddress
      console.log('received: %s', json.message)

      setTimeout(() => {
        ws.send(packMessage(`Hey ${json.ip} ${json.message}`))
      }, 1000)
      
    });

  });

  console.log(`ws伺服器已啟動 (${process.env.WEBSOCKET_PORT})`)

} catch (e) {
  console.error('ws伺服器啟動失敗', e)
} finally {
}
