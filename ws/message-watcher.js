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
      // static channels
      MessageWatcher.stickyChannels = [
        'announcement', // 公告
        'adm',  // 行政
        'reg',  // 登記
        'sur',  // 測量
        'inf',  // 資訊
        'val',  // 地價
        'supervisor', // 主任/秘書
        'lds' // 喇迪賽
      ]
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
    // evt => 'update' / 'remove', name => 'D:\tmp\code\lah-nuxtjs\ws\db\0541.db'
    // e.g. 0541.db
    const basename = path.basename(name)
    // e.g. 0541
    const channel = path.basename(name, '.db')
    if (evt == 'update') {
      // on create or modify
      let mc = new MessageDB(channel)
      mc.getLatestMessage((err, row) => {
        err && console.warn(err)
        if (row) {
          const wsClients = MessageWatcher.getOnlineWsClients(channel)
          if (MessageWatcher.stickyChannels.includes(channel)) {
            utils.broadcast(wsClients, row, channel)
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

  static getOnlineWsClients (channel) {
    switch (channel) {
      default:
        return [ ...MessageWatcher.wss.clients ]
    }
  }

}
module.exports = MessageWatcher