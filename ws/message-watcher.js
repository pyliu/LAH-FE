const fs = require('fs')

const utils = require('./utils.js')
const MessageDB = require('./message-db.js')

class MessageWatcher {
  
  static channels = []

  constructor (wss) {
    // WebSocket Server
    this.wss = wss
  }

  subscribe (channel, broadcast = false) {
    let mc = new MessageDB(channel)
    MessageWatcher.channels.push(mc)
    // watch channel DB file for new message
    let debounce = false;
    fs.watch(mc.filepath, (event, filename) => {
      if (filename && event === 'change') {
        if (debounce) return
        debounce = setTimeout(() => {
          debounce = false
          mc.get((err, row) => {
            err && console.warn(err)
            if (row) {
              if (broadcast) {
                utils.broadcast(this.wss, row)
              } else {
                // TODO: according channel name to find user to send message ... 
              }
            }
          })
        }, 100)
      }
    })
  }

  close () {
    MessageWatcher.channels.forEach((channel, idx, array) => {
      channel.close()
    })
  }

}
module.exports = MessageWatcher