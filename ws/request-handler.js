const WebSocket = require('ws')

class RequestHandler {
  
  constructor (wss) {
    // WebSocket Server
    this.wss = wss
  }

  handle (ws, incomingRaw) {
    const incoming = JSON.parse(incomingRaw)
    if (typeof incoming === 'object' && incoming.type) {
      switch (incoming.type) {
        case 'user':
          return this.handleUserRequest(ws, incoming.message)
        case '@online':
          return this.handleOnlineRequest()
        default:
          return false
      }
    } else {
      console.warn(`${incoming} is not a valid json object, skip the request ... `, `RAW: ${incomingRaw}`)
    }
    return false
  }

  handleUserRequest (ws, message) {
    // this type message should be a json object string
    const user = JSON.parse(message)
    // inject client information into ws instance, currently it should contain ip, domain and username from remote client
    ws.user = user
    console.log(`client info from ${user.ip} is settled.`)
    return `來自 ${user.ip} 的 ${user.domain}\\${user.username} 歡迎回來`
  }

  handleOnlineRequest () {
    const message = [...this.wss.clients].reduce(function(str, client) {
      return client.readyState === WebSocket.OPEN ? (str += `${client.user.username} (${client.user.ip})<br/>`) : str
    }, '目前連線使用者：<br/>')
    return message
  }

}
module.exports = RequestHandler