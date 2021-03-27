const DOMPurify = require('dompurify')
const Markd = require('marked')
const WebSocket = require('ws')

require('dotenv').config()

let ip = require('ip').address()
// get all ip addresses by node.js os module 
const nets = require('os').networkInterfaces()
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      ip = net.address
    }
  }
}

const trim = (x) => { return typeof x === 'string' ? x.replace(/^\s+|\s+$/gm,'') : '' }

const timestamp = function (date = 'time') {
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

const packMessage = function (text, opts = {}) {
  const args = {
    ...{
      type: 'remote',
      sender: process.env.WEBSOCKET_ROBOT_NAME,
      date: timestamp('date'),
      time: timestamp('time'),
      message: typeof text === 'string' ? Markd(text, { sanitizer: DOMPurify.sanitize }) : text
    },
    ...opts
  }
  return JSON.stringify(args)
}

let broadcasting = false
const broadcast = (clients, row) => {
  const connected = clients.length
  if (broadcasting === false && connected > 0) {
    broadcasting = true
    const MessageDB = require('./message-db.js')
    const db = new MessageDB('announcement')
    let processed = 0
    clients.forEach(function each(client) {

      if (!client.user) {
        console.log('沒有使用者資訊，略過廣播此WS頻道 ... ')
      } else if (client.readyState === WebSocket.OPEN) {
        const json = packMessage(row, { type: 'announcement' })
        client.send(json)
      }

      processed++
      if (processed == connected) {
        broadcasting = false
      }

    })
  }
}

const insertTargetChannel = (json) => {
  const o541 = new MessageDB('yihome')
      o541.insertMessage({
        $title: 'dontcare',
        $content: '美譴責飛彈試射 北韓高官：侵犯自衛權形同挑釁',
        $sender: process.env['USERNAME'],
        $priority: (Math.random() * 1000) % 4
      })
      o541.close()
}

module.exports.timestamp = timestamp
module.exports.packMessage = packMessage
module.exports.broadcast = broadcast
module.exports.insertTargetChannel = insertTargetChannel
module.exports.trim = trim
module.exports.ip = ip
