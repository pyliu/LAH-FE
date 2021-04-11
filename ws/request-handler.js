const WebSocket = require('ws')
const isEmpty = require('lodash/isEmpty')
const utils = require('./utils.js')
const MessageDB = require('./message-db.js')
const ChannelDB = require('./channel-db.js')
const { BIconChevronCompactLeft } = require('bootstrap-vue')

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

    if (incoming.channel === undefined && incoming.message.channel === undefined) {
      console.warn(`沒有頻道資訊，無法處理此訊息`, incoming)
      return
    }

    if (typeof incoming === 'object' && incoming.type) {
      switch (incoming.type) {
        case 'command':
          // handle system command 
          return this.handleCommandRequest(ws, incoming.message)
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

  handleCommandRequest (ws, message) {
    const json= typeof message === 'string' ? JSON.parse(message) : message
    const cmd = json.command
    switch (cmd) {
      case 'register':
        return this.executeRegisterCommand(ws, json)
      case 'mychannel':
        return this.executeQueryJoinChannelCommand(ws)
      case 'latest':
        return this.executeQueryLatestlMessageCommand(ws, json)
      case 'remove_channel':
        return this.executeRemoveChannelCommand(ws, json)
      default:
        console.warn(`不支援的命令 ${cmd}`)
    }
    return false
  }

  executeRegisterCommand (ws, args) {
    /** expected args json format
      {
        command: 'register',
        ip: '192.168.24.2',
        domain: 'HBWEB',
        userid: 'HB0541',
        username: 'WHOAMI',
        dept: 'inf',
      }
     */
    const valid = typeof args === 'object'
    // inject client information into ws instance, currently it should contain ip, domain and username from remote client
    valid && (ws.user = { ...args })

    const message = valid ? `遠端客戶端資料 (${ws.user.ip}, ${ws.user.domain}, ${ws.user.userid}, ${ws.user.username}, ${ws.user.dept}) 已儲存於 ws 物件中` : `無法完成 register 命令，因為格式不符`
    !valid && console.warn(message, args)
    isDev && console.log(message)

    ws.send(utils.packMessage(
      // message payload
      {
        command: 'register',
        payload: null,
        success: valid,
        message: message
      },
      // outter message attrs
      {
        type: 'ack',
        id: '-1', // temporary id for register
        channel: 'system'
      }
    ))

    return valid
  }

  executeQueryJoinChannelCommand (ws) {
    !ws.user && console.warn('無法完成 mychannel 命令，因為無使用者資訊')
    const db = new ChannelDB()
    ws.user && db.getChannelByParticipant(ws.user.userid, (err, row) => {
      err && console.warn(`executeQueryJoinChannelCommand 執行錯誤`, err)
      isDev && console.log(`找到 ${ws.user.userid} 參與頻道資訊`, row)
      !err && ws.send(utils.packMessage(
        // message payload
        {
          command: 'mychannel',
          payload: { action: 'add', ...row },
          success: !err,
          message: `找到 ${row['id']} 頻道`
        },
        // outter message attrs
        {
          type: 'ack',
          id: '-2', // temporary id for mychannel
          channel: 'system'
        }
      ))
    })
  }

  executeQueryLatestlMessageCommand (ws, json) {
    const channel = json.channel
    const count = parseInt(json.count) || 30
    const channelDB = new MessageDB(channel)
    channelDB.getLatestMessageByCount(count, (err, row) => {
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

  executeRemoveChannelCommand (ws, json) {
    const channel = json.channel
    /*
      item example: {
        id: 10,
        name: 'DONTCARE',
        participants: [ '0541', 'HB0542' ],
        type: 0
      }
    */
    const id = json.id
    const toBeRemoved = new MessageDB(id)
    // find online participants' ws to send ACK
    const participants = [...ws.wss.clients].filter((client, idx, arr) => {
      return json.participants.includes(client.user.userid)
    })
    toBeRemoved.remove((success) => {
      participants.forEach((participant) => {
        participant.send(utils.packMessage(
          // message payload
          {
            command: 'remove_channel',
            payload: json,
            success: success,
            message: success? `已移除 ${id} / ${json.name} 頻道` : `移除 ${id} / ${json.name} 頻道失敗，請稍後再試`
          },
          // outter message attrs
          {
            type: 'ack',
            id: '-3', // temporary id for remove channel
            channel: 'system'
          }
        ))
      })
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