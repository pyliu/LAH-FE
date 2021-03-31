const WebSocket = require('ws')
const utils = require('./utils.js')
const MessageDB = require('./message-db.js')

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
    // create db if not exists
    incoming.channel && new MessageDB(incoming.channel)
    if (typeof incoming === 'object' && incoming.type) {
      switch (incoming.type) {
        case 'register':
          return this.handleRegisterRequest(ws, incoming.message)
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

  handleClientRequest (ws, json) {
    if (json.channel === 'announcement') {
      // skip message from announcement channel
      console.log('收到客戶端送給 announcement 頻道訊息，略過不處理。', json)
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
    console.log(`遠端客戶端資料 (${user.ip}, ${user.domain}, ${user.userid}, ${user.username}, ${user.dept}) 已儲存於 socket 物件中。`)
    return `${user.userid}:${user.username} 已連線`
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