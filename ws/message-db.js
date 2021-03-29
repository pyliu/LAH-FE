const fs = require("fs")
const path = require("path")
const utils = require("./utils.js")
const sqlite3 = require("sqlite3").verbose()

class MessageDB {
  
  constructor (channel) {
    this.channel = channel
    this.retry = 0

    this.dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(this.dbDir)){
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, this.channel) + '.db'

    this.insertIntoMessageSQL = `
      INSERT INTO message(title, content, priority, create_datetime, expire_datetime, sender, from_ip, flag)
      VALUES ($title, $content, $priority, $create_datetime, $expire_datetime, $sender, $from_ip, $flag)
    `

    this.open()
  }

  open () {
    if (!fs.existsSync(this.filepath)) {
      this.createMessageTable()
    }
    this.db = new sqlite3.Database(this.filepath)
  }

  close () {
    this.db.close()
    this.watcher && this.watcher.close()
  }

  async createMessageTable () {
    const db = new sqlite3.Database(this.filepath)
    db.run(`
      CREATE TABLE IF NOT EXISTS "message" (
        "id"	INTEGER,
        "title"	TEXT,
        "content"	TEXT NOT NULL,
        "priority"	INTEGER NOT NULL DEFAULT 3,
        "create_datetime"	TEXT NOT NULL,
        "expire_datetime"	TEXT,
        "sender"	TEXT NOT NULL,
        "from_ip"	TEXT,
        "flag"	INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
    `, {}, function (err) {
      err && console.error(err)
    })
    db.close()
    utils.sleep(400)
  }

  timestamp (date = 'full') {
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

  insertMessage (params) {
    try {
      this.db.run(this.insertIntoMessageSQL, {
        ...{
          $title: '',
          $content: '',
          $priority: 3,
          $create_datetime: this.timestamp(),
          $expire_datetime: '',
          $sender: process.env.WEBSOCKET_ROBOT_NAME,
          $from_ip: '',
          $flag: 0
        },
        ...params
      })
      this.retry = 0
    } catch (e) {
      if (this.retry < 3) {
        const timeout = parseInt(Math.random() * 1000)
        console.warn(e, `${timeout}ms 後重試新增訊息 ... `)
        setTimeout(this.insertMessage.bind(this, params), timeout)
        this.retry++
      } else {
        console.error(e, `插入新訊息失敗 ${this.channel} "${params.$content}"`)
      }
    }
  }

  getLatestMessage (callback) {
    this.db.get("SELECT * FROM message ORDER BY id DESC", callback)
  }
}
module.exports = MessageDB