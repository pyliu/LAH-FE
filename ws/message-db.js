const fs = require("fs")
const path = require("path")

class MessageDB {
  
  constructor (channel) {
    this.insSQL = "INSERT INTO message(title, content, priority, create_datetime, expire_datetime, sender) VALUES ($title, $content, $priority, $create_datetime, $expire_datetime, $sender)"
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

  insert (params) {
    this.db.run(this.insSQL, {
      ...{
        $title: '',
        $content: '',
        $priority: 3,
        $create_datetime: this.timestamp(),
        $expire_datetime: '',
        $sender: '小桃子'
      },
      ...params
    })
  }

  get (callback) {
    this.db.get("SELECT * FROM message ORDER BY id DESC", callback)
  }
}
module.exports = MessageDB