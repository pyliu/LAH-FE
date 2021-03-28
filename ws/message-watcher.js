const fs = require('fs')
const path = require('path')
const utils = require('./utils.js')
const MessageDB = require('./message-db.js')

class MessageWatcher {
  
  constructor (wss) {
    // singleton
    if (!MessageWatcher._instance) {
      MessageWatcher._instance = this;
      // WebSocket Server
      MessageWatcher.wss = wss
      // watch db folder for changes
      const nodeWatch = require('node-watch');
      nodeWatch(
        path.join(__dirname, 'db'),
        { recursive: true, filter: /\.db$/ },
        this.watchHandler
      )
    }
    return MessageWatcher._instance;
  }

  watchHandler (evt, name) {
    console.log(evt, name)
    // e.g. test.db
    const basename = path.basename(name)
    const channel = path.basename(name, '.db')
    if (evt == 'update') {
      // on create or modify
      let mc = new MessageDB(channel)
      mc.getLatestMessage((err, row) => {
        err && console.warn(err)
        if (row) {
          if (channel === 'announcement') {
            utils.broadcast([ ...MessageWatcher.wss.clients ], row)
          } else {
            // according channel name to find user to send message ... 
            const found = [ ...MessageWatcher.wss.clients ].filter(function(ws, idx, array){
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
                  from: row['ip'],
                  channel: channel
                }))
              })
            } 
          }
        }
      })
    }
  
    if (evt == 'remove') {
      // on delete
    }
  }

}
module.exports = MessageWatcher