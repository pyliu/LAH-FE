const fs = require("fs")
const path = require("path")
const utils = require("./utils.js")
const Database = require('better-sqlite3')

const isDev = process.env.NODE_ENV !== 'production'

class MessageDB {
  
  constructor (channel) {
    this.channel = String(channel)
    this.retry = 0

    this.dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, this.channel) + '.db'
    this.open()
  }

  open () {
    this.copyEmptyMessageTable()
    // this.createMessageTable()
    this.db = new Database(this.filepath, { verbose: isDev ? console.log : null })
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
      const db = new Database(this.filepath, { verbose: isDev ? console.log : null })
      db.prepare(`
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
      `).run()
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

  insertMessage (params, retry = 0) {
    try {
      const info = this.db.prepare(`
        INSERT INTO message(title, content, priority, create_datetime, expire_datetime, sender, from_ip, flag)
        VALUES ($title, $content, $priority, $create_datetime, $expire_datetime, $sender, $from_ip, $flag)
      `).run({
        ...{
          title: '',
          content: '',
          priority: 3,
          create_datetime: this.timestamp(),
          expire_datetime: '',
          sender: process.env.WEBSOCKET_ROBOT_NAME,
          from_ip: '',
          flag: 0
        },
        ...params
      })
      // info: { changes: 1, lastInsertRowid: 0 }
      isDev && console.log(`新增 ${this.channel} 訊息成功`, info)
      return info
    } catch (e) {
      if (retry < 3) {
        const delay = parseInt(Math.random() * 1000)
        isDev && console.warn(`新增訊息失敗，${delay} ms 後重試 (${retry + 1})`)
        setTimeout(this.insertMessage.bind(this, params, retry + 1), delay)
      } else {
        console.error(`新增 ${this.channel} 訊息失敗`, e)
      }
    }
  }

  getLatestMessage () {
    return this.db.prepare(`SELECT * FROM message ORDER BY id DESC`).get()
  }

  getLatestMessagesByCount (count) {
    return this.db.prepare(`SELECT * FROM (SELECT * FROM message WHERE sender <> 'system' ORDER BY id DESC LIMIT ?) ORDER BY id ASC`).all(parseInt(count) || 30)
  }

  getMessagesByDate (date) {
    return this.db.prepare(`SELECT * FROM message WHERE sender <> 'system' AND create_datetime LIKE ? || '%' ORDER BY id DESC`).all(date)
  }

  getPreviousMessagesByCount (headId, count) {
    return this.db.prepare(`SELECT * FROM message WHERE sender <> 'system' AND id < ? ORDER BY id DESC LIMIT ?`).all(headId, parseInt(count) || 1)
  }
  
  remove (cb) {
    setTimeout(() => {
      fs.unlink(this.filepath, (err) => {
        let succeed = utils.isEmpty(err)
        if (!succeed) {
          console.warn(`刪除 ${this.filepath} 發生錯誤`, err)
        }
        cb(succeed)
      })
    }, parseInt(Math.random() * 600 + 400))
  }
}
module.exports = MessageDB