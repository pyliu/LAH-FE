const WebSocket = require('ws')
const utils = require('./utils.js')

class RequestHandler {
  
  constructor (wss, messageWatcher) {
    // WebSocket Server
    this.wss = wss
    // MessageWatcher
    this.watcher = messageWatcher
  }

  handle (ws, incomingRaw) {
    const incoming = JSON.parse(incomingRaw)
    if (typeof incoming === 'object' && incoming.type) {
      switch (incoming.type) {
        case 'user':
          return this.handleUserRequest(ws, incoming.message)
        case 'mine':
          return this.handleMineRequest(ws, incoming)
        default:
          return false
      }
    } else {
      console.warn(`${incoming} is not a valid json object, skip the request ... `, `RAW: ${incomingRaw}`)
    }
    return false
  }

  handleMineRequest (ws, json) {
    const userid = json.sender
    const targetid = json.receiver
    const message = json.message

    utils.insertTargetChannel(json)

    if (json.message === '@online') {
      console.log(`收到查詢線上使用者指令 ${ws.user ? ws.user.userid : ''}`)
      return this.handleOnlineRequest()
    }
    return false
  }

  handleUserRequest (ws, message) {
    // this type message should be a json object string
    const user = JSON.parse(message)
    // inject client information into ws instance, currently it should contain ip, domain and username from remote client
    ws.user = user
    console.log(`遠端客戶端資料 (${user.ip}, ${user.domain}, ${user.userid}, ${user.username}) 已儲存於 socket 物件中。`)
    // not for broadcasting
    this.watcher.subscribe(`${user.userid}`)
    // watch HB0541 channel
    return `來自 ${user.ip} 的 ${user.domain}\\${user.userid} (${user.username}) 歡迎回來`
  }

  handleOnlineRequest () {
    const message = [...this.wss.clients].reduce(function(str, client) {
      return client.readyState === WebSocket.OPEN ? (str += `${client.user.userid}: ${client.user.username} (${client.user.ip})\n`) : str
    }, '目前連線使用者：\n')
    console.log(message)
    return message
  }

}
module.exports = RequestHandler