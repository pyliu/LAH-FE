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
    setTimeout(() => {
      // watch channel DB file for new message
      let debounce = false;
      mc.watcher = fs.watch(mc.filepath, (event, filename) => {
        if (filename && event === 'change') {
          if (debounce) return
          debounce = setTimeout(() => {
            debounce = false
            mc.getLatestMessage((err, row) => {
              err && console.warn(err)
              if (row) {
                if (broadcast) {
                  utils.broadcast([ ...this.wss.clients ], row)
                } else {
                  // according channel name to find user to send message ... 
                  const found = [ ...this.wss.clients ].filter(function(ws, idx, array){
                    if (ws.user) {
                      return ws.user.userid === channel
                    }
                    return false
                  })
                  if (found.length > 0) {
                    found.forEach((ws, idx, array) => {
                      ws.send(utils.packMessage(row['content'], {
                        sender: row['sender'],
                        date: row['create_datetime'].split(' ')[0],
                        time: row['create_datetime'].split(' ')[1],
                        from: row['ip']
                      }))
                    })
                  } 
                }
              }
            })
          }, 100)
        }
      })
      MessageWatcher.channels.push(mc)
      console.log(`${mc.filepath} 已註冊監控。`)
    }, 100)
  }

  unsubscribe (channel) {
    let found_index = -1
    const found = MessageWatcher.channels.find(function(item, index, array){
      if (channel === item.channel) {
        found_index = index
        return true
      }
      return false
    })
    if (found) {
      found.watcher.close()
      console.log(`[${found_index}] ${found.channel} 已解除更新監控。`)
      found.close()
      console.log(`[${found_index}] ${found.channel} 資料庫已關閉。`)
      MessageWatcher.channels.splice(found_index, 1)
      console.log(`[${found_index}] ${found.channel} 資料庫已從監控陣列中移除。`)
    }
  }

  close () {
    MessageWatcher.channels.forEach((channel, idx, array) => {
      channel.watcher.close()
      channel.close()
    })
    MessageWatcher.channels = []
    console.log(`監控頻道已清空。`)
  }

}
module.exports = MessageWatcher