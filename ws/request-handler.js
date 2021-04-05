const WebSocket = require('ws')
const utils = require('./utils.js')
const MessageDB = require('./message-db.js')
const ChannelDB = require('./channel-db.js')

const isDev = process.env.NODE_ENV !== 'production'

class RequestHandler {
  
  constructor (wss, messageWatcher) {
    
    // singleton
    if (!RequestHandler._instance) {
      RequestHandler._instance = this;
      // WebSocket Server
      this.wss = wss
      // MessageWatcher
      this.watcher = messageWatcher
    }
    return RequestHandler._instance;
  }

  handle (ws, incomingRaw) {
    const incoming = JSON.parse(incomingRaw)
    
    isDev && console.log('收到客戶端訊息', incoming)
    // create db if not exists
    // incoming.channel && new MessageDB(incoming.channel)
    if (typeof incoming === 'object' && incoming.type) {
      switch (incoming.type) {
        case 'register':
          return this.handleRegisterRequest(ws, incoming.message)
        case 'latest':
          // this type message should be a string that presents channel
          return this.handleLatestMessageRequest(ws, incoming.message)
        case 'channel':
          // get broadcast channel settings
          return this.handleChannelRequest(ws)
        case 'mine':
          // client side sends message
          return this.handleClientRequest(ws, incoming)
        default:
          return false
      }
    } else {
      console.warn(`${incoming} is not a valid json object, skip the request ... `, `RAW: ${incomingRaw}`)
    }
    return false
  }

  handleLatestMessageRequest (ws, channel) {
    const channelDB = new MessageDB(channel)
    channelDB.getLatestMessageByCount(10, (err, row) => {
      if (err) {
        console.warn(err, row)
      } else {
        if (channel === 'announcement') {
          ws.send(utils.packMessage(row, { channel: channel }))
        } else {
          ws.send(utils.packMessage(row['content'], {
            id: row['id'],
            sender: row['sender'],
            date: row['create_datetime'].split(' ')[0],
            time: row['create_datetime'].split(' ')[1],
            from: row['ip'],
            channel: channel
          }))
        }
      }
    })
  }

  handleClientRequest (ws, json) {
    if (['announcement', 'chat'].includes(json.channel)) {
      // skip message from announcement channel
      console.log(`收到客戶端送給 ${json.channel} 頻道訊息，略過不處理。`, json)
      return false
    }
    // insert client sent message to the channel db
    utils.insertMessageChannel(json.channel, json)
    setTimeout(() => {
      // addition parsing for the commands
      switch (json.message) {
        case '@help':
          console.log(`收到 ${ws.user ? ws.user.userid : '???'} 查詢幫助指令`)
          return this.handleHelpRequest(ws)
        case '@online':
          console.log(`收到 ${ws.user ? ws.user.userid : '???'} 查詢線上使用者指令`)
          return this.handleOnlineRequest(ws)
      }
    }, 150)
    return true
  }

  handleRegisterRequest (ws, message) {
    // this type message should be a json object string
    const user = JSON.parse(message)
    // inject client information into ws instance, currently it should contain ip, domain and username from remote client
    ws.user = user
    isDev && console.log(`遠端客戶端資料 (${user.ip}, ${user.domain}, ${user.userid}, ${user.username}, ${user.dept}) 已儲存於 ws 物件中。`)
  
    // also query joined channels
    this.handleChannelRequest(ws)

    return true
  }

  handleChannelRequest (ws) {
    const db = new ChannelDB()
    db.getChannelByParticipant(ws.user.userid, (err, row) => {
      isDev && err && console.warn(`getChannelByParticipant error`, err)
      !err && ws.send(utils.packMessage(
        { action: 'add_channel', ...row },  // message
        {
          id: row['id'],
          channel: 'system'
        }
      ))
    })
  }

  handleHelpRequest (ws) {
    const message = `###### 目前支援指令如下：\r\n`
                    + `***`
                    + `@help - 顯示輔助使用訊息\r\n`
                    + `@online - 查詢線上使用者\r\n`
    ws.send(utils.packMessage(message))
  }

  handleOnlineRequest (ws) {
    const message = [...this.wss.clients].reduce(function(str, client) {
      return client.readyState === WebSocket.OPEN ? (str += `${client.user.userid}: ${client.user.username} (${client.user.ip})<br/>`) : str
    }, '###### 目前連線使用者：<br/>')
    ws.send(utils.packMessage(message))
  }

}
module.exports = RequestHandler