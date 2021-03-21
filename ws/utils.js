class SqliteDB {
  
  constructor (channel) {
    this.insSQL = "INSERT INTO message(title, content, create_datetime, expire_datetime, sender) VALUES ($title, $content, $create_datetime, $expire_datetime, $sender)"
    this.channel = channel

    const fs = require("fs")
    const path = require("path")
    const dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(dbDir)){
      fs.mkdirSync(dbDir)
    }

    const sqlite3 = require("sqlite3").verbose()
    this.db = new sqlite3.Database(path.join(dbDir, this.channel) + '.db')
    this.db.run(`
      CREATE TABLE IF NOT EXISTS "message" (
        "id"	INTEGER,
        "title"	TEXT,
        "content"	TEXT NOT NULL,
        "create_datetime"	TEXT NOT NULL,
        "expire_datetime"	TEXT,
        "sender"	TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
    `)
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

module.exports.SqliteDB = SqliteDB
