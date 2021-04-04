const fs = require("fs")
const path = require("path")
const utils = require("./utils.js")
const sqlite3 = require("sqlite3").verbose()

class MessageDB {
  
  constructor (channel) {
    this.channel = channel
    this.insertIntoMessageSQL = `
      INSERT INTO message(title, content, priority, create_datetime, expire_datetime, sender, from_ip, flag)
      VALUES ($title, $content, $priority, $create_datetime, $expire_datetime, $sender, $from_ip, $flag)
    `
    this.retry = 0

    this.dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(this.dbDir)){
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, this.channel) + '.db'
    this.open()
  }

  open () {
    this.copyEmptyMessageTable()
    // this.createMessageTable()
    this.db = new sqlite3.Database(this.filepath)
  }

  close () {
    this.db.close()
    this.watcher && this.watcher.close()
  }

  copyEmptyMessageTable () {
    try {
      if (!fs.existsSync(this.filepath)) {
        const samplePath = path.join(__dirname, 'dimension', 'message') + '.db'
        fs.copyFileSync(samplePath, this.filepath)
      }
    } catch (e) {
      console.warn('拷貝預設的訊息資料庫失敗，嘗試動態生成 ... ')
      this.createMessageTable()
    }
  }

  async createMessageTable () {
    if (!fs.existsSync(this.filepath)) {
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
      await utils.sleep(400)
      db.close()
    }
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
    const that = this
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
    }, {}, function (err) {
      if (err) {
        if (that.retry < 3) {
          const timeout = parseInt(Math.random() * 1000)
          console.warn(err, `${timeout}ms 後重試新增訊息 ... `)
          setTimeout(that.insertMessage.bind(that, params), timeout)
          that.retry++
        } else {
          console.error(err, `插入新訊息失敗 ${this.channel} "${params.$content}"`)
        }
      } else {
        that.retry = 0
      }
    })
  }

  getLatestMessage (callback) {
    this.db.get("SELECT * FROM message ORDER BY id DESC", callback)
  }

  getLatestMessageByCount (count, callback) {
    try {
      const i = parseInt(count)
      this.db.each(`SELECT * FROM (SELECT * FROM message WHERE sender <> 'system' ORDER BY id DESC LIMIT ${i}) ORDER BY id ASC`, callback)
      this.retry = 0
    } catch (e) {
      if (that.retry < 3) {
        const timeout = parseInt(Math.random() * 1000)
        console.warn(err, `${timeout}ms 後重試取得 ${this.channel} 最新訊息 ... `)
        setTimeout(this.getLatestMessageByCount.bind(this, count, callback), timeout)
        this.retry++
      } else {
        console.error(err, `取得 ${this.channel} 最新訊息失敗`)
      }
    }
  }
}
module.exports = MessageDB