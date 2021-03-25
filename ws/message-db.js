const fs = require("fs")
const path = require("path")

class MessageDB {
  
  constructor (channel) {
    this.insertIntoMessageSQL = "INSERT INTO message(title, content, priority, create_datetime, expire_datetime, sender) VALUES ($title, $content, $priority, $create_datetime, $expire_datetime, $sender)"
    this.replaceIntoReadSQL = "REPLACE INTO read(user_id, message_id) VALUES ($user_id, $message_id)"
    this.channel = channel

    this.dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(this.dbDir)){
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, this.channel) + '.db'

    this.open()
  }

  open () {
    const sqlite3 = require("sqlite3").verbose()
    this.db = new sqlite3.Database(this.filepath)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS "message" (
        "id"	INTEGER,
        "title"	TEXT,
        "content"	TEXT NOT NULL,
        "priority"	INTEGER NOT NULL DEFAULT 3,
        "create_datetime"	TEXT NOT NULL,
        "expire_datetime"	TEXT,
        "sender"	TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
    `)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS "read" (
        "user_id"	TEXT NOT NULL,
        "message_id"	INTEGER NOT NULL,
        PRIMARY KEY("user_id")
      )
    `)
  }

  close () {
    this.db.close()
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
    this.db.run(this.insertIntoMessageSQL, {
      ...{
        $title: '',
        $content: '',
        $priority: 3,
        $create_datetime: this.timestamp(),
        $expire_datetime: '',
        $sender: process.env.WEBSOCKET_ROBOT_NAME
      },
      ...params
    })
  }

  replaceRead (params) {
    this.db.run(this.replaceIntoReadSQL, {
      ...{
        $user_id: '',
        $message_id: ''
      },
      ...params
    })
  }

  getLastReadId (userId, callback) {
    this.db.get(`SELECT * FROM read WHERE user_id = '${userId}' ORDER BY user_id DESC`, callback)
  }

  get (callback) {
    this.db.get("SELECT * FROM message ORDER BY id DESC", callback)
  }
}
module.exports = MessageDB